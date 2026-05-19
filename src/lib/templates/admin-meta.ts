// Konstanta untuk Template Surat (5 tipe). Server + client safe (no "use server").
import type { FormatTemplate, TipeTemplate } from "@prisma/client";

export const TEMPLATE_TIPE: {
  tipe: TipeTemplate;
  slug: string;
  judul: string;
  ringkasan: string;
}[] = [
  {
    tipe: "SURAT_PERMINTAAN",
    slug: "surat-permintaan",
    judul: "Surat Permintaan Data DTSEN",
    ringkasan:
      "Surat resmi dari Kepala OPD ke Bupati Bangkalan untuk meminta data DTSEN sesuai kebutuhan program.",
  },
  {
    tipe: "KAK",
    slug: "kak",
    judul: "Kerangka Acuan Kerja (KAK)",
    ringkasan:
      "Dokumen KAK berisi latar belakang, tujuan, ruang lingkup, dan keluaran pemanfaatan data DTSEN.",
  },
  {
    tipe: "PAKTA_INTEGRITAS",
    slug: "pakta-integritas",
    judul: "Pakta Integritas",
    ringkasan:
      "Surat pernyataan integritas yang ditandatangani Kepala OPD terkait pemanfaatan data DTSEN.",
  },
  {
    tipe: "NDA",
    slug: "nda",
    judul: "Non-Disclosure Agreement (NDA)",
    ringkasan:
      "Perjanjian kerahasiaan untuk menjaga data DTSEN tidak disebarluaskan di luar tujuan permohonan.",
  },
  {
    tipe: "LAPORAN_PEMANFAATAN",
    slug: "laporan-pemanfaatan",
    judul: "Laporan Pemanfaatan Data DTSEN",
    ringkasan:
      "Format laporan pemanfaatan yang dikirim Pemohon 30 hari setelah berkas DTSEN diterima.",
  },
];

const SLUG_TO_TIPE: Record<string, TipeTemplate> = Object.fromEntries(
  TEMPLATE_TIPE.map((t) => [t.slug, t.tipe]),
);

export function tipeFromSlug(slug: string): TipeTemplate | null {
  return SLUG_TO_TIPE[slug] ?? null;
}

export function metaForTipe(tipe: TipeTemplate) {
  return TEMPLATE_TIPE.find((t) => t.tipe === tipe);
}

export function defaultFilename(tipe: TipeTemplate, format: FormatTemplate): string {
  const meta = metaForTipe(tipe);
  const slug = meta?.slug ?? tipe.toLowerCase();
  const ext = format === "PDF" ? "pdf" : "docx";
  return `template-${slug}.${ext}`;
}
