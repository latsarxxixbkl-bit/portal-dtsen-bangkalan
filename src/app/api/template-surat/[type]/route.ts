import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { findTemplate, generateTemplatePdf } from "@/lib/templates/pdf";
import {
  defaultFilename,
  metaForTipe,
  tipeFromSlug,
} from "@/lib/templates/admin-meta";
import { BUCKETS, downloadFileBuffer } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ type: string }> },
) {
  await requireUser();
  const { type } = await ctx.params;

  const url = new URL(req.url);
  const formatParam = (url.searchParams.get("format") ?? "pdf").toLowerCase();
  if (formatParam !== "pdf" && formatParam !== "docx") {
    return NextResponse.json(
      { error: "Format tidak didukung. Gunakan 'pdf' atau 'docx'." },
      { status: 400 },
    );
  }
  const format = formatParam === "docx" ? "DOCX" : "PDF";

  const tipe = tipeFromSlug(type);
  if (!tipe) {
    return NextResponse.json(
      { error: "Template tidak ditemukan." },
      { status: 404 },
    );
  }

  // 1. Coba ambil file yang sudah di-upload admin
  const row = await prisma.templateSurat.findUnique({
    where: { tipe_format: { tipe, format } },
  });

  if (row) {
    try {
      const buf = await downloadFileBuffer(BUCKETS.TEMPLATE_SURAT, row.filePath);
      return new Response(new Uint8Array(buf), {
        status: 200,
        headers: {
          "Content-Type": row.mimeType,
          "Content-Disposition": `attachment; filename="${row.fileName}"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      console.error("[template-surat] gagal download file admin:", err);
      // Fallback ke generate (hanya untuk PDF) — jangan biarkan halaman Pemohon broken.
    }
  }

  // 2. Fallback: hanya PDF yang punya generate auto
  if (format === "PDF") {
    const meta = findTemplate(type);
    if (!meta) {
      return NextResponse.json(
        { error: "Template tidak ditemukan." },
        { status: 404 },
      );
    }
    const bytes = await generateTemplatePdf(meta.type);
    const filename = meta.filename;
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // DOCX tanpa upload → 404
  return NextResponse.json(
    {
      error: `Template DOCX untuk ${
        metaForTipe(tipe)?.judul ?? tipe
      } belum tersedia. Hubungi Admin.`,
      defaultFilename: defaultFilename(tipe, "DOCX"),
    },
    { status: 404 },
  );
}
