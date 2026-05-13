"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export type ProfilFormState =
  | undefined
  | { ok: true; message: string }
  | { ok: false; error: string };

const Schema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter").max(120),
  jabatan: z.string().max(120).optional(),
  nip: z.string().max(40).optional(),
  noHp: z.string().max(40).optional(),
});

export async function updateProfil(
  _prev: ProfilFormState,
  formData: FormData,
): Promise<ProfilFormState> {
  const user = await requireUser();
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Periksa kembali isian." };
  }
  const { nama, jabatan, nip, noHp } = parsed.data;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      nama,
      jabatan: jabatan || null,
      nip: nip || null,
      noHp: noHp || null,
    },
  });
  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard");
  return { ok: true, message: "Profil tersimpan." };
}
