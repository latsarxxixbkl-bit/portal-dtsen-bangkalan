/**
 * Seed master data for Portal DTSEN Bangkalan.
 * Daftar OPD diambil dari rilis publik Pemkab Bangkalan & instansi internal pengelola DTSEN.
 *
 * Jalankan: `npx tsx prisma/seed.ts`
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { prisma } from "../src/lib/prisma";

type OpdSeed = {
  nama: string;
  jenis:
    | "DINAS"
    | "BADAN"
    | "KANTOR"
    | "KECAMATAN"
    | "KELURAHAN"
    | "RSUD"
    | "SEKRETARIAT"
    | "LAINNYA";
  isInternal?: boolean;
};

const OPD_LIST: OpdSeed[] = [
  // Internal — pengelola alur DTSEN
  {
    nama: "Bapperida Kabupaten Bangkalan",
    jenis: "BADAN",
    isInternal: true,
  },
  {
    nama: "Dinas Komunikasi dan Informatika Kabupaten Bangkalan",
    jenis: "DINAS",
    isInternal: true,
  },
  {
    nama: "Dinas Sosial Kabupaten Bangkalan",
    jenis: "DINAS",
    isInternal: true,
  },

  // Sekretariat
  { nama: "Sekretariat Daerah Kabupaten Bangkalan", jenis: "SEKRETARIAT" },
  { nama: "Sekretariat DPRD Kabupaten Bangkalan", jenis: "SEKRETARIAT" },

  // Dinas
  { nama: "Dinas Pendidikan Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Kesehatan Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Perumahan, Kawasan Permukiman, dan Perhubungan Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Kependudukan dan Pencatatan Sipil Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Pemberdayaan Masyarakat dan Desa Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan KB Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Tenaga Kerja dan Transmigrasi Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Pertanian Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Peternakan dan Kesehatan Hewan Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Perikanan Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Perindustrian dan Perdagangan Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Koperasi dan Usaha Mikro Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Penanaman Modal dan PTSP Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Pemuda, Olahraga, Kebudayaan dan Pariwisata Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Perpustakaan dan Kearsipan Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Lingkungan Hidup Kabupaten Bangkalan", jenis: "DINAS" },
  { nama: "Dinas Pemadam Kebakaran Kabupaten Bangkalan", jenis: "DINAS" },

  // Badan
  { nama: "Badan Kepegawaian dan Pengembangan SDM Kabupaten Bangkalan", jenis: "BADAN" },
  { nama: "Badan Pendapatan Daerah Kabupaten Bangkalan", jenis: "BADAN" },
  { nama: "Badan Keuangan Daerah Kabupaten Bangkalan", jenis: "BADAN" },
  { nama: "Badan Kesatuan Bangsa dan Politik Kabupaten Bangkalan", jenis: "BADAN" },
  { nama: "Badan Penanggulangan Bencana Daerah Kabupaten Bangkalan", jenis: "BADAN" },

  // Inspektorat
  { nama: "Inspektorat Kabupaten Bangkalan", jenis: "LAINNYA" },

  // Satpol PP
  { nama: "Satuan Polisi Pamong Praja Kabupaten Bangkalan", jenis: "LAINNYA" },

  // RSUD
  { nama: "RSUD Syamrabu Kabupaten Bangkalan", jenis: "RSUD" },

  // Kecamatan (sampling — bisa ditambah belakangan)
  { nama: "Kecamatan Bangkalan", jenis: "KECAMATAN" },
  { nama: "Kecamatan Socah", jenis: "KECAMATAN" },
  { nama: "Kecamatan Burneh", jenis: "KECAMATAN" },
  { nama: "Kecamatan Kamal", jenis: "KECAMATAN" },
  { nama: "Kecamatan Arosbaya", jenis: "KECAMATAN" },
  { nama: "Kecamatan Geger", jenis: "KECAMATAN" },
  { nama: "Kecamatan Klampis", jenis: "KECAMATAN" },
  { nama: "Kecamatan Sepulu", jenis: "KECAMATAN" },
  { nama: "Kecamatan Tanjung Bumi", jenis: "KECAMATAN" },
  { nama: "Kecamatan Kokop", jenis: "KECAMATAN" },
  { nama: "Kecamatan Konang", jenis: "KECAMATAN" },
  { nama: "Kecamatan Galis", jenis: "KECAMATAN" },
  { nama: "Kecamatan Blega", jenis: "KECAMATAN" },
  { nama: "Kecamatan Modung", jenis: "KECAMATAN" },
  { nama: "Kecamatan Kwanyar", jenis: "KECAMATAN" },
  { nama: "Kecamatan Tragah", jenis: "KECAMATAN" },
  { nama: "Kecamatan Tanah Merah", jenis: "KECAMATAN" },
  { nama: "Kecamatan Labang", jenis: "KECAMATAN" },
];

async function main() {
  console.log("→ Seeding OPD …");
  let created = 0;
  let skipped = 0;
  for (const o of OPD_LIST) {
    const exists = await prisma.opd.findFirst({ where: { nama: o.nama } });
    if (exists) {
      skipped++;
      continue;
    }
    await prisma.opd.create({ data: o });
    created++;
  }
  console.log(`✓ Selesai: ${created} OPD dibuat, ${skipped} sudah ada.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
