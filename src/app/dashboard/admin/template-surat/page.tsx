import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, FileText, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_TIPE } from "@/lib/templates/admin-meta";

import { TemplateUploadForm } from "./upload-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kelola Template Surat" };

const fmtDateTime = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminTemplateSuratPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");

  const rows = await prisma.templateSurat.findMany({
    include: { uploader: { select: { nama: true } } },
  });

  const byKey = new Map<string, (typeof rows)[number]>(
    rows.map((r) => [`${r.tipe}::${r.format}`, r]),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Kelola Template Surat
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unggah file template (PDF / DOCX) yang akan diunduh oleh Pemohon di
          halaman <em>Template Surat</em>. Tersedia 5 slot tipe tetap. Bila slot
          PDF kosong, sistem otomatis menyediakan PDF generate dari template
          bawaan; bila slot DOCX kosong, tombol DOCX di sisi Pemohon dinonaktifkan.
        </p>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
        <div className="flex items-start gap-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            File tersimpan di Supabase Storage bucket{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs dark:bg-amber-900/40">
              template-surat
            </code>
            . Maksimal 20 MB per file. Mengunggah ulang akan menggantikan file
            sebelumnya tanpa mengubah link Pemohon.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {TEMPLATE_TIPE.map((tpl) => {
          const pdfRow = byKey.get(`${tpl.tipe}::PDF`);
          const docxRow = byKey.get(`${tpl.tipe}::DOCX`);
          return (
            <Card key={tpl.tipe} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="size-5" />
                    <CardTitle className="text-base">{tpl.judul}</CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={pdfRow ? "default" : "outline"}
                      className="text-[10px]"
                    >
                      {pdfRow ? (
                        <>
                          <CheckCircle2 className="me-1 size-3" />
                          PDF
                        </>
                      ) : (
                        "PDF: auto"
                      )}
                    </Badge>
                    <Badge
                      variant={docxRow ? "default" : "outline"}
                      className="text-[10px]"
                    >
                      {docxRow ? (
                        <>
                          <CheckCircle2 className="me-1 size-3" />
                          DOCX
                        </>
                      ) : (
                        "DOCX: belum"
                      )}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  {tpl.ringkasan}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <FileInfo
                  label="PDF aktif"
                  row={pdfRow}
                  fallback="Belum di-upload → akan otomatis pakai PDF generate sistem."
                />
                <TemplateUploadForm
                  tipe={tpl.tipe}
                  format="PDF"
                  hasFile={Boolean(pdfRow)}
                />
                <FileInfo
                  label="DOCX aktif"
                  row={docxRow}
                  fallback="Belum di-upload → tombol DOCX di sisi Pemohon dinonaktifkan."
                />
                <TemplateUploadForm
                  tipe={tpl.tipe}
                  format="DOCX"
                  hasFile={Boolean(docxRow)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

type RowWithUploader = {
  fileName: string;
  sizeBytes: number;
  updatedAt: Date;
  uploader: { nama: string };
};

function FileInfo({
  label,
  row,
  fallback,
}: {
  label: string;
  row: RowWithUploader | undefined;
  fallback: string;
}) {
  if (!row) {
    return (
      <p className="text-xs italic text-muted-foreground">
        {label}: {fallback}
      </p>
    );
  }
  return (
    <div className="rounded-md bg-success/5 px-3 py-2 text-xs ring-1 ring-success/20">
      <p className="font-medium text-success">{label}</p>
      <p className="mt-0.5 truncate font-mono text-[11px] text-foreground">
        {row.fileName}
      </p>
      <p className="mt-0.5 text-muted-foreground">
        {formatSize(row.sizeBytes)} · diupload oleh {row.uploader.nama} ·{" "}
        {fmtDateTime.format(row.updatedAt)}
      </p>
    </div>
  );
}
