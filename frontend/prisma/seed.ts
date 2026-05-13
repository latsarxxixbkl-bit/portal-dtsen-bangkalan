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
  kodeOpd: string;
  isInternal?: boolean;
};

const OPD_LIST: OpdSeed[] = [
  // Internal — pengelola alur DTSEN
  { nama: "Bapperida Kabupaten Bangkalan", jenis: "BADAN", kodeOpd: "BAPPERIDA", isInternal: true },
  { nama: "Dinas Komunikasi dan Informatika Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DISKOMINFO", isInternal: true },
  { nama: "Dinas Sosial Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DINSOS", isInternal: true },

  // Sekretariat
  { nama: "Sekretariat Daerah Kabupaten Bangkalan", jenis: "SEKRETARIAT", kodeOpd: "SETDA" },
  { nama: "Sekretariat DPRD Kabupaten Bangkalan", jenis: "SEKRETARIAT", kodeOpd: "SETWAN" },

  // Dinas
  { nama: "Dinas Pendidikan Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DISDIK" },
  { nama: "Dinas Kesehatan Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DINKES" },
  { nama: "Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DPUPR" },
  { nama: "Dinas Perumahan, Kawasan Permukiman, dan Perhubungan Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DPKPP" },
  { nama: "Dinas Kependudukan dan Pencatatan Sipil Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DUKCAPIL" },
  { nama: "Dinas Pemberdayaan Masyarakat dan Desa Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DPMD" },
  { nama: "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan KB Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DP3AP2KB" },
  { nama: "Dinas Tenaga Kerja dan Transmigrasi Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DISNAKERTRANS" },
  { nama: "Dinas Pertanian Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DISTAN" },
  { nama: "Dinas Peternakan dan Kesehatan Hewan Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DISNAKKESWAN" },
  { nama: "Dinas Perikanan Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DISKAN" },
  { nama: "Dinas Perindustrian dan Perdagangan Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DISPERINDAG" },
  { nama: "Dinas Koperasi dan Usaha Mikro Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DISKOPUM" },
  { nama: "Dinas Penanaman Modal dan PTSP Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DPMPTSP" },
  { nama: "Dinas Pemuda, Olahraga, Kebudayaan dan Pariwisata Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DISPORABUDPAR" },
  { nama: "Dinas Perpustakaan dan Kearsipan Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DISPUSIP" },
  { nama: "Dinas Lingkungan Hidup Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DLH" },
  { nama: "Dinas Pemadam Kebakaran Kabupaten Bangkalan", jenis: "DINAS", kodeOpd: "DAMKAR" },

  // Badan
  { nama: "Badan Kepegawaian dan Pengembangan SDM Kabupaten Bangkalan", jenis: "BADAN", kodeOpd: "BKPSDM" },
  { nama: "Badan Pendapatan Daerah Kabupaten Bangkalan", jenis: "BADAN", kodeOpd: "BAPENDA" },
  { nama: "Badan Keuangan Daerah Kabupaten Bangkalan", jenis: "BADAN", kodeOpd: "BKD" },
  { nama: "Badan Kesatuan Bangsa dan Politik Kabupaten Bangkalan", jenis: "BADAN", kodeOpd: "BAKESBANGPOL" },
  { nama: "Badan Penanggulangan Bencana Daerah Kabupaten Bangkalan", jenis: "BADAN", kodeOpd: "BPBD" },

  // Inspektorat
  { nama: "Inspektorat Kabupaten Bangkalan", jenis: "LAINNYA", kodeOpd: "INSPEKTORAT" },

  // Satpol PP
  { nama: "Satuan Polisi Pamong Praja Kabupaten Bangkalan", jenis: "LAINNYA", kodeOpd: "SATPOLPP" },

  // RSUD
  { nama: "RSUD Syamrabu Kabupaten Bangkalan", jenis: "RSUD", kodeOpd: "RSUDSYAMRABU" },

  // Kecamatan
  { nama: "Kecamatan Bangkalan", jenis: "KECAMATAN", kodeOpd: "KECBANGKALAN" },
  { nama: "Kecamatan Socah", jenis: "KECAMATAN", kodeOpd: "KECSOCAH" },
  { nama: "Kecamatan Burneh", jenis: "KECAMATAN", kodeOpd: "KECBURNEH" },
  { nama: "Kecamatan Kamal", jenis: "KECAMATAN", kodeOpd: "KECKAMAL" },
  { nama: "Kecamatan Arosbaya", jenis: "KECAMATAN", kodeOpd: "KECAROSBAYA" },
  { nama: "Kecamatan Geger", jenis: "KECAMATAN", kodeOpd: "KECGEGER" },
  { nama: "Kecamatan Klampis", jenis: "KECAMATAN", kodeOpd: "KECKLAMPIS" },
  { nama: "Kecamatan Sepulu", jenis: "KECAMATAN", kodeOpd: "KECSEPULU" },
  { nama: "Kecamatan Tanjung Bumi", jenis: "KECAMATAN", kodeOpd: "KECTANJUNGBUMI" },
  { nama: "Kecamatan Kokop", jenis: "KECAMATAN", kodeOpd: "KECKOKOP" },
  { nama: "Kecamatan Konang", jenis: "KECAMATAN", kodeOpd: "KECKONANG" },
  { nama: "Kecamatan Galis", jenis: "KECAMATAN", kodeOpd: "KECGALIS" },
  { nama: "Kecamatan Blega", jenis: "KECAMATAN", kodeOpd: "KECBLEGA" },
  { nama: "Kecamatan Modung", jenis: "KECAMATAN", kodeOpd: "KECMODUNG" },
  { nama: "Kecamatan Kwanyar", jenis: "KECAMATAN", kodeOpd: "KECKWANYAR" },
  { nama: "Kecamatan Tragah", jenis: "KECAMATAN", kodeOpd: "KECTRAGAH" },
  { nama: "Kecamatan Tanah Merah", jenis: "KECAMATAN", kodeOpd: "KECTANAHMERAH" },
  { nama: "Kecamatan Labang", jenis: "KECAMATAN", kodeOpd: "KECLABANG" },
];

async function main() {
  console.log("→ Seeding OPD …");
  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (const o of OPD_LIST) {
    const exists = await prisma.opd.findFirst({ where: { nama: o.nama } });
    if (exists) {
      // Update kodeOpd jika kosong/berbeda — supaya nomor surat UAT match.
      if (exists.kodeOpd !== o.kodeOpd) {
        await prisma.opd.update({ where: { id: exists.id }, data: { kodeOpd: o.kodeOpd } });
        updated++;
      } else {
        skipped++;
      }
      continue;
    }
    await prisma.opd.create({ data: o });
    created++;
  }
  console.log(`✓ Selesai: ${created} OPD dibuat, ${updated} kodeOpd di-update, ${skipped} sudah ada.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
