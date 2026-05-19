// Admin Backup: bundle semua Permohonan + Laporan + dokumen PDF ke dalam satu file ZIP.
// Stream agar tidak meledakkan memori saat data besar.
import { redirect } from "next/navigation";
import archiver from "archiver";
import type { JenisDokumen } from "@prisma/client";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { BUCKETS, downloadFileBuffer } from "@/lib/storage";
import { generateRingkasanPdf } from "@/lib/backup/ringkasan-pdf";

export const dynamic = "force-dynamic";
// Backup bisa lama untuk data besar — beri ruang.
export const maxDuration = 300;

const DOK_LABEL: Record<JenisDokumen, string> = {
  SURAT_PERMINTAAN: "01-surat-permintaan",
  KAK: "02-kerangka-acuan-kerja",
  PAKTA_INTEGRITAS: "03-pakta-integritas",
  NDA: "04-nda",
};

function sanitizeFolder(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

export async function GET() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const permohonanList = await prisma.permohonan.findMany({
    include: {
      opdPemohon: true,
      pemohon: true,
      dokumen: {
        include: { uploadedBy: { select: { nama: true } } },
        orderBy: { uploadedAt: "asc" },
      },
      berkasDtsen: {
        include: { diserahkanBy: { select: { nama: true } } },
      },
      laporan: true,
      riwayat: {
        include: { actor: { select: { nama: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const archive = archiver("zip", { zlib: { level: 9 } });
  const errors: { permohonanId: string; message: string }[] = [];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Guard: ReadableStreamDefaultController error/close hanya boleh dipanggil sekali.
      // Tanpa flag, kombinasi `archive.on('error')` + IIFE catch / cancel() bisa
      // memanggil controller.error() dua kali → unhandled exception.
      let streamDone = false;
      const safeClose = () => {
        if (streamDone) return;
        streamDone = true;
        try {
          controller.close();
        } catch {
          // ignore — controller mungkin sudah ditutup pihak lain (race)
        }
      };
      const safeError = (err: unknown) => {
        if (streamDone) return;
        streamDone = true;
        try {
          controller.error(err);
        } catch {
          // ignore
        }
      };

      archive.on("data", (chunk: Buffer) => {
        if (streamDone) return;
        try {
          controller.enqueue(new Uint8Array(chunk));
        } catch (err) {
          safeError(err);
        }
      });
      archive.on("end", () => {
        safeClose();
      });
      archive.on("warning", (err: Error) => {
        console.warn("[backup] archive warning:", err);
      });
      archive.on("error", (err: Error) => {
        safeError(err);
      });

      // Append top-level README dulu — non-blocking.
      const readme = [
        "Portal DTSEN Bangkalan — Backup Data",
        "=====================================",
        `Dibuat: ${new Date().toISOString()}`,
        `Total Permohonan: ${permohonanList.length}`,
        "",
        "Struktur:",
        "  - Setiap permohonan punya folder sendiri.",
        "  - ringkasan.pdf = isian form + audit trail dalam PDF.",
        "  - Dokumen persyaratan (4 PDF) tersimpan dengan prefix 01-04.",
        "  - berkas-dtsen.pdf = berkas final dari Dinsos (kalau ada).",
        "  - laporan/ = folder berisi lampiran laporan pemanfaatan (kalau ada).",
        "",
      ].join("\n");
      archive.append(readme, { name: `backup-portal-dtsen-${stamp}/README.txt` });

      // Streaming async pipeline — gunakan IIFE supaya tidak block constructor.
      (async () => {
        try {
          for (const p of permohonanList) {
            const folderName = sanitizeFolder(
              `${p.nomorSurat ?? p.id.slice(0, 8)}_${p.judul.slice(0, 40)}`,
            );
            const folder = `backup-portal-dtsen-${stamp}/${folderName}`;

            // 1. Generate ringkasan PDF
            try {
              const ringkasan = await generateRingkasanPdf({
                permohonan: p,
                dokumen: p.dokumen.map((d) => ({
                  jenisDokumen: d.jenisDokumen,
                  fileName: d.fileName,
                  sizeBytes: d.sizeBytes,
                  fileHashSha256: d.fileHashSha256,
                  uploadedAt: d.uploadedAt,
                })),
                berkas: p.berkasDtsen
                  ? {
                      fileName: p.berkasDtsen.fileName,
                      sizeBytes: p.berkasDtsen.sizeBytes,
                      diserahkanPada: p.berkasDtsen.diserahkanPada,
                      diserahkanBy: p.berkasDtsen.diserahkanBy,
                    }
                  : null,
                laporan: p.laporan
                  ? {
                      judulKegiatan: p.laporan.judulKegiatan,
                      periodeMulai: p.laporan.periodeMulai,
                      periodeSelesai: p.laporan.periodeSelesai,
                      outputKegiatan: p.laporan.outputKegiatan,
                      manfaatData: p.laporan.manfaatData,
                      jumlahRecordData: p.laporan.jumlahRecordData,
                      status: p.laporan.status,
                      filePendukungName: p.laporan.filePendukungName,
                      deadlineAt: p.laporan.deadlineAt,
                      dikirimAt: p.laporan.dikirimAt,
                      direviewBapperidaAt: p.laporan.direviewBapperidaAt,
                      direviewDinsosAt: p.laporan.direviewDinsosAt,
                      disetujuiAt: p.laporan.disetujuiAt,
                    }
                  : null,
                riwayatPermohonan: p.riwayat,
                riwayatLaporan: [],
              });
              archive.append(Buffer.from(ringkasan), { name: `${folder}/ringkasan.pdf` });
            } catch (err) {
              errors.push({
                permohonanId: p.id,
                message: `ringkasan: ${err instanceof Error ? err.message : String(err)}`,
              });
            }

            // 2. Dokumen persyaratan (4 PDF)
            for (const dok of p.dokumen) {
              try {
                const buf = await downloadFileBuffer(BUCKETS.PERMOHONAN_DOKUMEN, dok.filePath);
                const safeName = `${DOK_LABEL[dok.jenisDokumen]}_${sanitizeFolder(dok.fileName)}`;
                archive.append(buf, { name: `${folder}/${safeName}` });
              } catch (err) {
                errors.push({
                  permohonanId: p.id,
                  message: `dokumen ${dok.jenisDokumen}: ${
                    err instanceof Error ? err.message : String(err)
                  }`,
                });
              }
            }

            // 3. Berkas DTSEN (kalau ada)
            if (p.berkasDtsen) {
              try {
                const buf = await downloadFileBuffer(
                  BUCKETS.BERKAS_DTSEN,
                  p.berkasDtsen.filePath,
                );
                archive.append(buf, {
                  name: `${folder}/berkas-dtsen_${sanitizeFolder(p.berkasDtsen.fileName)}`,
                });
              } catch (err) {
                errors.push({
                  permohonanId: p.id,
                  message: `berkas-dtsen: ${err instanceof Error ? err.message : String(err)}`,
                });
              }
            }

            // 4. Lampiran laporan (kalau ada)
            if (p.laporan?.filePendukungPath && p.laporan.filePendukungName) {
              try {
                const buf = await downloadFileBuffer(
                  BUCKETS.LAPORAN_PENDUKUNG,
                  p.laporan.filePendukungPath,
                );
                archive.append(buf, {
                  name: `${folder}/laporan/${sanitizeFolder(p.laporan.filePendukungName)}`,
                });
              } catch (err) {
                errors.push({
                  permohonanId: p.id,
                  message: `lampiran laporan: ${err instanceof Error ? err.message : String(err)}`,
                });
              }
            }
          }

          if (errors.length > 0) {
            const errLog = [
              "Backup selesai dengan beberapa file gagal di-download.",
              "Cek konektivitas Supabase Storage / path file di DB.",
              "",
              ...errors.map((e) => `- ${e.permohonanId}: ${e.message}`),
            ].join("\n");
            archive.append(errLog, {
              name: `backup-portal-dtsen-${stamp}/ERRORS.txt`,
            });
          }

          await archive.finalize();
        } catch (err) {
          safeError(err);
        }
      })();
    },
    cancel() {
      // Client batal → abort archiver. Event 'error' archiver yang muncul setelah
      // ini akan ter-noop berkat streamDone flag di safeError.
      try {
        archive.abort();
      } catch {
        // ignore
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="backup-portal-dtsen-${stamp}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
