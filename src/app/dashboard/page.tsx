import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock3,
  FileCheck2,
  FilePlus2,
  Files,
  FileText,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleBadge } from "@/components/role-badge";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  STATUS_LAPORAN_LABEL,
  STATUS_PERMOHONAN_LABEL,
} from "@/lib/constants";
import { statusBadgeVariant } from "@/lib/workflow/permohonan";
import { laporanBadgeVariant } from "@/lib/workflow/laporan";

export const dynamic = "force-dynamic";

const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function DashboardHome() {
  const user = await requireUser();

  const handlerStatus = handlerFilterStatus(user.role);
  const recentWhere =
    user.role === "PEMOHON"
      ? { pemohonId: user.id }
      : user.role === "ADMIN" || user.role === "EWALI_DATA"
        ? {}
        : handlerStatus
          ? { status: handlerStatus }
          : {};

  const [
    totalPermohonan,
    permohonanAktif,
    permohonanSelesai,
    perluTindakan,
    totalLaporan,
    laporanMenunggak,
    recentPermohonan,
    upcomingLaporan,
    totalUser,
    totalOpd,
  ] = await Promise.all([
    prisma.permohonan.count().catch(() => 0),
    prisma.permohonan
      .count({
        where: {
          status: {
            in: [
              "VERIFIKATOR_REVIEW",
              "EWALI_REVIEW",
              "DTSEN_REVIEW",
              "DIKEMBALIKAN_KE_VERIFIKATOR",
              "DIKEMBALIKAN_KE_EWALI",
              "DISETUJUI",
            ],
          },
        },
      })
      .catch(() => 0),
    prisma.permohonan.count({ where: { status: "SELESAI" } }).catch(() => 0),
    handlerStatus
      ? prisma.permohonan
          .count({ where: { status: handlerStatus } })
          .catch(() => 0)
      : Promise.resolve(0),
    prisma.laporanPemanfaatan.count().catch(() => 0),
    prisma.laporanPemanfaatan
      .count({ where: { status: "MENUNGGAK" } })
      .catch(() => 0),
    prisma.permohonan
      .findMany({
        where: recentWhere,
        include: { opdPemohon: { select: { nama: true } } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      })
      .catch(() => []),
    prisma.laporanPemanfaatan
      .findMany({
        where:
          user.role === "PEMOHON"
            ? {
                pelaporId: user.id,
                status: { in: ["BELUM_DIKIRIM", "MENUNGGAK", "PERLU_REVISI"] },
              }
            : {
                status: { in: ["MENUNGGAK", "REVIEW_BAPPERIDA", "REVIEW_DINSOS"] },
              },
        include: {
          permohonan: { select: { judul: true, nomorSurat: true } },
        },
        orderBy: { deadlineAt: "asc" },
        take: 5,
      })
      .catch(() => []),
    user.role === "ADMIN"
      ? prisma.user.count().catch(() => 0)
      : Promise.resolve(0),
    user.role === "ADMIN"
      ? prisma.opd.count().catch(() => 0)
      : Promise.resolve(0),
  ]);

  const namaDepan = user.nama.split(" ")[0];
  const now = new Date();

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Selamat datang, Kak {namaDepan}
            </h1>
            <RoleBadge role={user.role} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.opdNama ? `${user.opdNama} · ` : ""}Ringkasan aktivitas portal hari ini.
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
        <StatCard
          label="Sedang Berjalan"
          value={permohonanAktif}
          icon={<TrendingUp className="size-4" />}
          caption="Status aktif dalam workflow"
        />
        <StatCard
          label="Perlu Tindakan"
          value={perluTindakan}
          icon={<FileCheck2 className="size-4" />}
          caption={handlerCaption(user.role)}
          tone="primary"
        />
        <StatCard
          label={user.role === "PEMOHON" ? "Laporan Saya" : "Total Laporan"}
          value={totalLaporan}
          icon={<FileText className="size-4" />}
          caption={
            laporanMenunggak > 0
              ? `${laporanMenunggak} menunggak`
              : "Tidak ada laporan menunggak"
          }
          tone={laporanMenunggak > 0 ? "warning" : undefined}
        />
      </section>

      {user.role === "ADMIN" && (
        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Users className="size-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pengguna terdaftar</div>
                <div className="text-xl font-semibold tracking-tight">
                  {totalUser.toLocaleString("id-ID")}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Building2 className="size-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">OPD terdaftar</div>
                <div className="text-xl font-semibold tracking-tight">
                  {totalOpd.toLocaleString("id-ID")}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Permohonan selesai</div>
                <div className="text-xl font-semibold tracking-tight">
                  {permohonanSelesai.toLocaleString("id-ID")}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Permohonan Terbaru</CardTitle>
              <CardDescription>
                {user.role === "PEMOHON" ? "Permohonan yang Kak ajukan." : "Aktivitas terakhir di sistem."}
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/permohonan">
                Semua <ArrowRight className="ms-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {recentPermohonan.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Belum ada permohonan.
              </div>
            ) : (
              <ul className="divide-y -mx-6">
                {recentPermohonan.map((p) => (
                  <li key={p.id} className="px-6 py-3">
                    <Link
                      href={`/dashboard/permohonan/${p.id}`}
                      className="flex items-start justify-between gap-3 transition-colors hover:text-primary"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 text-sm font-medium">{p.judul}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {p.opdPemohon.nama} · {fmtDate.format(p.updatedAt)}
                        </div>
                      </div>
                      <Badge variant={statusBadgeVariant(p.status)} className="shrink-0">
                        {STATUS_PERMOHONAN_LABEL[p.status] ?? p.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Pelaporan Terdekat</CardTitle>
              <CardDescription>
                {user.role === "PEMOHON"
                  ? "Laporan yang harus Kak kirim."
                  : "Laporan menunggu review."}
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/laporan">
                Semua <ArrowRight className="ms-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingLaporan.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Tidak ada laporan yang perlu ditindaklanjuti.
              </div>
            ) : (
              <ul className="divide-y -mx-6">
                {upcomingLaporan.map((l) => {
                  const sisa = Math.ceil(
                    (l.deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                  );
                  return (
                    <li key={l.id} className="px-6 py-3">
                      <Link
                        href={`/dashboard/laporan/${l.id}`}
                        className="flex items-start justify-between gap-3 transition-colors hover:text-primary"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-1 text-sm font-medium">
                            {l.permohonan.judul}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            <Clock3 className="me-1 inline size-3 -mt-0.5" />
                            Deadline {fmtDate.format(l.deadlineAt)}{" "}
                            {sisa < 0 ? `(telat ${Math.abs(sisa)} hari)` : `(sisa ${sisa} hari)`}
                          </div>
                        </div>
                        <Badge variant={laporanBadgeVariant(l.status)} className="shrink-0">
                          {STATUS_LAPORAN_LABEL[l.status] ?? l.status}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function handlerFilterStatus(role: string) {
  if (role === "VERIFIKATOR") return "VERIFIKATOR_REVIEW" as const;
  if (role === "EWALI_DATA") return "EWALI_REVIEW" as const;
  if (role === "PENGELOLA_DTSEN") return "DTSEN_REVIEW" as const;
  return null;
}

function handlerCaption(role: string) {
  if (role === "VERIFIKATOR") return "Antrian verifikasi Bapperida";
  if (role === "EWALI_DATA") return "Antrian E-Wali Diskominfo";
  if (role === "PENGELOLA_DTSEN") return "Antrian persetujuan Dinsos";
  if (role === "PEMOHON") return "Permohonan perlu revisi";
  return "Tindakan sistem";
}

function StatCard({
  label,
  value,
  icon,
  caption,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  caption: string;
  tone?: "primary" | "warning";
}) {
  return (
    <Card
      className={
        tone === "primary"
          ? "border-primary/30 bg-primary/[0.03]"
          : tone === "warning"
            ? "border-warning/30 bg-warning/[0.04]"
            : undefined
      }
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
          <span>{label}</span>
          <span
            className={`flex size-7 items-center justify-center rounded-md text-secondary-foreground ${
              tone === "primary"
                ? "bg-primary/10 text-primary"
                : tone === "warning"
                  ? "bg-warning/15 text-warning-foreground"
                  : "bg-secondary"
            }`}
          >
            {icon}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-semibold tracking-tight">
          {value.toLocaleString("id-ID")}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{caption}</div>
      </CardContent>
    </Card>
  );
}
