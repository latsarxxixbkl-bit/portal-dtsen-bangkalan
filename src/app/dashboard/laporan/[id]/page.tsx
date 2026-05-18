import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarRange, Clock3, Download, FileText } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RoleBadge } from "@/components/role-badge";
import { requireUser } from "@/lib/auth/session";
import { fetchLaporanDetail, canViewLaporan } from "@/lib/laporan/queries";
import { laporanAvailableActions, laporanBadgeVariant } from "@/lib/workflow/laporan";
import { STATUS_LAPORAN_LABEL } from "@/lib/constants";

import { LaporanForm } from "./form";
import { ReviewLaporanActions } from "./review-actions";

export const metadata: Metadata = { title: "Detail Laporan" };
export const dynamic = "force-dynamic";

const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const fmtDateTime = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function LaporanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const laporan = await fetchLaporanDetail(id);
  if (!laporan) notFound();
  if (!canViewLaporan({ id: user.id, role: user.role }, laporan)) notFound();

  const isPelapor = laporan.pelaporId === user.id || user.role === "ADMIN";
  const canSubmit =
    isPelapor &&
    (laporan.status === "BELUM_DIKIRIM" ||
      laporan.status === "MENUNGGAK" ||
      laporan.status === "PERLU_REVISI");
  const reviewActions = laporanAvailableActions(laporan.status, user.role);
  const now = new Date();
  const sisaHari = Math.ceil(
    (laporan.deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const overdue = sisaHari < 0 && laporan.status !== "DISETUJUI";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ms-3">
        <Link href="/dashboard/laporan">
          <ArrowLeft className="me-1 size-4" /> Daftar Laporan
        </Link>
      </Button>

      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{laporan.permohonan.opdPemohon.nama}</span>
            {laporan.permohonan.nomorSurat && (
              <>
                <span>·</span>
                <span className="font-mono">{laporan.permohonan.nomorSurat}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Laporan Pemanfaatan
          </h1>
          <p className="text-sm text-muted-foreground">Untuk: {laporan.permohonan.judul}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={laporanBadgeVariant(laporan.status)}>
              {STATUS_LAPORAN_LABEL[laporan.status] ?? laporan.status}
            </Badge>
            <span
              className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}
            >
              <Clock3 className="me-1 inline size-3.5 -mt-0.5" />
              Deadline {fmtDate.format(laporan.deadlineAt)} ·{" "}
              {overdue
                ? `Telat ${Math.abs(sisaHari)} hari`
                : sisaHari === 0
                  ? "Hari ini"
                  : `Sisa ${sisaHari} hari`}
            </span>
          </div>
        </div>
      </header>

      {overdue && laporan.status !== "DISETUJUI" && (
        <Alert variant="destructive">
          <AlertTitle>Pelaporan telat</AlertTitle>
          <AlertDescription>
            Laporan ini sudah melewati deadline 30 hari. Mohon segera dikirim untuk memenuhi kewajiban pelaporan.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {canSubmit ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Isi Laporan</CardTitle>
                <CardDescription>
                  Lengkapi data pemanfaatan dan opsional unggah PDF pendukung.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LaporanForm laporan={{
                  id: laporan.id,
                  judulKegiatan: laporan.judulKegiatan,
                  periodeMulai: laporan.periodeMulai.toISOString(),
                  periodeSelesai: laporan.periodeSelesai.toISOString(),
                  outputKegiatan: laporan.outputKegiatan,
                  manfaatData: laporan.manfaatData,
                  jumlahRecordData: laporan.jumlahRecordData,
                  filePendukungName: laporan.filePendukungName,
                }} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Isi Laporan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <Field label="Judul Kegiatan" value={laporan.judulKegiatan || "—"} />
                <Field
                  label="Periode Pemanfaatan"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarRange className="size-4 text-muted-foreground" />
                      {fmtDate.format(laporan.periodeMulai)} s/d {fmtDate.format(laporan.periodeSelesai)}
                    </span>
                  }
                />
                <Field label="Output Kegiatan" value={laporan.outputKegiatan || "—"} />
                <Field label="Manfaat Data" value={laporan.manfaatData || "—"} />
                {laporan.jumlahRecordData != null && (
                  <Field label="Jumlah Record Data" value={laporan.jumlahRecordData.toLocaleString("id-ID")} />
                )}
                {laporan.filePendukungName && (
                  <Field
                    label="File Pendukung"
                    value={
                      <Button asChild size="sm" variant="outline">
                        <a href={`/api/file?type=laporan&id=${laporan.id}`} target="_blank" rel="noopener">
                          <Download className="me-1 size-4" /> {laporan.filePendukungName}
                        </a>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Catatan Reviewer */}
          {(laporan.catatanBapperida || laporan.catatanDinsos) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Catatan Reviewer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {laporan.catatanBapperida && (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Bapperida {laporan.reviewerBapperida?.nama ? `· ${laporan.reviewerBapperida.nama}` : ""}
                    </div>
                    <div className="mt-1 rounded-md border bg-secondary/40 px-3 py-2">
                      {laporan.catatanBapperida}
                    </div>
                  </div>
                )}
                {laporan.catatanDinsos && (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Dinsos {laporan.reviewerDinsos?.nama ? `· ${laporan.reviewerDinsos.nama}` : ""}
                    </div>
                    <div className="mt-1 rounded-md border bg-secondary/40 px-3 py-2">
                      {laporan.catatanDinsos}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          {reviewActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aksi Review</CardTitle>
                <CardDescription>Berdasarkan peran Anda.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewLaporanActions laporanId={laporan.id} actions={reviewActions} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat</CardTitle>
              <CardDescription>{laporan.riwayat.length} aksi tercatat.</CardDescription>
            </CardHeader>
            <CardContent>
              {laporan.riwayat.length === 0 ? (
                <div className="text-sm text-muted-foreground">Belum ada aksi.</div>
              ) : (
                <ol className="space-y-3">
                  {laporan.riwayat.map((r, idx) => (
                    <li key={r.id} className="relative ps-5">
                      <span
                        className="absolute start-1 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background"
                        aria-hidden
                      />
                      {idx < laporan.riwayat.length - 1 && (
                        <span className="absolute start-[7px] top-3.5 h-full w-px bg-border" aria-hidden />
                      )}
                      <div className="text-sm">
                        <span className="font-medium">{r.aksi}</span>{" "}
                        <span className="text-muted-foreground">→</span>{" "}
                        <span className="font-mono text-xs">{r.keStatus}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {r.actor.nama}{" "}
                        <RoleBadge role={r.actorRole} className="ms-1 inline-block align-middle" />
                      </div>
                      {r.catatan && (
                        <div className="mt-1 rounded-md border bg-secondary/40 px-2 py-1.5 text-xs">
                          {r.catatan}
                        </div>
                      )}
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {fmtDateTime.format(r.createdAt)}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Permohonan: <Link className="underline" href={`/dashboard/permohonan/${laporan.permohonanId}`}>{laporan.permohonan.judul}</Link>
        {laporan.permohonan.berkasDtsen && (
          <> · Berkas DTSEN diserahkan {fmtDate.format(laporan.permohonan.berkasDtsen.diserahkanPada)}</>
        )}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-wrap">{value}</div>
    </div>
  );
}

void FileText; // import retained for potential future icon usage
