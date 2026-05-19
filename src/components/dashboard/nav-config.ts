import {
  Archive,
  Bell,
  FileCheck2,
  FilePlus2,
  FileText,
  Files,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const COMMON_TOP: NavItem = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
};

const COMMON_BOTTOM: NavItem[] = [
  { href: "/dashboard/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/dashboard/profil", label: "Profil", icon: Settings },
];

export function navForRole(
  role: "PEMOHON" | "VERIFIKATOR" | "EWALI_DATA" | "PENGELOLA_DTSEN" | "ADMIN",
): NavSection[] {
  if (role === "PEMOHON") {
    return [
      {
        title: "Beranda",
        items: [COMMON_TOP],
      },
      {
        title: "Permohonan",
        items: [
          { href: "/dashboard/permohonan/baru", label: "Permohonan Baru", icon: FilePlus2 },
          { href: "/dashboard/permohonan", label: "Daftar Permohonan", icon: Files },
        ],
      },
      {
        title: "Pelaporan",
        items: [
          { href: "/dashboard/laporan", label: "Laporan Pemanfaatan", icon: FileText },
        ],
      },
      {
        title: "Dokumen",
        items: [
          { href: "/dashboard/template-surat", label: "Template Surat", icon: FileText },
        ],
      },
      {
        title: "Akun",
        items: COMMON_BOTTOM,
      },
    ];
  }

  if (role === "VERIFIKATOR") {
    return [
      { title: "Beranda", items: [COMMON_TOP] },
      {
        title: "Permohonan",
        items: [
          { href: "/dashboard/permohonan", label: "Antrian Verifikasi", icon: FileCheck2 },
        ],
      },
      {
        title: "Pelaporan",
        items: [
          { href: "/dashboard/laporan/review-bapperida", label: "Review Laporan", icon: FileText },
        ],
      },
      {
        title: "Dokumen",
        items: [
          { href: "/dashboard/template-surat", label: "Template Surat", icon: FileText },
        ],
      },
      { title: "Akun", items: COMMON_BOTTOM },
    ];
  }

  if (role === "EWALI_DATA") {
    return [
      { title: "Beranda", items: [COMMON_TOP] },
      {
        title: "Permohonan",
        items: [
          { href: "/dashboard/permohonan", label: "Antrian E-Wali", icon: FileCheck2 },
        ],
      },
      {
        title: "Dokumen",
        items: [
          { href: "/dashboard/template-surat", label: "Template Surat", icon: FileText },
        ],
      },
      { title: "Akun", items: COMMON_BOTTOM },
    ];
  }

  if (role === "PENGELOLA_DTSEN") {
    return [
      { title: "Beranda", items: [COMMON_TOP] },
      {
        title: "Permohonan",
        items: [
          { href: "/dashboard/permohonan", label: "Antrian Persetujuan", icon: FileCheck2 },
        ],
      },
      {
        title: "Pelaporan",
        items: [
          { href: "/dashboard/laporan/review-dinsos", label: "Review Laporan", icon: FileText },
        ],
      },
      {
        title: "Dokumen",
        items: [
          { href: "/dashboard/template-surat", label: "Template Surat", icon: FileText },
        ],
      },
      { title: "Akun", items: COMMON_BOTTOM },
    ];
  }

  // ADMIN
  return [
    { title: "Beranda", items: [COMMON_TOP] },
    {
      title: "Master Data",
      items: [
        { href: "/dashboard/admin/users", label: "Pengguna", icon: Users },
        { href: "/dashboard/admin/opd", label: "OPD", icon: Files },
      ],
    },
    {
      title: "Permohonan & Laporan",
      items: [
        { href: "/dashboard/permohonan", label: "Semua Permohonan", icon: Files },
        { href: "/dashboard/laporan", label: "Semua Laporan", icon: FileText },
      ],
    },
    {
      title: "Dokumen & Sistem",
      items: [
        {
          href: "/dashboard/admin/template-surat",
          label: "Template Surat",
          icon: FileText,
        },
        { href: "/dashboard/admin/backup", label: "Backup Data", icon: Archive },
      ],
    },
    { title: "Akun", items: COMMON_BOTTOM },
  ];
}
