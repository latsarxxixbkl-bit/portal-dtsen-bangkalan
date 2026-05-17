import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { canViewPermohonan } from "@/lib/permohonan/access";
import { BUCKETS, signedUrl, type BucketName } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * GET /api/file?type=dokumen|berkas|laporan&id=<row-id>
 *
 * Mengembalikan redirect 302 ke signed URL Supabase (kedaluwarsa 5 menit).
 * RBAC dicek di sini supaya storage tetap private.
 */
export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  if (!type || !id) {
    return NextResponse.json({ error: "type & id wajib" }, { status: 400 });
  }

  let bucket: BucketName;
  let path: string;
  let permohonanId: string;

  if (type === "dokumen") {
    const doc = await prisma.dokumenPermohonan.findUnique({
      where: { id },
      select: { filePath: true, permohonanId: true },
    });
    if (!doc) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    bucket = BUCKETS.PERMOHONAN_DOKUMEN;
    path = doc.filePath;
    permohonanId = doc.permohonanId;
  } else if (type === "berkas") {
    const b = await prisma.berkasDtsen.findUnique({
      where: { id },
      select: { filePath: true, permohonanId: true },
    });
    if (!b) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    bucket = BUCKETS.BERKAS_DTSEN;
    path = b.filePath;
    permohonanId = b.permohonanId;
  } else if (type === "laporan") {
    const l = await prisma.laporanPemanfaatan.findUnique({
      where: { id },
      select: { filePendukungPath: true, permohonanId: true },
    });
    if (!l?.filePendukungPath) {
      return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    }
    bucket = BUCKETS.LAPORAN_PENDUKUNG;
    path = l.filePendukungPath;
    permohonanId = l.permohonanId;
  } else {
    return NextResponse.json({ error: "type tidak dikenali" }, { status: 400 });
  }

  const permohonan = await prisma.permohonan.findUnique({
    where: { id: permohonanId },
    select: { pemohonId: true, status: true },
  });
  if (!permohonan || !canViewPermohonan(user, permohonan)) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const signed = await signedUrl(bucket, path, 300);
  return NextResponse.redirect(signed);
}
