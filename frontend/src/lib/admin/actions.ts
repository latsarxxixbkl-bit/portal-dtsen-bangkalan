"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AdminFormState =
  | undefined
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

// ── Users ──────────────────────────────────────────────────────────────────

const UpdateUserSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["PEMOHON", "VERIFIKATOR", "EWALI_DATA", "PENGELOLA_DTSEN", "ADMIN"]),
  opdId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  nama: z.string().min(2).max(120),
  jabatan: z.string().max(120).optional().or(z.literal("")),
  nip: z.string().max(40).optional().or(z.literal("")),
  noHp: z.string().max(40).optional().or(z.literal("")),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export async function updateUser(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireRole(["ADMIN"]);
  const parsed = UpdateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Periksa kembali isian." };
  }
  const data = parsed.data;

  // Pemohon wajib punya OPD
  if (data.role === "PEMOHON" && !data.opdId) {
    return {
      ok: false,
      error: "Pemohon wajib terkait dengan OPD.",
      fieldErrors: { opdId: ["Wajib pilih OPD."] },
    };
  }

  await prisma.user.update({
    where: { id: data.id },
    data: {
      role: data.role as UserRole,
      opdId: data.opdId ?? null,
      nama: data.nama,
      jabatan: data.jabatan || null,
      nip: data.nip || null,
      noHp: data.noHp || null,
      isActive: data.isActive,
    },
  });

  revalidatePath("/dashboard/admin/users");
  return { ok: true, message: "Profil pengguna diperbarui." };
}

const InviteSchema = z.object({
  email: z.string().email("Email tidak valid"),
  nama: z.string().min(2, "Nama minimal 2 karakter").max(120),
  role: z.enum(["PEMOHON", "VERIFIKATOR", "EWALI_DATA", "PENGELOLA_DTSEN", "ADMIN"]),
  opdId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function inviteUser(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireRole(["ADMIN"]);
  const parsed = InviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Periksa kembali isian.",
      fieldErrors: flattenZod(parsed.error),
    };
  }
  const { email, nama, role, opdId } = parsed.data;
  if (role === "PEMOHON" && !opdId) {
    return { ok: false, error: "Pemohon wajib terkait dengan OPD." };
  }

  // Cek email sudah ada di DB
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Email sudah terdaftar di sistem." };
  }

  // Buat auth user via Supabase Admin API (kirim invitation email)
  const supabase = createAdminSupabaseClient();
  const { data: created, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { nama, role },
  });
  if (error) {
    return { ok: false, error: `Gagal mengundang: ${error.message}` };
  }

  await prisma.user.create({
    data: {
      authUserId: created.user?.id,
      email,
      nama,
      role: role as UserRole,
      opdId: opdId ?? null,
      isActive: true,
    },
  });

  revalidatePath("/dashboard/admin/users");
  return { ok: true, message: `Undangan terkirim ke ${email}.` };
}

export async function toggleUserActive(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const u = await prisma.user.findUnique({ where: { id }, select: { isActive: true } });
  if (!u) return;
  await prisma.user.update({
    where: { id },
    data: { isActive: !u.isActive },
  });
  revalidatePath("/dashboard/admin/users");
}

// ── OPD ────────────────────────────────────────────────────────────────────

const OpdSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  kodeOpd: z.string().min(1).max(20),
  nama: z.string().min(2).max(200),
  jenis: z.enum(["DINAS", "BADAN", "KANTOR", "KECAMATAN", "KELURAHAN", "RSUD", "SEKRETARIAT", "LAINNYA"]),
  alamat: z.string().max(300).optional().or(z.literal("")),
  emailResmi: z.string().email().optional().or(z.literal("")),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export async function upsertOpd(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireRole(["ADMIN"]);
  const parsed = OpdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Periksa kembali isian.",
      fieldErrors: flattenZod(parsed.error),
    };
  }
  const { id, kodeOpd, nama, jenis, alamat, emailResmi, isActive } = parsed.data;
  const payload = {
    kodeOpd,
    nama,
    jenis,
    alamat: alamat || null,
    emailResmi: emailResmi || null,
    isActive,
  };

  if (id) {
    await prisma.opd.update({ where: { id }, data: payload });
  } else {
    // Cek duplikat kode/nama
    const dup = await prisma.opd.findFirst({
      where: { OR: [{ kodeOpd }, { nama }] },
      select: { id: true },
    });
    if (dup) return { ok: false, error: "Kode atau nama OPD sudah dipakai." };
    await prisma.opd.create({ data: payload });
  }

  revalidatePath("/dashboard/admin/opd");
  return { ok: true, message: id ? "OPD diperbarui." : "OPD ditambahkan." };
}

function flattenZod(err: z.ZodError): Record<string, string[]> {
  const tree = z.treeifyError(err);
  const props = (tree as { properties?: Record<string, { errors?: string[] }> }).properties;
  const out: Record<string, string[]> = {};
  if (!props) return out;
  for (const [k, v] of Object.entries(props)) {
    if (v.errors?.length) out[k] = v.errors;
  }
  return out;
}
