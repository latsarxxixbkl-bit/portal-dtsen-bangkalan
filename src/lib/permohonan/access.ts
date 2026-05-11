import type { Permohonan, UserRole } from "@prisma/client";

import type { SessionUser } from "@/lib/auth/session";

/** Bisakah user ini melihat permohonan tertentu? */
export function canViewPermohonan(
  user: SessionUser,
  permohonan: Pick<Permohonan, "pemohonId" | "status">,
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "PEMOHON") return permohonan.pemohonId === user.id;
  // Internal roles (Verifikator, E-Wali, Pengelola) bisa lihat semua permohonan
  // demi auditabilitas alur (tidak hanya yang sedang di antrian mereka).
  const internal: UserRole[] = ["VERIFIKATOR", "EWALI_DATA", "PENGELOLA_DTSEN"];
  return internal.includes(user.role);
}
