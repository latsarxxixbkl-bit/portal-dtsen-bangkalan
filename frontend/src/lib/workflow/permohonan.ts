// State machine untuk Permohonan Data DTSEN.
//
// Alur:
//   DRAFT
//     └─ Pemohon → AJUKAN          → VERIFIKATOR_REVIEW
//   VERIFIKATOR_REVIEW (Bapperida)
//     ├─ TOLAK                     → DITOLAK_VERIFIKATOR (terminal)
//     ├─ KEMBALIKAN (revisi)       → DRAFT
//     └─ TERUSKAN                  → EWALI_REVIEW
//   EWALI_REVIEW (Diskominfo)
//     ├─ KEMBALIKAN (ke Bapperida) → DIKEMBALIKAN_KE_VERIFIKATOR → (Bapperida tindak) → EWALI_REVIEW
//     └─ TERUSKAN                  → DTSEN_REVIEW
//   DTSEN_REVIEW (Dinsos)
//     ├─ KEMBALIKAN (ke E-Wali)    → DIKEMBALIKAN_KE_EWALI       → (E-Wali tindak) → DTSEN_REVIEW
//     └─ SETUJUI                   → DISETUJUI
//   DISETUJUI
//     └─ Dinsos UPLOAD_DATA        → SELESAI (Berkas DTSEN diserahkan, Laporan dibuat)
//
// State terminal: DITOLAK_VERIFIKATOR, SELESAI.
import type { AksiPermohonan, StatusPermohonan, UserRole } from "@prisma/client";

export type WorkflowAction = {
  aksi: AksiPermohonan;
  label: string;
  description?: string;
  /** Status setelah aksi diterapkan. */
  toStatus: StatusPermohonan;
  /** Apakah aksi wajib menyertakan catatan? */
  requiresNote: boolean;
  /** Variant tombol untuk UI (mengikuti shadcn). */
  intent: "default" | "destructive" | "outline" | "secondary";
};

/** Pemetaan status → role yang sedang menangani. */
export const STATUS_HANDLER: Record<StatusPermohonan, UserRole | null> = {
  DRAFT: "PEMOHON",
  DIAJUKAN: "VERIFIKATOR",
  VERIFIKATOR_REVIEW: "VERIFIKATOR",
  DITOLAK_VERIFIKATOR: null,
  EWALI_REVIEW: "EWALI_DATA",
  DIKEMBALIKAN_KE_VERIFIKATOR: "VERIFIKATOR",
  DTSEN_REVIEW: "PENGELOLA_DTSEN",
  DIKEMBALIKAN_KE_EWALI: "EWALI_DATA",
  DISETUJUI: "PENGELOLA_DTSEN",
  SELESAI: null,
};

/**
 * Daftar aksi yang tersedia untuk kombinasi (role pengguna, status saat ini).
 * Aksi global "REVISI/KEMBALIKAN_KE_PEMOHON" oleh Bapperida memetakan kembali ke DRAFT.
 */
export function availableActions(
  status: StatusPermohonan,
  role: UserRole,
): WorkflowAction[] {
  switch (status) {
    case "DRAFT":
      if (role === "PEMOHON") {
        return [
          {
            aksi: "AJUKAN",
            label: "Ajukan Permohonan",
            description: "Kirim ke Verifikator Bapperida.",
            toStatus: "VERIFIKATOR_REVIEW",
            requiresNote: false,
            intent: "default",
          },
        ];
      }
      return [];

    case "VERIFIKATOR_REVIEW":
    case "DIKEMBALIKAN_KE_VERIFIKATOR":
      if (role === "VERIFIKATOR" || role === "ADMIN") {
        return [
          {
            aksi: "TERUSKAN",
            label: "Teruskan ke E-Wali",
            toStatus: "EWALI_REVIEW",
            requiresNote: false,
            intent: "default",
          },
          {
            aksi: "KEMBALIKAN",
            label: "Kembalikan ke Pemohon",
            description: "Perlu revisi sebelum diteruskan.",
            toStatus: "DRAFT",
            requiresNote: true,
            intent: "secondary",
          },
          {
            aksi: "TOLAK",
            label: "Tolak Permohonan",
            description: "Permohonan tidak memenuhi syarat.",
            toStatus: "DITOLAK_VERIFIKATOR",
            requiresNote: true,
            intent: "destructive",
          },
        ];
      }
      return [];

    case "EWALI_REVIEW":
      if (role === "EWALI_DATA" || role === "ADMIN") {
        return [
          {
            aksi: "TERUSKAN",
            label: "Teruskan ke Pengelola DTSEN",
            toStatus: "DTSEN_REVIEW",
            requiresNote: false,
            intent: "default",
          },
          {
            aksi: "KEMBALIKAN",
            label: "Kembalikan ke Verifikator",
            description: "Butuh klarifikasi dari Bapperida.",
            toStatus: "DIKEMBALIKAN_KE_VERIFIKATOR",
            requiresNote: true,
            intent: "secondary",
          },
        ];
      }
      return [];

    case "DTSEN_REVIEW":
    case "DIKEMBALIKAN_KE_EWALI":
      if (role === "PENGELOLA_DTSEN" || role === "ADMIN") {
        return [
          {
            aksi: "SETUJUI",
            label: "Setujui Permohonan",
            description: "Lanjut ke penyerahan Berkas DTSEN.",
            toStatus: "DISETUJUI",
            requiresNote: false,
            intent: "default",
          },
          {
            aksi: "KEMBALIKAN",
            label: "Kembalikan ke E-Wali",
            description: "Butuh validasi ulang.",
            toStatus: "DIKEMBALIKAN_KE_EWALI",
            requiresNote: true,
            intent: "secondary",
          },
        ];
      }
      return [];

    case "DISETUJUI":
      if (role === "PENGELOLA_DTSEN" || role === "ADMIN") {
        return [
          {
            aksi: "UPLOAD_DATA",
            label: "Unggah Berkas DTSEN",
            description: "Serahkan data ke Pemohon. Pelaporan otomatis dibuat (30 hari).",
            toStatus: "SELESAI",
            requiresNote: false,
            intent: "default",
          },
        ];
      }
      return [];

    case "DIAJUKAN":
      // Status transisi sementara untuk back-compat; handler sama dengan VERIFIKATOR_REVIEW.
      if (role === "VERIFIKATOR" || role === "ADMIN") {
        return availableActions("VERIFIKATOR_REVIEW", role);
      }
      return [];

    case "DITOLAK_VERIFIKATOR":
    case "SELESAI":
      return [];

    default: {
      const _exhaustive: never = status;
      void _exhaustive;
      return [];
    }
  }
}

export function statusBadgeVariant(
  status: StatusPermohonan,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "DISETUJUI":
    case "SELESAI":
      return "default";
    case "DITOLAK_VERIFIKATOR":
      return "destructive";
    case "DRAFT":
      return "outline";
    default:
      return "secondary";
  }
}
