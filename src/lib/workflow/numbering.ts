// Penomoran surat untuk Permohonan & Berkas DTSEN.
// Format: 001/PORTAL-DTSEN/{KODE_OPD|GEN}/{ROMAWI_BULAN}/{TAHUN}
//
// Sequence per (OPD, tahun, bulan). Karena kita single-writer (server actions
// jalan di Vercel serverless tapi DB serial), pakai count + 1 di transaksi.
import { prisma } from "@/lib/prisma";

const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

export async function generateNomorSurat(
  opdId: string,
  diajukanAt = new Date(),
): Promise<string> {
  const opd = await prisma.opd.findUnique({ where: { id: opdId } });
  const kode = (opd?.kodeOpd ?? "OPD").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const tahun = diajukanAt.getFullYear();
  const bulan = ROMAN_MONTHS[diajukanAt.getMonth()];

  const startOfYear = new Date(tahun, 0, 1);
  const endOfYear = new Date(tahun + 1, 0, 1);

  const count = await prisma.permohonan.count({
    where: {
      opdPemohonId: opdId,
      diajukanAt: { gte: startOfYear, lt: endOfYear, not: null },
    },
  });

  const seq = String(count + 1).padStart(3, "0");
  return `${seq}/PORTAL-DTSEN/${kode}/${bulan}/${tahun}`;
}
