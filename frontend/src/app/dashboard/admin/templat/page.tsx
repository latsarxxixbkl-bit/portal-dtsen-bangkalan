import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { fetchTemplatPublicMap } from "@/lib/templat/queries";
import { DOKUMEN_WAJIB } from "@/lib/constants";

import { UploadTemplatDialog } from "./upload-dialog";
import { DeleteTemplatButton } from "./delete-button";

export const metadata: Metadata = { title: "Template Surat" };
export const dynamic = "force-dynamic";

const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default async function TemplatAdminPage() {
  await requireRole(["ADMIN"]);
  const map = await fetchTemplatPublicMap();

  return (
    <div className="space-y-6" data-testid="admin-templat-page">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Template Surat</h1>
        <p className="text-sm text-muted-foreground">
          Kelola template 4 dokumen wajib yang akan diunduh OPD saat mengajukan permohonan akses Data DTSEN.
          Format: PDF / DOCX / DOC / ODT (maks 20 MB).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {DOKUMEN_WAJIB.map((d) => {
          const t = map[d.id];
          return (
            <Card key={d.id} data-testid={`templat-card-${d.id.toLowerCase()}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{d.nama}</CardTitle>
                    <CardDescription className="text-xs">{d.deskripsi}</CardDescription>
                  </div>
                  {t ? (
                    <Badge variant="default">Tersedia</Badge>
                  ) : (
                    <Badge variant="outline">Belum diunggah</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {t ? (
                  <>
                    <div className="rounded-md border bg-secondary/40 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-1 font-medium">{t.fileName}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {fmtSize(t.sizeBytes)} · diunggah {fmtDate.format(t.updatedAt)} oleh{" "}
                        {t.uploadedBy.nama}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button asChild size="sm" variant="outline" data-testid={`templat-download-${d.id.toLowerCase()}`}>
                        <a href={`/api/file?type=templat&id=${t.id}`} target="_blank" rel="noopener">
                          <Download className="me-1 size-4" /> Unduh
                        </a>
                      </Button>
                      <UploadTemplatDialog
                        jenisDokumen={d.id}
                        defaultNama={t.nama}
                        defaultDeskripsi={t.deskripsi ?? ""}
                        triggerLabel="Ganti Template"
                      />
                      <DeleteTemplatButton jenisDokumen={d.id} />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Belum ada template. Unggah supaya OPD bisa mengunduh.
                    </div>
                    <UploadTemplatDialog
                      jenisDokumen={d.id}
                      defaultNama={d.nama}
                      defaultDeskripsi={d.deskripsi}
                      triggerLabel="Unggah"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
