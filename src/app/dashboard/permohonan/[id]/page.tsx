import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  Clock3,
  Download,
  FileText,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RoleBadge } from "@/components/role-badge";
import { requireUser } from "@/lib/auth/session";
import { fetchPermohonanDetail } from "@/lib/permohonan/queries";
import { canViewPermohonan } from "@/lib/permohonan/access";
import { availableActions, statusBadgeVariant } from "@/lib/workflow/permohonan";
import { DOKUMEN_WAJIB, STATUS_PERMOHONAN_LABEL } from "@/lib/constants";

import { WorkflowActions } from "./actions";
import { UploadBerkasForm } from "./upload-berkas";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detail Permohonan" };

const fmtDateTime = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function PermohonanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string }>;
}) {
  const { id } = await params;
  const { baru } = await searchParams;
  const user = await requireUser();
  const permohonan = await fetchPermohonanDetail(id);
  if (!permohonan) notFound();
  if (!canViewPermohonan(user, permohonan)) notFound();

  const actions = availableActions(permohonan.status, user.role);
  const docByJenis = new Map(permohonan.dokumen.map((d) => [d.jenisDokumen, d]));
  const showUploadBerkas =
    permohonan.status === "DISETUJUI" &&
    (user.role === "PENGELOLA_DTSEN" || user.role === "ADMIN");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ms-3">
        <Link href="/dashboard/permohonan">
          <ArrowLeft className="me-1 size-4" /> Daftar Permohonan
        </Link>
      </Button>

      {baru && (
        <Alert>
          <AlertTitle>Permohonan terkirim</AlertTitle>
          <AlertDescription>
            Permohonan Anda sudah masuk antrian Verifikator Bapperida. Pantau statusnya di halaman ini.
          </AlertDescription>
        </Alert>
      )}

      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{permohonan.nomorSurat ?? "Draft"}</span>
            <span>·</span>
            <span>{permohonan.opdPemohon.nama}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{permohonan.judul}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusBadgeVariant(permohonan.status)}>
              {STATUS_PERMOHONAN_LABEL[permohonan.status] ?? permohonan.status}
            </Badge>
            {permohonan.diajukanAt && (
              <span className="text-xs text-muted-foreground">
                <Clock3 className="me-1 inline size-3.5 -mt-0.5" />
                Diajukan {fmtDateTime.format(permohonan.diajukanAt)}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Detail permohonan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detail Permohonan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Field label="Tujuan Penggunaan" value={permohonan.tujuanPenggunaan} />
              <Field label="Jenis Data Diminta" value={permohonan.jenisDataDiminta} />
              {(permohonan.periodeAwal || permohonan.periodeAkhir) && (
                <Field
                  label="Periode Data"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarRange className="size-4 text-muted-foreground" />
                      {permohonan.periodeAwal ? fmtDate.format(permohonan.periodeAwal) : "—"} s/d{" "}
                      {permohonan.periodeAkhir ? fmtDate.format(permohonan.periodeAkhir) : "—"}
                    </span>
                  }
                />
              )}
              {permohonan.catatanTerakhir && (
                <Field
                  label="Catatan Terakhir"
                  value={
                    <span className="inline-block rounded-md border bg-secondary/40 px-3 py-2">
                      {permohonan.catatanTerakhir}
                    </span>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* Dokumen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dokumen Permohonan</CardTitle>
              <CardDescription>
                4 dokumen wajib yang menyertai permohonan ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {DOKUMEN_WAJIB.map((d) => {
                const doc = docByJenis.get(d.id);
                return (
                  <div key={d.id} className="rounded-lg border bg-card/60 p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-secondary text-secondary-foreground">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{d.nama}</div>
                        {doc ? (
                          <>
                            <div className="truncate text-xs text-muted-foreground" title={doc.fileName}>
                              {doc.fileName} · {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB
                            </div>
                            <div className="mt-2">
                              <Button asChild size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs">
                                <a href={`/api/file?type=dokumen&id=${doc.id}`} target="_blank" rel="noopener">
                                  <Download className="size-3" /> Unduh
                                </a>
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-muted-foreground">Belum diunggah.</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Berkas DTSEN */}
          {permohonan.berkasDtsen && (
            <Card className="border-success/40 bg-success/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="size-5 text-success" />
                  Berkas Data DTSEN
                </CardTitle>
                <CardDescription>
                  Diserahkan {fmtDateTime.format(permohonan.berkasDtsen.diserahkanPada)}.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium">{permohonan.berkasDtsen.fileName}</div>
                  <div className="text-xs text-muted-foreground">
                    {(permohonan.berkasDtsen.sizeBytes / 1024 / 1024).toFixed(2)} MB · PDF
                  </div>
                </div>
                <Button asChild size="sm">
                  <a href={`/api/file?type=berkas&id=${permohonan.berkasDtsen.id}`} target="_blank" rel="noopener">
                    <Download className="me-1 size-4" /> Unduh
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Upload Berkas DTSEN (Pengelola Dinsos saja, status DISETUJUI) */}
          {showUploadBerkas && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Serahkan Berkas DTSEN</CardTitle>
                <CardDescription>
                  Unggah file Data DTSEN final. Setelah dikirim, sistem otomatis membuat Laporan Pemanfaatan dengan deadline 30 hari.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadBerkasForm permohonanId={permohonan.id} />
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          {/* Aksi workflow */}
          {actions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aksi Tersedia</CardTitle>
                <CardDescription>Berdasarkan peran Anda & status saat ini.</CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowActions permohonanId={permohonan.id} actions={actions} />
              </CardContent>
            </Card>
          )}

          {/* Pihak terkait */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pihak Terkait</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <UserIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{permohonan.pemohon.nama}</div>
                  <div className="text-xs text-muted-foreground">{permohonan.pemohon.email}</div>
                  {permohonan.pemohon.opd && (
                    <div className="text-xs text-muted-foreground">{permohonan.pemohon.opd.nama}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Riwayat / Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Riwayat</CardTitle>
              <CardDescription>{permohonan.riwayat.length} aksi tercatat.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {permohonan.riwayat.map((r, idx) => (
                  <li key={r.id} className="relative ps-5">
                    <span
                      className="absolute start-1 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background"
                      aria-hidden
                    />
                    {idx < permohonan.riwayat.length - 1 && (
                      <span className="absolute start-[7px] top-3.5 h-full w-px bg-border" aria-hidden />
                    )}
                    <div className="text-sm">
                      <span className="font-medium">{r.aksi}</span>{" "}
                      <span className="text-muted-foreground">→</span>{" "}
                      <span className="font-mono text-xs">{r.keStatus}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {r.actor.nama} <RoleBadge role={r.actorRole} className="ms-1 inline-block align-middle" />
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
            </CardContent>
          </Card>
        </aside>
      </div>

      <Separator className="my-2" />
      <p className="text-xs text-muted-foreground">
        ID Permohonan: <span className="font-mono">{permohonan.id}</span>
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
