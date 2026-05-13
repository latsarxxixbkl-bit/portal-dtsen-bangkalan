"use server";

import { revalidatePath } from "next/cache";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/storage";

const TEMPLAT_BUCKET = BUCKETS.TEMPLAT_SURAT;

// Mime types allowed for template surat (PDF, DOCX, DOC, ODT)
const ALLOWED_TEMPLATE_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.oasis.opendocument.text",
];
const ALLOWED_EXT = [".pdf", ".docx", ".doc", ".odt"];

const UploadSchema = z.object({
  jenisDokumen: z.enum(["SURAT_PERMINTAAN", "KAK", "PAKTA_INTEGRITAS", "NDA"]),
  nama: z.string().min(3).max(200),
  deskripsi: z.string().max(500).optional(),
});

export type TemplatFormState =
  | { ok: false; error: string }
  | { ok: true; message: string }
  | undefined;

function sanitize(name: string): string {
  return name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_").slice(-160);
}

async function uploadTemplateFile(file: File, jenisDokumen: string) {
  if (file.size === 0) throw new Error("File kosong.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Maks 20 MB.");
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_TEMPLATE_MIME.includes(file.type) && !ALLOWED_EXT.includes(`.${ext}`)) {
    throw new Error("Tipe file tidak diizinkan. Gunakan PDF, DOCX, DOC, atau ODT.");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  createHash("sha256").update(buf).digest("hex");
  const safe = sanitize(file.name);
  const path = `${jenisDokumen}/${Date.now()}-${randomUUID()}-${safe}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(TEMPLAT_BUCKET).upload(path, buf, {
    cacheControl: "public, max-age=3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return { path, fileName: safe, mimeType: file.type || "application/octet-stream", sizeBytes: file.size };
}

/** Upload atau replace template untuk satu jenis dokumen. Idempotent. */
export async function upsertTemplat(
  _prev: TemplatFormState,
  formData: FormData,
): Promise<TemplatFormState> {
  const user = await requireRole(["ADMIN"]);
  const parsed = UploadSchema.safeParse({
    jenisDokumen: formData.get("jenisDokumen"),
    nama: formData.get("nama"),
    deskripsi: formData.get("deskripsi") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pilih file template terlebih dahulu." };
  }

  try {
    const up = await uploadTemplateFile(file, parsed.data.jenisDokumen);

    const existing = await prisma.templatSurat.findUnique({
      where: { jenisDokumen: parsed.data.jenisDokumen },
    });

    if (existing) {
      // Replace old file in storage
      const admin = createAdminClient();
      await admin.storage.from(TEMPLAT_BUCKET).remove([existing.filePath]).catch(() => {});

      await prisma.templatSurat.update({
        where: { jenisDokumen: parsed.data.jenisDokumen },
        data: {
          nama: parsed.data.nama,
          deskripsi: parsed.data.deskripsi ?? null,
          filePath: up.path,
          fileName: up.fileName,
          mimeType: up.mimeType,
          sizeBytes: up.sizeBytes,
          uploadedById: user.id,
        },
      });
    } else {
      await prisma.templatSurat.create({
        data: {
          jenisDokumen: parsed.data.jenisDokumen,
          nama: parsed.data.nama,
          deskripsi: parsed.data.deskripsi ?? null,
          filePath: up.path,
          fileName: up.fileName,
          mimeType: up.mimeType,
          sizeBytes: up.sizeBytes,
          uploadedById: user.id,
        },
      });
    }
  } catch (e) {
    return { ok: false, error: `Gagal upload: ${(e as Error).message}` };
  }

  revalidatePath("/dashboard/admin/templat");
  revalidatePath("/dashboard/permohonan/baru");
  return { ok: true, message: "Template berhasil diunggah." };
}

/** Hapus template by jenisDokumen. */
export async function deleteTemplat(
  _prev: TemplatFormState,
  formData: FormData,
): Promise<TemplatFormState> {
  await requireRole(["ADMIN"]);
  const jenisDokumen = String(formData.get("jenisDokumen") ?? "");
  if (!jenisDokumen) return { ok: false, error: "Jenis dokumen wajib." };

  const t = await prisma.templatSurat.findUnique({
    where: { jenisDokumen: jenisDokumen as "SURAT_PERMINTAAN" },
  });
  if (!t) return { ok: false, error: "Template tidak ditemukan." };

  const admin = createAdminClient();
  await admin.storage.from(TEMPLAT_BUCKET).remove([t.filePath]).catch(() => {});
  await prisma.templatSurat.delete({ where: { id: t.id } });

  revalidatePath("/dashboard/admin/templat");
  revalidatePath("/dashboard/permohonan/baru");
  return { ok: true, message: "Template dihapus." };
}
