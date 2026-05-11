import type { StatusPermohonan, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type Scope = {
  userId: string;
  role: UserRole;
  opdId: string | null;
};

/** Filter list permohonan sesuai role. */
export function listPermohonanWhere(scope: Scope, statusFilter?: StatusPermohonan[]) {
  const base = statusFilter?.length ? { status: { in: statusFilter } } : {};

  if (scope.role === "PEMOHON") {
    return { ...base, pemohonId: scope.userId };
  }

  if (scope.role === "VERIFIKATOR") {
    return {
      ...base,
      status: { in: statusFilter ?? ["VERIFIKATOR_REVIEW", "DIKEMBALIKAN_KE_VERIFIKATOR", "DIAJUKAN"] },
    };
  }
  if (scope.role === "EWALI_DATA") {
    return {
      ...base,
      status: { in: statusFilter ?? ["EWALI_REVIEW", "DIKEMBALIKAN_KE_EWALI"] },
    };
  }
  if (scope.role === "PENGELOLA_DTSEN") {
    return {
      ...base,
      status: { in: statusFilter ?? ["DTSEN_REVIEW", "DIKEMBALIKAN_KE_EWALI", "DISETUJUI", "SELESAI"] },
    };
  }
  // ADMIN: lihat semua
  return base;
}

export async function fetchPermohonanList(
  scope: Scope,
  opts: { statusFilter?: StatusPermohonan[]; take?: number; skip?: number } = {},
) {
  const where = listPermohonanWhere(scope, opts.statusFilter);
  return prisma.permohonan.findMany({
    where,
    include: {
      opdPemohon: { select: { nama: true } },
      pemohon: { select: { nama: true, email: true } },
      _count: { select: { dokumen: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: opts.take ?? 50,
    skip: opts.skip ?? 0,
  });
}

export async function fetchPermohonanDetail(id: string) {
  return prisma.permohonan.findUnique({
    where: { id },
    include: {
      opdPemohon: true,
      pemohon: { include: { opd: true } },
      dokumen: { orderBy: { jenisDokumen: "asc" } },
      riwayat: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { nama: true, role: true } } },
      },
      berkasDtsen: true,
      laporan: true,
    },
  });
}
