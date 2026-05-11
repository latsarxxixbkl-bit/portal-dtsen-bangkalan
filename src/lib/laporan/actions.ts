"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AksiLaporan, StatusLaporan } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { uploadFile, BUCKETS, removeFile } from "@/lib/storage";
import { laporanAvailableActions } from "@/lib/workflow/laporan";
import { notifyLaporanTransition } from "@/lib/notifikasi/laporan";

const LaporanSchema = z.object({
  laporanId: z.string().uuid(),
  judulKegiatan: z.string().min(8, "Judul minimal 8 karakter").max(200),
  periodeMulai: z.string().min(1, "Wajib").transform((v) => new Date(v)),
  periodeSelesai: z.string().min(1, "Wajib").transform((v) => new Date(v)),
  outputKegiatan: z.string().min(20, "Output minimal 20 karakter").max(2000),
  manfaatData: z.string().min(20, "Manfaat minimal 20 karakter").max(2000),
  jumlahRecordData: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null)),
});

export type LaporanFormState =
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }
  | { ok: true; message: string }
  | undefined;

/** Pemohon mengisi & mengirim laporan pemanfaatan. */
export async function submitLaporan(
  _prev: LaporanFormState,
  formData: FormData,
): Promise<LaporanFormState> {
  const user = await requireUser();
  const parsed = LaporanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Periksa kembali isian.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  if (data.periodeSelesai < data.periodeMulai) {
    return {
      ok: false,
      error: "Periode selesai tidak boleh sebelum periode mulai.",
      fieldErrors: { periodeSelesai: ["Tidak boleh sebelum periode mulai."] },
    };
  }
  if (data.jumlahRecordData != null && (Number.isNaN(data.jumlahRecordData) || data.jumlahRecordData < 0)) {
    return {
      ok: false,
      error: "Jumlah record tidak valid.",
      fieldErrors: { jumlahRecordData: ["Harus angka non-negatif."] },
    };
  }

  const laporan = await prisma.laporanPemanfaatan.findUnique({
    where: { id: data.laporanId },
    select: {
      id: true,
      status: true,
      pelaporId: true,
      filePendukungPath: true,
    },
  });
  if (!laporan) return { ok: false, error: "Laporan tidak ditemukan." };
  if (laporan.pelaporId !== user.id && user.role !== "ADMIN") {
    return { ok: false, error: "Hanya pelapor yang bisa mengisi laporan ini." };
  }
  if (
    laporan.status !== "BELUM_DIKIRIM" &&
    laporan.status !== "MENUNGGAK" &&
    laporan.status !== "PERLU_REVISI"
  ) {
    return { ok: false, error: "Laporan tidak dalam status untuk dikirim." };
  }

  // File pendukung opsional saat submit (boleh menyusul kalau sudah pernah diunggah)
  const file = formData.get("filePendukung");
  let fileUpdate:
    | {
        filePendukungPath: string;
        filePendukungName: string;
        filePendukungHashSha256: string;
        filePendukungSizeBytes: number;
      }
    | undefined;

  if (file instanceof File && file.size > 0) {
    if (file.type !== "application/pdf") {
      return {
        ok: false,
        error: "File pendukung harus PDF.",
        fieldErrors: { filePendukung: ["Hanya PDF."] },
      };
    }
    if (file.size > 10 * 1024 * 1024) {
      return {
        ok: false,
        error: "File pendukung melebihi 10 MB.",
        fieldErrors: { filePendukung: ["Maks 10 MB."] },
      };
    }
    try {
      const up = await uploadFile({
        bucket: BUCKETS.LAPORAN_PENDUKUNG,
        pathPrefix: laporan.id,
        file,
      });
      // Hapus file lama jika ada
      if (laporan.filePendukungPath) {
        await removeFile(BUCKETS.LAPORAN_PENDUKUNG, laporan.filePendukungPath).catch(() => {});
      }
      fileUpdate = {
        filePendukungPath: up.path,
        filePendukungName: up.fileName,
        filePendukungHashSha256: up.sha256,
        filePendukungSizeBytes: up.sizeBytes,
      };
    } catch (e) {
      return { ok: false, error: `Gagal mengunggah file pendukung: ${(e as Error).message}` };
    }
  }

  const fromStatus = laporan.status;

  await prisma.$transaction([
    prisma.laporanPemanfaatan.update({
      where: { id: laporan.id },
      data: {
        judulKegiatan: data.judulKegiatan,
        periodeMulai: data.periodeMulai,
        periodeSelesai: data.periodeSelesai,
        outputKegiatan: data.outputKegiatan,
        manfaatData: data.manfaatData,
        jumlahRecordData: data.jumlahRecordData,
        ...fileUpdate,
        status: "REVIEW_BAPPERIDA",
        dikirimAt: new Date(),
      },
    }),
    prisma.riwayatLaporan.create({
      data: {
        laporanId: laporan.id,
        actorId: user.id,
        actorRole: user.role,
        aksi: "KIRIM",
        dariStatus: fromStatus,
        keStatus: "REVIEW_BAPPERIDA",
        catatan: null,
      },
    }),
  ]);

  await notifyLaporanTransition({
    laporanId: laporan.id,
    fromStatus,
    toStatus: "REVIEW_BAPPERIDA",
    actorId: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/laporan");
  revalidatePath(`/dashboard/laporan/${laporan.id}`);
  return { ok: true, message: "Laporan terkirim & menunggu review Bapperida." };
}

const ReviewSchema = z.object({
  laporanId: z.string().uuid(),
  aksi: z.enum([
    "SETUJUI_BAPPERIDA",
    "MINTA_REVISI_BAPPERIDA",
    "SETUJUI_DINSOS",
    "MINTA_REVISI_DINSOS",
  ]),
  catatan: z.string().max(2000).optional(),
});

/** Reviewer (Bapperida / Dinsos) menyetujui atau minta revisi. */
export async function reviewLaporan(
  _prev: LaporanFormState,
  formData: FormData,
): Promise<LaporanFormState> {
  const user = await requireUser();
  const parsed = ReviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "Parameter review tidak valid." };
  }
  const { laporanId, aksi, catatan } = parsed.data;

  const laporan = await prisma.laporanPemanfaatan.findUnique({
    where: { id: laporanId },
    select: { id: true, status: true, pelaporId: true },
  });
  if (!laporan) return { ok: false, error: "Laporan tidak ditemukan." };

  const allowed = laporanAvailableActions(laporan.status, user.role);
  const target = allowed.find((a) => a.aksi === aksi);
  if (!target) return { ok: false, error: "Aksi tidak diizinkan." };
  if (target.requiresNote && !catatan?.trim()) {
    return { ok: false, error: "Catatan revisi wajib diisi." };
  }

  const fromStatus = laporan.status;
  const toStatus = target.toStatus;

  const updates: Record<string, unknown> = {
    status: toStatus,
  };

  if (aksi === "SETUJUI_BAPPERIDA" || aksi === "MINTA_REVISI_BAPPERIDA") {
    updates.catatanBapperida = catatan?.trim() || null;
    updates.direviewBapperidaAt = new Date();
    updates.direviewBapperidaById = user.id;
  }
  if (aksi === "SETUJUI_DINSOS" || aksi === "MINTA_REVISI_DINSOS") {
    updates.catatanDinsos = catatan?.trim() || null;
    updates.direviewDinsosAt = new Date();
    updates.direviewDinsosById = user.id;
  }
  if (toStatus === "DISETUJUI") {
    updates.disetujuiAt = new Date();
  }

  await prisma.$transaction([
    prisma.laporanPemanfaatan.update({
      where: { id: laporanId },
      data: updates,
    }),
    prisma.riwayatLaporan.create({
      data: {
        laporanId,
        actorId: user.id,
        actorRole: user.role,
        aksi: aksi as AksiLaporan,
        dariStatus: fromStatus,
        keStatus: toStatus,
        catatan: catatan?.trim() || null,
      },
    }),
  ]);

  await notifyLaporanTransition({
    laporanId,
    fromStatus,
    toStatus: toStatus as StatusLaporan,
    actorId: user.id,
    catatan: catatan?.trim() || null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/laporan");
  revalidatePath(`/dashboard/laporan/${laporanId}`);
  return { ok: true, message: `Aksi "${target.label}" berhasil.` };
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
