import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";

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
import { TEMPLATES } from "@/lib/templates/pdf";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Template Surat" };

export default async function TemplateSuratPage() {
  await requireUser();

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
        {TEMPLATES.map((tpl) => (
          <Card key={tpl.type} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <FileText className="size-5" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  PDF Template
                </span>
              </div>
              <CardTitle className="mt-2 text-base">{tpl.judul}</CardTitle>
              <CardDescription>{tpl.ringkasan}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-xs text-muted-foreground">
              <span className="rounded bg-muted px-2 py-1 font-mono">
                {tpl.filename}
              </span>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="secondary">
                <a
                  href={`/api/template-surat/${tpl.type}`}
                  download={tpl.filename}
                >
                  <Download className="me-2 size-4" />
                  Unduh Template
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
