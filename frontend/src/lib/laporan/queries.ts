import type { StatusLaporan, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type Scope = { userId: string; role: UserRole };

export function laporanListWhere(scope: Scope, statusFilter?: StatusLaporan[]) {
  const base = statusFilter?.length ? { status: { in: statusFilter } } : {};
  if (scope.role === "PEMOHON") return { ...base, pelaporId: scope.userId };
  if (scope.role === "VERIFIKATOR") {
    return {
      status: {
        in: statusFilter ?? (["REVIEW_BAPPERIDA"] as StatusLaporan[]),
      },
    };
  }
  if (scope.role === "PENGELOLA_DTSEN") {
    return {
      status: {
        in: statusFilter ?? (["REVIEW_DINSOS", "DISETUJUI"] as StatusLaporan[]),
      },
    };
  }
  // EWALI_DATA / ADMIN see all
  return base;
}

export async function fetchLaporanList(scope: Scope, statusFilter?: StatusLaporan[]) {
  return prisma.laporanPemanfaatan.findMany({
    where: laporanListWhere(scope, statusFilter),
    include: {
      pelapor: { select: { nama: true, email: true, opd: { select: { nama: true } } } },
      permohonan: { select: { judul: true, nomorSurat: true } },
    },
    orderBy: [{ deadlineAt: "asc" }, { updatedAt: "desc" }],
    take: 100,
  });
}

export async function fetchLaporanDetail(id: string) {
  return prisma.laporanPemanfaatan.findUnique({
    where: { id },
    include: {
      pelapor: { include: { opd: true } },
      permohonan: { include: { opdPemohon: true, berkasDtsen: true } },
      reviewerBapperida: { select: { nama: true } },
      reviewerDinsos: { select: { nama: true } },
      riwayat: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { nama: true, role: true } } },
      },
    },
  });
}

/**
 * Daftar permohonan milik pemohon yang sudah dapat Berkas DTSEN (status SELESAI)
 * dan laporannya masih bisa diisi/diedit (belum DISETUJUI/REVIEW_DINSOS).
 * Dipakai oleh dialog "Tambah Pelaporan" di halaman /dashboard/laporan.
 */
export async function fetchEligiblePermohonanForLaporan(userId: string) {
  return prisma.permohonan.findMany({
    where: {
      pemohonId: userId,
      status: "SELESAI",
      laporan: {
        // Hanya yang masih perlu diisi pemohon
        status: { in: ["BELUM_DIKIRIM", "MENUNGGAK", "PERLU_REVISI"] },
      },
    },
    select: {
      id: true,
      judul: true,
      nomorSurat: true,
      laporan: {
        select: {
          id: true,
          status: true,
          deadlineAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export function canViewLaporan(
  user: { id: string; role: UserRole },
  laporan: { pelaporId: string },
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "PEMOHON") return laporan.pelaporId === user.id;
  return ["VERIFIKATOR", "EWALI_DATA", "PENGELOLA_DTSEN"].includes(user.role);
}
