import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { listPermohonanWhere } from "@/lib/permohonan/queries";
import { STATUS_PERMOHONAN_LABEL } from "@/lib/constants";
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

  const baseWhere = listPermohonanWhere({
    role: user.role,
    userId: user.id,
    opdId: user.opdId ?? null,
  });
  const where = {
    ...baseWhere,
    ...(status ? { status: status as never } : {}),
  };

  const rows = await prisma.permohonan.findMany({
    where,
    include: {
      opdPemohon: { select: { nama: true } },
      pemohon: { select: { nama: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  if (rows.length === 0) {
    redirect("/dashboard/permohonan?empty=1");
  }

  const csv = toCsv([
    [
      "Nomor Surat",
      "Judul",
      "Status",
      "OPD Pemohon",
      "Pemohon",
      "Email Pemohon",
      "Jenis Data",
      "Periode Awal",
      "Periode Akhir",
      "Diajukan",
      "Diperbarui",
    ],
    ...rows.map((p) => [
      p.nomorSurat ?? "—",
      p.judul,
      STATUS_PERMOHONAN_LABEL[p.status] ?? p.status,
      p.opdPemohon.nama,
      p.pemohon.nama,
      p.pemohon.email,
      p.jenisDataDiminta,
      p.periodeAwal ? fmt.format(p.periodeAwal) : "",
      p.periodeAkhir ? fmt.format(p.periodeAkhir) : "",
      p.diajukanAt ? fmt.format(p.diajukanAt) : "",
      fmt.format(p.updatedAt),
    ]),
  ]);

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(`permohonan-dtsen-${date}.csv`, csv);
}
