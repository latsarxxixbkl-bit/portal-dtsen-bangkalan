"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient as createSupabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const LoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const DaftarSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string(),
  opdId: z.string().uuid("Wajib pilih OPD"),
  nip: z.string().optional(),
  jabatan: z.string().optional(),
  noHp: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

const ResetSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export type AuthState =
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
  | { ok: true; message?: string }
  | undefined;

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const tree = z.treeifyError(parsed.error);
    return {
      ok: false,
      error: "Periksa kembali isian.",
      fieldErrors: flattenFieldErrors(tree),
    };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { ok: false, error: errorMessage(error.message) };
  }

  // Update last login
  try {
    await prisma.user.updateMany({
      where: { email: parsed.data.email.toLowerCase() },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    // non-fatal
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function daftarAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = Object.fromEntries(formData);
  const parsed = DaftarSchema.safeParse(raw);
  if (!parsed.success) {
    const tree = z.treeifyError(parsed.error);
    return {
      ok: false,
      error: "Periksa kembali isian.",
      fieldErrors: flattenFieldErrors(tree),
    };
  }

  const email = parsed.data.email.toLowerCase();

  // Reject duplicate email in our users table
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Email sudah terdaftar." };
  }

  // Ensure OPD exists
  const opd = await prisma.opd.findUnique({ where: { id: parsed.data.opdId } });
  if (!opd) {
    return { ok: false, error: "OPD tidak ditemukan." };
  }

  const supabase = await createSupabaseServer();
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      data: {
        nama: parsed.data.nama,
      },
    },
  });

  if (signUpErr) {
    return { ok: false, error: errorMessage(signUpErr.message) };
  }

  const authUserId = signUpData.user?.id ?? null;
  await prisma.user.create({
    data: {
      authUserId: authUserId ?? undefined,
      email,
      nama: parsed.data.nama,
      nip: parsed.data.nip || null,
      jabatan: parsed.data.jabatan || null,
      noHp: parsed.data.noHp || null,
      role: "PEMOHON",
      opdId: parsed.data.opdId,
      isActive: true,
    },
  });

  return {
    ok: true,
    message:
      signUpData.session
        ? "Pendaftaran berhasil! Mengarahkan ke dashboard…"
        : "Pendaftaran berhasil. Cek email Kak untuk verifikasi sebelum masuk.",
  };
}

export async function logoutAction() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = ResetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Email tidak valid",
    };
  }

  const supabase = await createSupabaseServer();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) {
    return { ok: false, error: errorMessage(error.message) };
  }
  return { ok: true, message: "Link reset password sudah dikirim ke email." };
}

function errorMessage(msg: string): string {
  const dict: Record<string, string> = {
    "Invalid login credentials": "Email atau password salah.",
    "Email not confirmed": "Email belum dikonfirmasi. Cek inbox Kak.",
    "User already registered": "Email sudah terdaftar.",
  };
  return dict[msg] ?? msg;
}

type ZTree = ReturnType<typeof z.treeifyError>;
function flattenFieldErrors(tree: ZTree): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const props = (tree as { properties?: Record<string, ZTree> }).properties;
  if (!props) return out;
  for (const [key, child] of Object.entries(props)) {
    const errors = (child as { errors?: string[] }).errors;
    if (errors && errors.length) out[key] = errors;
  }
  return out;
}
