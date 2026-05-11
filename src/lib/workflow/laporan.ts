// State machine untuk Laporan Pemanfaatan.
//
// Alur:
//   BELUM_DIKIRIM (otomatis dibuat saat berkas DTSEN diserahkan)
//     └─ Pemohon KIRIM           → REVIEW_BAPPERIDA
//   MENUNGGAK (otomatis bila deadline terlewat & status masih BELUM_DIKIRIM/PERLU_REVISI)
//     └─ Pemohon KIRIM           → REVIEW_BAPPERIDA
//   REVIEW_BAPPERIDA
//     ├─ Bapperida MINTA_REVISI  → PERLU_REVISI
//     └─ Bapperida SETUJUI       → REVIEW_DINSOS
//   REVIEW_DINSOS
//     ├─ Dinsos MINTA_REVISI     → PERLU_REVISI
//     └─ Dinsos SETUJUI          → DISETUJUI (final)
//   PERLU_REVISI
//     └─ Pemohon KIRIM ulang     → REVIEW_BAPPERIDA
import type { AksiLaporan, StatusLaporan, UserRole } from "@prisma/client";

export type LaporanWorkflowAction = {
  aksi: AksiLaporan;
  label: string;
  description?: string;
  toStatus: StatusLaporan;
  requiresNote: boolean;
  intent: "default" | "destructive" | "outline" | "secondary";
};

export function laporanAvailableActions(
  status: StatusLaporan,
  role: UserRole,
): LaporanWorkflowAction[] {
  switch (status) {
    case "BELUM_DIKIRIM":
    case "MENUNGGAK":
    case "PERLU_REVISI":
      if (role === "PEMOHON" || role === "ADMIN") {
        return [
          {
            aksi: "KIRIM",
            label: "Kirim Laporan",
            description: "Kirim laporan ke Verifikator Bapperida untuk direview.",
            toStatus: "REVIEW_BAPPERIDA",
            requiresNote: false,
            intent: "default",
          },
        ];
      }
      return [];

    case "REVIEW_BAPPERIDA":
      if (role === "VERIFIKATOR" || role === "ADMIN") {
        return [
          {
            aksi: "SETUJUI_BAPPERIDA",
            label: "Setujui & Teruskan ke Dinsos",
            toStatus: "REVIEW_DINSOS",
            requiresNote: false,
            intent: "default",
          },
          {
            aksi: "MINTA_REVISI_BAPPERIDA",
            label: "Minta Revisi",
            description: "Laporan dikembalikan ke Pemohon.",
            toStatus: "PERLU_REVISI",
            requiresNote: true,
            intent: "secondary",
          },
        ];
      }
      return [];

    case "REVIEW_DINSOS":
      if (role === "PENGELOLA_DTSEN" || role === "ADMIN") {
        return [
          {
            aksi: "SETUJUI_DINSOS",
            label: "Setujui Laporan (Final)",
            toStatus: "DISETUJUI",
            requiresNote: false,
            intent: "default",
          },
          {
            aksi: "MINTA_REVISI_DINSOS",
            label: "Minta Revisi",
            toStatus: "PERLU_REVISI",
            requiresNote: true,
            intent: "secondary",
          },
        ];
      }
      return [];

    case "DISETUJUI":
      return [];

    default: {
      const _exhaustive: never = status;
      void _exhaustive;
      return [];
    }
  }
}

export function laporanBadgeVariant(
  status: StatusLaporan,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "DISETUJUI":
      return "default";
    case "MENUNGGAK":
      return "destructive";
    case "BELUM_DIKIRIM":
      return "outline";
    default:
      return "secondary";
  }
}
