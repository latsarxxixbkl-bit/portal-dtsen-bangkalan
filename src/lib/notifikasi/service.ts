// Service notifikasi: in-app (DB) + email (Resend, opsional).
import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { APP_URL, FROM_EMAIL, getResend } from "@/lib/email/client";
import { permohonanEmail } from "@/lib/email/templates";

type Recipient = {
  id: string;
  email: string;
  nama: string;
};

async function getRecipientsByRole(role: UserRole): Promise<Recipient[]> {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true, email: true, nama: true },
  });
  return users;
}

async function getPemohon(permohonanId: string): Promise<Recipient | null> {
  const p = await prisma.permohonan.findUnique({
    where: { id: permohonanId },
    select: {
      pemohon: { select: { id: true, email: true, nama: true } },
    },
  });
  return p?.pemohon ?? null;
}

export type NotifyOpts = {
  permohonanId: string;
  judul: string;
  isi: string;
  linkPath?: string;
  /** Untuk email — kalimat ringkas yang muncul di subject. */
  subject?: string;
  /** Catatan opsional (mis. alasan tolak/kembali) untuk tampil di email. */
  catatan?: string | null;
};

/** Kirim notifikasi (in-app + email) ke kumpulan user. */
export async function notifyUsers(
  recipients: Recipient[],
  opts: NotifyOpts,
): Promise<void> {
  if (recipients.length === 0) return;

  const linkUrl = opts.linkPath
    ? `${APP_URL}${opts.linkPath}`
    : `${APP_URL}/dashboard/permohonan/${opts.permohonanId}`;

  // In-app: create per user (batch)
  await prisma.notifikasi.createMany({
    data: recipients.map((r) => ({
      userId: r.id,
      permohonanId: opts.permohonanId,
      judul: opts.judul,
      isi: opts.isi,
      linkUrl,
    })),
    skipDuplicates: true,
  });

  // Email: best-effort, jangan gagalkan transaksi
  const resend = getResend();
  if (!resend) return;

  const subject = opts.subject ?? opts.judul;
  const detail = await prisma.permohonan.findUnique({
    where: { id: opts.permohonanId },
    select: { judul: true, nomorSurat: true },
  });
  if (!detail) return;

  const { html, text } = permohonanEmail({
    judul: detail.judul,
    nomor: detail.nomorSurat,
    ringkasanAksi: opts.isi,
    catatan: opts.catatan ?? undefined,
    ctaUrl: linkUrl,
    preheader: opts.isi,
  });

  await Promise.allSettled(
    recipients.map((r) =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: r.email,
        subject: `[Portal DTSEN] ${subject}`,
        html,
        text,
      }),
    ),
  );
}

/** Pilih penerima berdasarkan transisi status. */
export async function notifyTransition(opts: {
  permohonanId: string;
  fromStatus: string;
  toStatus: string;
  actorId: string;
  actorRole: UserRole;
  catatan?: string | null;
}): Promise<void> {
  const { permohonanId, toStatus, catatan } = opts;
  const pemohon = await getPemohon(permohonanId);

  // Hitung penerima per status tujuan
  let targets: Recipient[] = [];
  let isi = "";
  let subject = "";

  switch (toStatus) {
    case "VERIFIKATOR_REVIEW": {
      targets = await getRecipientsByRole("VERIFIKATOR");
      isi = "Permohonan baru menunggu verifikasi Bapperida.";
      subject = "Permohonan baru — perlu verifikasi";
      break;
    }
    case "EWALI_REVIEW": {
      const ew = await getRecipientsByRole("EWALI_DATA");
      targets = pemohon ? [...ew, pemohon] : ew;
      isi = "Permohonan diteruskan dari Bapperida ke Diskominfo (E-Wali Data).";
      subject = "Permohonan diteruskan ke E-Wali Data";
      break;
    }
    case "DTSEN_REVIEW": {
      const pd = await getRecipientsByRole("PENGELOLA_DTSEN");
      targets = pemohon ? [...pd, pemohon] : pd;
      isi = "Permohonan diteruskan ke Pengelola DTSEN (Dinas Sosial).";
      subject = "Permohonan diteruskan ke Pengelola DTSEN";
      break;
    }
    case "DIKEMBALIKAN_KE_VERIFIKATOR": {
      targets = await getRecipientsByRole("VERIFIKATOR");
      isi = "Permohonan dikembalikan oleh E-Wali Data untuk klarifikasi.";
      subject = "Permohonan dikembalikan ke Verifikator";
      break;
    }
    case "DIKEMBALIKAN_KE_EWALI": {
      targets = await getRecipientsByRole("EWALI_DATA");
      isi = "Permohonan dikembalikan oleh Pengelola DTSEN untuk validasi ulang.";
      subject = "Permohonan dikembalikan ke E-Wali Data";
      break;
    }
    case "DRAFT": {
      // Dikembalikan ke pemohon untuk revisi
      if (pemohon) targets = [pemohon];
      isi = "Permohonan dikembalikan ke Anda untuk revisi.";
      subject = "Permohonan perlu revisi";
      break;
    }
    case "DITOLAK_VERIFIKATOR": {
      if (pemohon) targets = [pemohon];
      isi = "Permohonan ditolak oleh Bapperida.";
      subject = "Permohonan ditolak";
      break;
    }
    case "DISETUJUI": {
      const pd = await getRecipientsByRole("PENGELOLA_DTSEN");
      targets = pemohon ? [...pd, pemohon] : pd;
      isi = "Permohonan disetujui — menunggu penyerahan Berkas DTSEN.";
      subject = "Permohonan disetujui";
      break;
    }
    case "SELESAI": {
      if (pemohon) targets = [pemohon];
      isi = "Berkas DTSEN telah diserahkan. Pelaporan wajib dikirim dalam 30 hari.";
      subject = "Berkas DTSEN diserahkan";
      break;
    }
    default:
      return;
  }

  // Deduplicate by email (in case actor is also a recipient)
  const seen = new Set<string>();
  const unique = targets.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    // Jangan kirim notifikasi ke aktor sendiri
    return r.id !== opts.actorId;
  });

  await notifyUsers(unique, {
    permohonanId,
    judul: subject,
    isi,
    subject,
    catatan,
  });
}
