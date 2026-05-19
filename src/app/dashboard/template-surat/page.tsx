import type { Metadata } from "next";
import { Download, FileText, FileType, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TEMPLATES } from "@/lib/templates/pdf";
import { tipeFromSlug } from "@/lib/templates/admin-meta";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Template Surat" };

export default async function TemplateSuratPage() {
  await requireUser();

  // Ambil semua template admin sekaligus → lalu lookup per tipe.
  const adminRows = await prisma.templateSurat.findMany({
    select: { tipe: true, format: true, fileName: true },
  });
  const hasAdminFile = new Map<string, { fileName: string }>(
    adminRows.map((r) => [`${r.tipe}::${r.format}`, { fileName: r.fileName }]),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Template Surat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unduh template dokumen siap pakai. Lengkapi sesuai kebutuhan OPD Anda,
          tandatangani, lalu unggah kembali pada saat mengajukan Permohonan atau
          Pelaporan.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => {
          const tipe = tipeFromSlug(tpl.type);
          const adminPdf = tipe ? hasAdminFile.get(`${tipe}::PDF`) : undefined;
          const adminDocx = tipe ? hasAdminFile.get(`${tipe}::DOCX`) : undefined;
          const pdfFromAdmin = Boolean(adminPdf);
          const docxAvailable = Boolean(adminDocx);
          return (
            <Card key={tpl.type} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="size-5" />
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Template
                    </span>
                  </div>
                  {pdfFromAdmin && (
                    <Badge
                      variant="outline"
                      className="border-success/40 bg-success/10 text-success text-[10px]"
                    >
                      <Sparkles className="me-1 size-3" />
                      Disiapkan Admin
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-base">{tpl.judul}</CardTitle>
                <CardDescription>{tpl.ringkasan}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-xs text-muted-foreground">
                <p className="leading-relaxed">
                  Pilih format yang sesuai. PDF cocok untuk dicetak &amp;
                  ditandatangani. DOCX (Word) dapat langsung diedit.
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {adminPdf?.fileName ?? tpl.filename}
                  </Badge>
                  {docxAvailable && adminDocx && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {adminDocx.fileName}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <a
                    href={`/api/template-surat/${tpl.type}?format=pdf`}
                    download={adminPdf?.fileName ?? tpl.filename}
                  >
                    <Download className="me-2 size-4" />
                    Unduh PDF
                  </a>
                </Button>
                {docxAvailable ? (
                  <Button asChild className="w-full" variant="secondary">
                    <a
                      href={`/api/template-surat/${tpl.type}?format=docx`}
                      download={adminDocx?.fileName}
                    >
                      <FileType className="me-2 size-4" />
                      Unduh DOCX (Word)
                    </a>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="secondary"
                    disabled
                    title="Admin belum menyiapkan template DOCX"
                  >
                    <FileType className="me-2 size-4" />
                    DOCX belum tersedia
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
