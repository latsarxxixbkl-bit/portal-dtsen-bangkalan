// Shared constants for Portal DTSEN Bangkalan.

export const APP_NAME = "Portal DTSEN Bangkalan";
export const APP_DESCRIPTION =
  "Portal Pengelolaan Izin Pemanfaatan Data DTSEN Kabupaten Bangkalan.";
export const APP_TAGLINE = "Akuntabel, Cepat, Terdokumentasi.";

export const ROLES = {
  PEMOHON: "Pemohon",
  VERIFIKATOR: "Verifikator",
  EWALI_DATA: "E-Wali Data",
  PENGELOLA_DTSEN: "Pengelola Data DTSEN",
  ADMIN: "Administrator",
} as const;

export const ROLE_DESCRIPTIONS: Record<keyof typeof ROLES, string> = {
  PEMOHON: "Perangkat Daerah Pemohon",
  VERIFIKATOR: "Bapperida Kabupaten Bangkalan",
  EWALI_DATA: "Diskominfo Kabupaten Bangkalan",
  PENGELOLA_DTSEN: "Dinas Sosial Kabupaten Bangkalan",
  ADMIN: "Administrator Sistem",
};

export const DOKUMEN_WAJIB = [
  {
    id: "SURAT_PERMINTAAN",
    nama: "Surat Permintaan Akses DTSEN",
    deskripsi:
      "Surat resmi dari pimpinan OPD pemohon yang ditujukan ke Bapperida.",
  },
  {
    id: "KAK",
    nama: "Kerangka Acuan Kerja (KAK)",
    deskripsi:
      "Dokumen yang menjelaskan tujuan, ruang lingkup, dan output kegiatan yang membutuhkan data DTSEN.",
  },
  {
    id: "PAKTA_INTEGRITAS",
    nama: "Pakta Integritas",
    deskripsi:
      "Pernyataan komitmen penggunaan data sesuai peruntukan dan ketentuan.",
  },
  {
    id: "NDA",
    nama: "Non-Disclosure Agreement (NDA)",
    deskripsi:
      "Perjanjian kerahasiaan data antara OPD pemohon dengan Pemkab Bangkalan.",
  },
] as const;

export const PELAPORAN_DEADLINE_DAYS = 30;

export const STATUS_PERMOHONAN_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  DIAJUKAN: "Diajukan",
  VERIFIKATOR_REVIEW: "Direview Bapperida",
  DITOLAK_VERIFIKATOR: "Ditolak Bapperida",
  EWALI_REVIEW: "Direview Diskominfo",
  DIKEMBALIKAN_KE_VERIFIKATOR: "Dikembalikan ke Bapperida",
  DTSEN_REVIEW: "Direview Dinsos",
  DIKEMBALIKAN_KE_EWALI: "Dikembalikan ke Diskominfo",
  DISETUJUI: "Disetujui",
  SELESAI: "Selesai",
};

export const STATUS_LAPORAN_LABEL: Record<string, string> = {
  BELUM_DIKIRIM: "Belum Dikirim",
  MENUNGGAK: "Menunggak",
  REVIEW_BAPPERIDA: "Direview Bapperida",
  REVIEW_DINSOS: "Direview Dinsos",
  PERLU_REVISI: "Perlu Revisi",
  DISETUJUI: "Disetujui",
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME = ["application/pdf"];
