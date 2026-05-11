import Link from "next/link";
import { ArrowRight, FileCheck2, FilePlus2, Files, FileText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/role-badge";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await requireUser();

  // Lightweight role-based stats — counts are best-effort and tolerate empty DB.
  const [totalPermohonan, milikSaya, perluTindakan, totalLaporan] = await Promise.all([
    prisma.permohonan.count().catch(() => 0),
    user.role === "PEMOHON"
      ? prisma.permohonan.count({ where: { pemohonId: user.id } }).catch(() => 0)
      : Promise.resolve(0),
    prisma.permohonan
      .count({
        where: handlerFilter(user.role),
      })
      .catch(() => 0),
    prisma.laporanPemanfaatan.count().catch(() => 0),
  ]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Selamat datang, {user.nama.split(" ")[0]}</h1>
            <RoleBadge role={user.role} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan aktivitas Portal DTSEN Bangkalan untuk akun Kak.
          </p>
        </div>
        {user.role === "PEMOHON" && (
          <Button asChild>
            <Link href="/dashboard/permohonan/baru">
              <FilePlus2 className="me-2 size-4" /> Permohonan Baru
            </Link>
          </Button>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Permohonan"
          value={totalPermohonan}
          icon={<Files className="size-4" />}
          caption="Seluruh permohonan tercatat"
        />
        {user.role === "PEMOHON" && (
          <StatCard
            label="Permohonan Saya"
            value={milikSaya}
            icon={<Files className="size-4" />}
            caption="Diajukan oleh akun Kak"
          />
        )}
        <StatCard
          label="Perlu Tindakan"
          value={perluTindakan}
          icon={<FileCheck2 className="size-4" />}
          caption={handlerCaption(user.role)}
        />
        <StatCard
          label="Total Laporan"
          value={totalLaporan}
          icon={<FileText className="size-4" />}
          caption="Laporan pemanfaatan terdaftar"
        />
      </section>

      <Card className="bg-primary/[0.04] border-primary/20">
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-md border bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">Portal masih dalam tahap rilis bertahap</CardTitle>
            <CardDescription>
              Modul Permohonan, Pelaporan, Notifikasi, dan Dashboard sedang disiapkan oleh tim Diskominfo. Untuk Day-1, Kak bisa menjelajah desain & alur navigasi.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <QuickAction
          title="Lihat Permohonan"
          desc="Daftar permohonan yang relevan dengan peran Kak."
          href="/dashboard/permohonan"
        />
        <QuickAction
          title="Lihat Laporan Pemanfaatan"
          desc="Pantau status laporan pemanfaatan data DTSEN."
          href="/dashboard/laporan"
        />
      </section>
    </div>
  );
}

function handlerFilter(role: string) {
  if (role === "VERIFIKATOR") return { status: "VERIFIKATOR_REVIEW" as const };
  if (role === "EWALI_DATA") return { status: "EWALI_REVIEW" as const };
  if (role === "PENGELOLA_DTSEN") return { status: "DTSEN_REVIEW" as const };
  return {};
}

function handlerCaption(role: string) {
  if (role === "VERIFIKATOR") return "Antrian verifikasi Bapperida";
  if (role === "EWALI_DATA") return "Antrian E-Wali Diskominfo";
  if (role === "PENGELOLA_DTSEN") return "Antrian persetujuan Dinsos";
  if (role === "PEMOHON") return "Permohonan menunggu revisi";
  return "Antrian aksi sistem";
}

function StatCard({
  label,
  value,
  icon,
  caption,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  caption: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
          <span>{label}</span>
          <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            {icon}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-semibold tracking-tight">{value.toLocaleString("id-ID")}</div>
        <div className="mt-1 text-xs text-muted-foreground">{caption}</div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>
            Buka <ArrowRight className="ms-1 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
