// Pengirim reminder Pelaporan: H-7, H-1, H+1, H+7, H+14, H+30, escalate.
// Dipanggil oleh /api/cron/laporan-reminder (sekali sehari).
import type { JenisReminder, StatusLaporan } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { APP_URL, FROM_EMAIL, getResend } from "@/lib/email/client";
import { laporanEmail } from "@/lib/email/templates";

/** Jadwal reminder relatif terhadap deadline. */
const SCHEDULE: { jenis: JenisReminder; offsetDays: number }[] = [
  { jenis: "H_MINUS_7", offsetDays: -7 },
  { jenis: "H_MINUS_1", offsetDays: -1 },
  { jenis: "H_PLUS_1", offsetDays: 1 },
  { jenis: "H_PLUS_7", offsetDays: 7 },
  { jenis: "H_PLUS_14", offsetDays: 14 },
  { jenis: "H_PLUS_30", offsetDays: 30 },
  { jenis: "ESCALATE_ATASAN", offsetDays: 30 },
];

type RunResult = {
  total: number;
  reminderSent: number;
  overdueMarked: number;
  errors: { laporanId: string; jenis: JenisReminder; error: string }[];
};

function midnight(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Kirim reminder yang due hari ini.
 * - Hanya kirim untuk laporan yang BELUM_DIKIRIM / MENUNGGAK / PERLU_REVISI.
 * - Tandai MENUNGGAK bila deadline lewat & masih BELUM_DIKIRIM.
 * - Idempotent via LaporanReminderLog.
 */
export async function runLaporanReminder(today = new Date()): Promise<RunResult> {
  const result: RunResult = { total: 0, reminderSent: 0, overdueMarked: 0, errors: [] };

  // Mark overdue
  const overdueUpdate = await prisma.laporanPemanfaatan.updateMany({
    where: {
      status: "BELUM_DIKIRIM",
      deadlineAt: { lt: midnight(today) },
    },
    data: { status: "MENUNGGAK" },
  });
  result.overdueMarked = overdueUpdate.count;

  // Ambil laporan kandidat (belum disetujui)
  const candidates = await prisma.laporanPemanfaatan.findMany({
    where: {
      status: { in: ["BELUM_DIKIRIM", "MENUNGGAK", "PERLU_REVISI"] satisfies StatusLaporan[] },
    },
    include: {
      pelapor: { select: { id: true, email: true, nama: true } },
      permohonan: { select: { judul: true, nomorSurat: true } },
      reminderLog: { select: { jenisReminder: true } },
    },
  });
  result.total = candidates.length;

  const resend = getResend();
  const todayMid = midnight(today);

  for (const l of candidates) {
    const deadlineMid = midnight(l.deadlineAt);
    const sentJenis = new Set(l.reminderLog.map((r) => r.jenisReminder));

    for (const s of SCHEDULE) {
      const scheduled = addDays(deadlineMid, s.offsetDays);
      // Eligible jika hari ini >= scheduled & belum dikirim
      if (todayMid < scheduled) continue;
      if (sentJenis.has(s.jenis)) continue;

      try {
        // Tentukan target & pesan
        const link = `${APP_URL}/dashboard/laporan/${l.id}`;
        const recipients: { id: string; email: string }[] = [
          { id: l.pelapor.id, email: l.pelapor.email },
        ];

        // Escalate ke Bapperida + Dinsos
        if (s.jenis === "ESCALATE_ATASAN") {
          const atasan = await prisma.user.findMany({
            where: {
              role: { in: ["VERIFIKATOR", "PENGELOLA_DTSEN"] },
              isActive: true,
            },
            select: { id: true, email: true },
          });
          recipients.push(...atasan);
        }

        let pesan: string;
        let jenisEmail: "REMINDER_H_MINUS_7" | "REMINDER_H_MINUS_1" | "REMINDER_OVERDUE";
        if (s.offsetDays < 0) {
          pesan = `Deadline pelaporan tinggal ${Math.abs(s.offsetDays)} hari. Mohon segera dikirim.`;
          jenisEmail = s.offsetDays === -7 ? "REMINDER_H_MINUS_7" : "REMINDER_H_MINUS_1";
        } else if (s.offsetDays === 1) {
          pesan = "Deadline pelaporan kemarin terlewat. Mohon segera dikirim.";
          jenisEmail = "REMINDER_OVERDUE";
        } else {
          pesan = `Pelaporan telah melewati deadline ${s.offsetDays} hari. Mohon segera tindak lanjut.`;
          jenisEmail = "REMINDER_OVERDUE";
        }

        const judul = l.judulKegiatan?.trim() || l.permohonan.judul;

        // In-app notif untuk pelapor
        await prisma.notifikasi.create({
          data: {
            userId: l.pelapor.id,
            permohonanId: undefined,
            judul: pesan,
            isi: `${judul}${l.permohonan.nomorSurat ? ` (${l.permohonan.nomorSurat})` : ""}`,
            linkUrl: link,
          },
        });

        if (resend) {
          const { html, text } = laporanEmail({
            judul,
            jenis: jenisEmail,
            pesan,
            ctaUrl: link,
          });
          await Promise.allSettled(
            recipients.map((r) =>
              resend.emails.send({
                from: FROM_EMAIL,
                to: r.email,
                subject: `[Portal DTSEN · Pelaporan] ${pesan}`,
                html,
                text,
              }),
            ),
          );
        }

        await prisma.laporanReminderLog.create({
          data: { laporanId: l.id, jenisReminder: s.jenis },
        });
        result.reminderSent += 1;
      } catch (e) {
        result.errors.push({
          laporanId: l.id,
          jenis: s.jenis,
          error: (e as Error).message,
        });
      }
    }
  }

  return result;
}
