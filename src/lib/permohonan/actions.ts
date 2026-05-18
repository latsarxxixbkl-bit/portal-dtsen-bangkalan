"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  AksiPermohonan,
  StatusPermohonan,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/auth/session";
import { uploadFile, BUCKETS, removeFile } from "@/lib/storage";
import { availableActions, STATUS_HANDLER } from "@/lib/workflow/permohonan";
import { generateNomorSurat } from "@/lib/workflow/numbering";
import { DOKUMEN_WAJIB } from "@/lib/constants";
import { notifyTransition } from "@/lib/notifikasi/service";

const PermohonanSchema = z.object({
  judul: z.string().min(8, "Judul minimal 8 karakter").max(200),
  tujuanPenggunaan: z.string().min(20, "Tujuan minimal 20 karakter").max(2000),
  jenisDataDiminta: z.string().min(8, "Jenis data minimal 8 karakter").max(1000),
  periodeAwal: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  periodeAkhir: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
});

export type PermohonanFormState =
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
  | { ok: true; permohonanId: string; message: string }
  | undefined;

/** Buat permohonan baru sekaligus upload 4 PDF wajib, lalu langsung diajukan. */
export async function submitPermohonan(
  _prev: PermohonanFormState,
  formData: FormData,
): Promise<PermohonanFormState> {
  const user = await requireUser();
  if (user.role !== "PEMOHON" && user.role !== "ADMIN") {
    return { ok: false, error: "Hanya Pemohon yang bisa mengajukan permohonan." };
  }
  if (!user.opdId) {
    return { ok: false, error: "Akun Anda belum terhubung ke OPD. Hubungi admin." };
  }

  const parsed = PermohonanSchema.safeParse({
    judul: formData.get("judul"),
    tujuanPenggunaan: formData.get("tujuanPenggunaan"),
    jenisDataDiminta: formData.get("jenisDataDiminta"),
    periodeAwal: formData.get("periodeAwal") || undefined,
    periodeAkhir: formData.get("periodeAkhir") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Periksa kembali isian.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  if (data.periodeAwal && data.periodeAkhir && data.periodeAkhir < data.periodeAwal) {
    return {
      ok: false,
      error: "Periode akhir harus setelah periode awal.",
      fieldErrors: { periodeAkhir: ["Tidak boleh sebelum periode awal."] },
    };
  }

  // Validasi 4 file PDF
  const fileMap: Partial<Record<(typeof DOKUMEN_WAJIB)[number]["id"], File>> = {};
  for (const d of DOKUMEN_WAJIB) {
    const f = formData.get(`dokumen.${d.id}`);
    if (!(f instanceof File) || f.size === 0) {
      return {
        ok: false,
        error: `Dokumen "${d.nama}" wajib diunggah.`,
        fieldErrors: { [`dokumen.${d.id}`]: ["Dokumen wajib."] },
      };
    }
    if (f.type !== "application/pdf") {
      return {
        ok: false,
        error: `Dokumen "${d.nama}" harus PDF.`,
        fieldErrors: { [`dokumen.${d.id}`]: ["Hanya PDF."] },
      };
    }
    if (f.size > 10 * 1024 * 1024) {
      return {
        ok: false,
        error: `Dokumen "${d.nama}" melebihi 10 MB.`,
        fieldErrors: { [`dokumen.${d.id}`]: ["Maks 10 MB."] },
      };
    }
    fileMap[d.id] = f;
  }

  // Buat permohonan dulu (status DRAFT) → upload files → update jadi VERIFIKATOR_REVIEW
  const created = await prisma.permohonan.create({
    data: {
      opdPemohonId: user.opdId,
      pemohonId: user.id,
      judul: data.judul,
      tujuanPenggunaan: data.tujuanPenggunaan,
      jenisDataDiminta: data.jenisDataDiminta,
      periodeAwal: data.periodeAwal,
      periodeAkhir: data.periodeAkhir,
      status: "DRAFT",
      currentHandlerRole: "PEMOHON",
    },
  });

  const uploadedPaths: { bucket: string; path: string }[] = [];
  try {
    for (const d of DOKUMEN_WAJIB) {
      const file = fileMap[d.id]!;
      const up = await uploadFile({
        bucket: BUCKETS.PERMOHONAN_DOKUMEN,
        pathPrefix: `${created.id}`,
        file,
      });
      uploadedPaths.push({ bucket: up.bucket, path: up.path });
      await prisma.dokumenPermohonan.create({
        data: {
          permohonanId: created.id,
          jenisDokumen: d.id,
          filePath: up.path,
          fileName: up.fileName,
          fileHashSha256: up.sha256,
          mimeType: up.mimeType,
          sizeBytes: up.sizeBytes,
          uploadedById: user.id,
        },
      });
    }
  } catch (e) {
    // rollback: bersihkan file yg sudah ke-upload + hapus permohonan
    for (const p of uploadedPaths) {
      await removeFile(p.bucket as "permohonan-dokumen", p.path).catch(() => {});
    }
    await prisma.permohonan.delete({ where: { id: created.id } }).catch(() => {});
    return {
      ok: false,
      error: `Gagal mengunggah dokumen: ${(e as Error).message}`,
    };
  }

  // Langsung diajukan ke Verifikator
  const nomor = await generateNomorSurat(user.opdId, new Date());
  await prisma.$transaction([
    prisma.permohonan.update({
      where: { id: created.id },
      data: {
        nomorSurat: nomor,
        status: "VERIFIKATOR_REVIEW",
        currentHandlerRole: "VERIFIKATOR",
        diajukanAt: new Date(),
        catatanTerakhir: null,
      },
    }),
    prisma.riwayatPermohonan.create({
      data: {
        permohonanId: created.id,
        actorId: user.id,
        actorRole: user.role,
        aksi: "AJUKAN",
        dariStatus: "DRAFT",
        keStatus: "VERIFIKATOR_REVIEW",
        catatan: null,
      },
    }),
  ]);

  // Notifikasi: ke Verifikator
  await notifyTransition({
    permohonanId: created.id,
    fromStatus: "DRAFT",
    toStatus: "VERIFIKATOR_REVIEW",
    actorId: user.id,
    actorRole: user.role,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/permohonan");
  redirect(`/dashboard/permohonan/${created.id}?baru=1`);
}

const WorkflowSchema = z.object({
  permohonanId: z.string().uuid(),
  aksi: z.enum(["AJUKAN", "TERIMA", "TOLAK", "TERUSKAN", "KEMBALIKAN", "SETUJUI", "UPLOAD_DATA", "SELESAIKAN"]),
  catatan: z.string().max(2000).optional(),
});

export type WorkflowState =
  | { ok: false; error: string }
  | { ok: true; message: string }
  | undefined;

/** Eksekusi transisi state machine untuk Permohonan. */
export async function applyWorkflowAction(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  const user = await requireUser();
  const parsed = WorkflowSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Parameter aksi tidak valid." };
  }
  const { permohonanId, aksi, catatan } = parsed.data;

  const permohonan = await prisma.permohonan.findUnique({
    where: { id: permohonanId },
    select: { id: true, status: true, opdPemohonId: true, pemohonId: true },
  });
  if (!permohonan) return { ok: false, error: "Permohonan tidak ditemukan." };

  const allowed = availableActions(permohonan.status, user.role);
  const target = allowed.find((a) => a.aksi === aksi);
  if (!target) {
    return { ok: false, error: "Aksi tidak diizinkan untuk peran/status saat ini." };
  }
  if (target.requiresNote && !catatan?.trim()) {
    return { ok: false, error: "Catatan wajib diisi untuk aksi ini." };
  }

  const fromStatus = permohonan.status;
  const toStatus = target.toStatus;
  const handler = STATUS_HANDLER[toStatus];

  const updateData: {
    status: StatusPermohonan;
    currentHandlerRole: UserRole | null;
    catatanTerakhir: string | null;
    disetujuiAt?: Date;
    completedAt?: Date;
  } = {
    status: toStatus,
    currentHandlerRole: handler,
    catatanTerakhir: catatan?.trim() || null,
  };

  if (toStatus === "DISETUJUI") updateData.disetujuiAt = new Date();
  if (toStatus === "SELESAI") updateData.completedAt = new Date();

  await prisma.$transaction([
    prisma.permohonan.update({
      where: { id: permohonanId },
      data: updateData,
    }),
    prisma.riwayatPermohonan.create({
      data: {
        permohonanId,
        actorId: user.id,
        actorRole: user.role,
        aksi: aksi as AksiPermohonan,
        dariStatus: fromStatus,
        keStatus: toStatus,
        catatan: catatan?.trim() || null,
      },
    }),
  ]);

  await notifyTransition({
    permohonanId,
    fromStatus,
    toStatus,
    actorId: user.id,
    actorRole: user.role,
    catatan: catatan?.trim() || null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/permohonan");
  revalidatePath(`/dashboard/permohonan/${permohonanId}`);
  return { ok: true, message: `Aksi "${target.label}" berhasil dijalankan.` };
}

/** Upload Berkas DTSEN final (oleh Pengelola DTSEN). */
export async function uploadBerkasDtsen(
  _prev: WorkflowState,
  formData: FormData,
): Promise<WorkflowState> {
  const user = await requireRole(["PENGELOLA_DTSEN", "ADMIN"]);
  const permohonanId = String(formData.get("permohonanId") ?? "");
  const file = formData.get("file");
  if (!permohonanId || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pilih file berkas DTSEN terlebih dahulu." };
  }

  const permohonan = await prisma.permohonan.findUnique({
    where: { id: permohonanId },
    select: { id: true, status: true },
  });
  if (!permohonan) return { ok: false, error: "Permohonan tidak ditemukan." };
  if (permohonan.status !== "DISETUJUI") {
    return { ok: false, error: "Berkas hanya bisa diunggah saat status DISETUJUI." };
  }

  const up = await uploadFile({
    bucket: BUCKETS.BERKAS_DTSEN,
    pathPrefix: `${permohonan.id}`,
    file,
  });

  const diserahkanPada = new Date();
  const deadline = new Date(diserahkanPada);
  deadline.setDate(deadline.getDate() + 30);

  await prisma.$transaction([
    prisma.berkasDtsen.create({
      data: {
        permohonanId,
        filePath: up.path,
        fileName: up.fileName,
        fileHashSha256: up.sha256,
        mimeType: up.mimeType,
        sizeBytes: up.sizeBytes,
        diserahkanById: user.id,
        diserahkanPada,
      },
    }),
    prisma.permohonan.update({
      where: { id: permohonanId },
      data: {
        status: "SELESAI",
        currentHandlerRole: null,
        completedAt: new Date(),
        catatanTerakhir: null,
      },
    }),
    prisma.riwayatPermohonan.create({
      data: {
        permohonanId,
        actorId: user.id,
        actorRole: user.role,
        aksi: "UPLOAD_DATA",
        dariStatus: "DISETUJUI",
        keStatus: "SELESAI",
        catatan: `Berkas DTSEN diunggah: ${up.fileName}`,
      },
    }),
    // Buat laporan pemanfaatan kosong dengan deadline 30 hari
    prisma.laporanPemanfaatan.create({
      data: {
        permohonanId,
        pelaporId: (await prisma.permohonan.findUnique({
          where: { id: permohonanId },
          select: { pemohonId: true },
        }))!.pemohonId,
        judulKegiatan: "",
        periodeMulai: diserahkanPada,
        periodeSelesai: deadline,
        outputKegiatan: "",
        manfaatData: "",
        status: "BELUM_DIKIRIM",
        deadlineAt: deadline,
      },
    }),
  ]);

  await notifyTransition({
    permohonanId,
    fromStatus: "DISETUJUI",
    toStatus: "SELESAI",
    actorId: user.id,
    actorRole: user.role,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/permohonan/${permohonanId}`);
  return { ok: true, message: "Berkas DTSEN berhasil diserahkan & laporan dibuat." };
}

function flattenFieldErrors(err: z.ZodError): Record<string, string[]> {
  const tree = z.treeifyError(err);
  const out: Record<string, string[]> = {};
  const props = (tree as { properties?: Record<string, { errors?: string[] }> }).properties;
  if (!props) return out;
  for (const [key, child] of Object.entries(props)) {
    if (child.errors && child.errors.length) out[key] = child.errors;
  }
  return out;
}
