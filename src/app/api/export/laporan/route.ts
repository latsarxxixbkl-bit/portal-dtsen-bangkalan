import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { laporanListWhere } from "@/lib/laporan/queries";
import { STATUS_LAPORAN_LABEL } from "@/lib/constants";
import { csvResponse, toCsv } from "@/lib/export/csv";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const baseWhere = laporanListWhere({
    role: user.role,
    userId: user.id,
  });
  const where = {
    ...baseWhere,
    ...(status ? { status: status as never } : {}),
  };

  const rows = await prisma.laporanPemanfaatan.findMany({
    where,
    include: {
      permohonan: {
        select: {
          judul: true,
          nomorSurat: true,
          opdPemohon: { select: { nama: true } },
        },
      },
      pelapor: { select: { nama: true, email: true } },
    },
    orderBy: { deadlineAt: "asc" },
    take: 5000,
  });

  if (rows.length === 0) {
    redirect("/dashboard/laporan?empty=1");
  }

  const csv = toCsv([
    [
      "Nomor Permohonan",
      "Judul Permohonan",
      "Judul Kegiatan",
      "OPD",
      "Pelapor",
      "Email",
      "Status",
      "Periode Mulai",
      "Periode Selesai",
      "Deadline",
      "Dikirim",
      "Disetujui",
    ],
    ...rows.map((l) => [
      l.permohonan.nomorSurat ?? "—",
      l.permohonan.judul,
      l.judulKegiatan ?? "",
      l.permohonan.opdPemohon.nama,
      l.pelapor.nama,
      l.pelapor.email,
      STATUS_LAPORAN_LABEL[l.status] ?? l.status,
      l.periodeMulai ? fmt.format(l.periodeMulai) : "",
      l.periodeSelesai ? fmt.format(l.periodeSelesai) : "",
      fmt.format(l.deadlineAt),
      l.dikirimAt ? fmt.format(l.dikirimAt) : "",
      l.disetujuiAt ? fmt.format(l.disetujuiAt) : "",
    ]),
  ]);

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(`laporan-dtsen-${date}.csv`, csv);
}
