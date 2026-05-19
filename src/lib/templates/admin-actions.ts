// Server actions untuk Template Surat. Hanya export async function.
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  BUCKETS,
  MIME_DOCX,
  MIME_PDF,
  removeFile,
  uploadFile,
} from "@/lib/storage";
import { metaForTipe } from "@/lib/templates/admin-meta";

export type TemplateFormState =
  | undefined
  | { ok: true; message: string }
  | { ok: false; error: string };

const TipeSchema = z.enum([
  "SURAT_PERMINTAAN",
  "KAK",
  "PAKTA_INTEGRITAS",
  "NDA",
  "LAPORAN_PEMANFAATAN",
]);
const FormatSchema = z.enum(["PDF", "DOCX"]);

export async function uploadTemplate(
  _prev: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const user = await requireRole(["ADMIN"]);

  const tipeRaw = formData.get("tipe");
  const formatRaw = formData.get("format");
  const file = formData.get("file");

  const tipeParsed = TipeSchema.safeParse(tipeRaw);
  const formatParsed = FormatSchema.safeParse(formatRaw);
  if (!tipeParsed.success || !formatParsed.success) {
    return { ok: false, error: "Tipe atau format template tidak valid." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pilih file terlebih dahulu." };
  }

  const tipe = tipeParsed.data;
  const format = formatParsed.data;
  const expectedMime = format === "PDF" ? MIME_PDF : MIME_DOCX;
  if (file.type !== expectedMime) {
    return {
      ok: false,
      error:
        format === "PDF"
          ? "File harus berformat PDF (.pdf)."
          : "File harus berformat DOCX (.docx).",
    };
  }

  const ext = format === "PDF" ? "pdf" : "docx";
  const path = `${tipe.toLowerCase()}/${tipe.toLowerCase()}.${ext}`;

  let uploaded;
  try {
    uploaded = await uploadFile({
      bucket: BUCKETS.TEMPLATE_SURAT,
      file,
      path,
      allowedMimeTypes: [expectedMime],
      upsert: true,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Gagal upload file.",
    };
  }

  // Hapus file lama bila path-nya berbeda (saat ini path stabil → biasanya skip).
  const existing = await prisma.templateSurat.findUnique({
    where: { tipe_format: { tipe, format } },
    select: { filePath: true },
  });
  if (existing && existing.filePath !== uploaded.path) {
    try {
      await removeFile(BUCKETS.TEMPLATE_SURAT, existing.filePath);
    } catch {
      // ignore
    }
  }

  await prisma.templateSurat.upsert({
    where: { tipe_format: { tipe, format } },
    update: {
      fileName: file.name,
      filePath: uploaded.path,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
      fileHashSha256: uploaded.sha256,
      uploadedById: user.id,
    },
    create: {
      tipe,
      format,
      fileName: file.name,
      filePath: uploaded.path,
      mimeType: uploaded.mimeType,
      sizeBytes: uploaded.sizeBytes,
      fileHashSha256: uploaded.sha256,
      uploadedById: user.id,
    },
  });

  revalidatePath("/dashboard/admin/template-surat");
  revalidatePath("/dashboard/template-surat");
  return {
    ok: true,
    message: `Template ${metaForTipe(tipe)?.judul ?? tipe} (${format}) berhasil diunggah.`,
  };
}

const DeleteSchema = z.object({
  tipe: TipeSchema,
  format: FormatSchema,
});

export async function deleteTemplate(formData: FormData): Promise<void> {
  await requireRole(["ADMIN"]);
  const parsed = DeleteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { tipe, format } = parsed.data;

  const row = await prisma.templateSurat.findUnique({
    where: { tipe_format: { tipe, format } },
  });
  if (!row) return;

  try {
    await removeFile(BUCKETS.TEMPLATE_SURAT, row.filePath);
  } catch {
    // ignore
  }
  await prisma.templateSurat.delete({
    where: { tipe_format: { tipe, format } },
  });

  revalidatePath("/dashboard/admin/template-surat");
  revalidatePath("/dashboard/template-surat");
}
