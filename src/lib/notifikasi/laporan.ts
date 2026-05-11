// Notifikasi khusus Laporan Pemanfaatan.
import type { StatusLaporan, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { APP_URL, FROM_EMAIL, getResend } from "@/lib/email/client";
import { laporanEmail } from "@/lib/email/templates";

type Recipient = { id: string; email: string; nama: string };

async function getRecipientsByRole(role: UserRole): Promise<Recipient[]> {
  return prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true, email: true, nama: true },
  });
}

async function getPelapor(laporanId: string): Promise<Recipient | null> {
  const l = await prisma.laporanPemanfaatan.findUnique({
    where: { id: laporanId },
    select: { pelapor: { select: { id: true, email: true, nama: true } } },
  });
  return l?.pelapor ?? null;
}

export async function notifyLaporanTransition(opts: {
  laporanId: string;
  fromStatus: StatusLaporan;
  toStatus: StatusLaporan;
  actorId: string;
  catatan?: string | null;
}): Promise<void> {
  const { laporanId, toStatus, catatan } = opts;
  const link = `${APP_URL}/dashboard/laporan/${laporanId}`;
  let targets: Recipient[] = [];
  let isi = "";

  switch (toStatus) {
    case "REVIEW_BAPPERIDA":
      targets = await getRecipientsByRole("VERIFIKATOR");
      isi = "Laporan pemanfaatan baru menunggu review Bapperida.";
      break;
    case "REVIEW_DINSOS": {
      const dn = await getRecipientsByRole("PENGELOLA_DTSEN");
      const pelapor = await getPelapor(laporanId);
      targets = pelapor ? [...dn, pelapor] : dn;
      isi = "Laporan disetujui Bapperida — diteruskan ke Dinsos.";
      break;
    }
    case "PERLU_REVISI": {
      const pelapor = await getPelapor(laporanId);
      if (pelapor) targets = [pelapor];
      isi = "Reviewer meminta revisi pada laporan Anda.";
      break;
    }
    case "DISETUJUI": {
      const pelapor = await getPelapor(laporanId);
      if (pelapor) targets = [pelapor];
      isi = "Laporan pemanfaatan disetujui (final) oleh Dinsos.";
      break;
    }
    default:
      return;
  }

  // Dedup + jangan kirim ke aktor
  const seen = new Set<string>();
  const unique = targets.filter((r) => {
    if (seen.has(r.id) || r.id === opts.actorId) return false;
    seen.add(r.id);
    return true;
  });

  if (unique.length === 0) return;

  const detail = await prisma.laporanPemanfaatan.findUnique({
    where: { id: laporanId },
    select: { judulKegiatan: true, permohonan: { select: { judul: true, nomorSurat: true } } },
  });
  const judul = detail?.judulKegiatan?.trim() || detail?.permohonan?.judul || "Laporan Pemanfaatan";

  await prisma.notifikasi.createMany({
    data: unique.map((u) => ({
      userId: u.id,
      permohonanId: undefined,
      judul: isi,
      isi: `${judul}${detail?.permohonan?.nomorSurat ? ` (${detail.permohonan.nomorSurat})` : ""}`,
      linkUrl: link,
    })),
    skipDuplicates: true,
  });

  const resend = getResend();
  if (!resend) return;

  const { html, text } = laporanEmail({
    judul,
    jenis: "REVIEW",
    pesan: isi,
    ctaUrl: link,
    catatan,
  });

  await Promise.allSettled(
    unique.map((u) =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: u.email,
        subject: `[Portal DTSEN · Pelaporan] ${isi}`,
        html,
        text,
      }),
    ),
  );
}
