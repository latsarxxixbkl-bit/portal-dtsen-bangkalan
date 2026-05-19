// Generate ringkasan PDF per permohonan dari isi form + audit trail.
// Dipakai oleh fitur "Backup Data" (ZIP).
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type {
  AksiPermohonan,
  AksiLaporan,
  StatusPermohonan,
  StatusLaporan,
  UserRole,
} from "@prisma/client";

import {
  STATUS_PERMOHONAN_LABEL,
  STATUS_LAPORAN_LABEL,
  ROLES,
} from "@/lib/constants";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 48;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 48;
const SIZE_BODY = 10.5;
const SIZE_HEADING = 12;
const SIZE_TITLE = 16;
const LINE_HEIGHT = 14;
const ROW_GAP = 4;

const fmtDateID = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const fmtDateTimeID = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export type RingkasanInput = {
  permohonan: {
    id: string;
    nomorSurat: string | null;
    judul: string;
    tujuanPenggunaan: string;
    jenisDataDiminta: string;
    periodeAwal: Date | null;
    periodeAkhir: Date | null;
    status: StatusPermohonan;
    diajukanAt: Date | null;
    disetujuiAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    opdPemohon: { nama: string };
    pemohon: { nama: string; email: string; nip: string | null; jabatan: string | null };
  };
  dokumen: {
    jenisDokumen: string;
    fileName: string;
    sizeBytes: number;
    fileHashSha256: string;
    uploadedAt: Date;
  }[];
  berkas: {
    fileName: string;
    sizeBytes: number;
    diserahkanPada: Date;
    diserahkanBy: { nama: string };
  } | null;
  laporan: {
    judulKegiatan: string;
    periodeMulai: Date;
    periodeSelesai: Date;
    outputKegiatan: string;
    manfaatData: string;
    jumlahRecordData: number | null;
    status: StatusLaporan;
    filePendukungName: string | null;
    deadlineAt: Date;
    dikirimAt: Date | null;
    direviewBapperidaAt: Date | null;
    direviewDinsosAt: Date | null;
    disetujuiAt: Date | null;
  } | null;
  riwayatPermohonan: {
    aksi: AksiPermohonan;
    actorRole: UserRole;
    dariStatus: StatusPermohonan | null;
    keStatus: StatusPermohonan;
    catatan: string | null;
    createdAt: Date;
    actor: { nama: string };
  }[];
  riwayatLaporan: {
    aksi: AksiLaporan;
    actorRole: UserRole;
    catatan: string | null;
    createdAt: Date;
    actor: { nama: string };
  }[];
};

export async function generateRingkasanPdf(
  data: RingkasanInput,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Ringkasan ${data.permohonan.nomorSurat ?? data.permohonan.id}`);
  pdf.setCreator("Portal DTSEN Bangkalan");
  pdf.setProducer("Portal DTSEN Bangkalan");

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const contentWidth = PAGE_WIDTH - 2 * MARGIN_X;

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN_TOP;
  };

  const wrapAt = (
    text: string,
    font: typeof fontRegular,
    size: number,
    maxWidth: number,
  ): string[] => {
    const out: string[] = [];
    const paras = text.split(/\r?\n/);
    for (const para of paras) {
      const words = para.split(/\s+/).filter(Boolean);
      let line = "";
      for (const w of words) {
        const cand = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(cand, size) > maxWidth && line) {
          out.push(line);
          line = w;
        } else {
          line = cand;
        }
      }
      out.push(line);
    }
    return out;
  };
  const wrap = (text: string, font: typeof fontRegular, size: number): string[] =>
    wrapAt(text, font, size, contentWidth);

  const drawText = (
    text: string,
    opts: {
      font?: typeof fontRegular;
      size?: number;
      color?: ReturnType<typeof rgb>;
    } = {},
  ) => {
    const font = opts.font ?? fontRegular;
    const size = opts.size ?? SIZE_BODY;
    const color = opts.color ?? rgb(0.12, 0.16, 0.21);
    for (const line of wrap(text || " ", font, size)) {
      if (y < MARGIN_BOTTOM + LINE_HEIGHT) newPage();
      page.drawText(line, { x: MARGIN_X, y, size, font, color });
      y -= LINE_HEIGHT;
    }
  };

  const drawKV = (label: string, value: string) => {
    if (y < MARGIN_BOTTOM + LINE_HEIGHT * 2) newPage();
    const labelWidth = 150;
    const valueMaxWidth = contentWidth - labelWidth;
    page.drawText(label, {
      x: MARGIN_X,
      y,
      size: SIZE_BODY,
      font: fontBold,
      color: rgb(0.27, 0.31, 0.38),
    });
    // Wrap value text within the narrower value column (not full contentWidth)
    // agar pdf-lib tidak meng-compress huruf untuk muat ke maxWidth.
    const lines = wrapAt(
      value || "—",
      fontRegular,
      SIZE_BODY,
      valueMaxWidth,
    );
    let first = true;
    for (const line of lines) {
      if (y < MARGIN_BOTTOM + LINE_HEIGHT) newPage();
      page.drawText(line, {
        x: MARGIN_X + labelWidth,
        y,
        size: SIZE_BODY,
        font: fontRegular,
        color: rgb(0.12, 0.16, 0.21),
      });
      y -= LINE_HEIGHT;
      first = false;
    }
    if (first) y -= LINE_HEIGHT;
    y -= ROW_GAP;
  };

  const drawSection = (title: string) => {
    if (y < MARGIN_BOTTOM + LINE_HEIGHT * 3) newPage();
    y -= 6;
    page.drawText(title.toUpperCase(), {
      x: MARGIN_X,
      y,
      size: SIZE_HEADING,
      font: fontBold,
      color: rgb(0.07, 0.27, 0.55),
    });
    y -= LINE_HEIGHT - 2;
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: PAGE_WIDTH - MARGIN_X, y },
      thickness: 0.7,
      color: rgb(0.78, 0.83, 0.88),
    });
    y -= ROW_GAP + 6;
  };

  // ── Kop ──
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 28,
    width: PAGE_WIDTH,
    height: 28,
    color: rgb(0.07, 0.27, 0.55),
  });
  page.drawText("PORTAL DTSEN BANGKALAN", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 19,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Ringkasan Permohonan Data DTSEN", {
    x: PAGE_WIDTH - MARGIN_X - 200,
    y: PAGE_HEIGHT - 19,
    size: 10,
    font: fontRegular,
    color: rgb(0.85, 0.91, 0.98),
  });

  y = PAGE_HEIGHT - MARGIN_TOP - 12;
  page.drawText(data.permohonan.judul, {
    x: MARGIN_X,
    y,
    size: SIZE_TITLE,
    font: fontBold,
    color: rgb(0.07, 0.16, 0.31),
  });
  y -= LINE_HEIGHT + 4;
  page.drawText(
    `Nomor Surat: ${data.permohonan.nomorSurat ?? "—"}  ·  Status: ${
      STATUS_PERMOHONAN_LABEL[data.permohonan.status] ?? data.permohonan.status
    }`,
    {
      x: MARGIN_X,
      y,
      size: SIZE_BODY,
      font: fontRegular,
      color: rgb(0.35, 0.4, 0.47),
    },
  );
  y -= LINE_HEIGHT + 6;

  // ── Identitas ──
  drawSection("Identitas Permohonan");
  drawKV("Nomor Surat", data.permohonan.nomorSurat ?? "—");
  drawKV("OPD Pemohon", data.permohonan.opdPemohon.nama);
  drawKV("Pemohon", data.permohonan.pemohon.nama);
  drawKV("NIP", data.permohonan.pemohon.nip ?? "—");
  drawKV("Jabatan", data.permohonan.pemohon.jabatan ?? "—");
  drawKV("Email", data.permohonan.pemohon.email);
  drawKV("Status", STATUS_PERMOHONAN_LABEL[data.permohonan.status] ?? data.permohonan.status);
  drawKV(
    "Periode Data",
    data.permohonan.periodeAwal && data.permohonan.periodeAkhir
      ? `${fmtDateID.format(data.permohonan.periodeAwal)} – ${fmtDateID.format(
          data.permohonan.periodeAkhir,
        )}`
      : "—",
  );
  drawKV("Diajukan", data.permohonan.diajukanAt ? fmtDateTimeID.format(data.permohonan.diajukanAt) : "—");
  drawKV("Disetujui", data.permohonan.disetujuiAt ? fmtDateTimeID.format(data.permohonan.disetujuiAt) : "—");
  drawKV("Diselesaikan", data.permohonan.completedAt ? fmtDateTimeID.format(data.permohonan.completedAt) : "—");

  // ── Isi Permohonan ──
  drawSection("Isi Permohonan");
  drawText("Tujuan Penggunaan:", { font: fontBold });
  drawText(data.permohonan.tujuanPenggunaan);
  y -= ROW_GAP;
  drawText("Jenis Data yang Dimohonkan:", { font: fontBold });
  drawText(data.permohonan.jenisDataDiminta);

  // ── Dokumen Persyaratan ──
  drawSection("Dokumen Persyaratan");
  if (data.dokumen.length === 0) {
    drawText("(belum ada dokumen yang diunggah)", { font: fontItalic, color: rgb(0.5, 0.55, 0.62) });
  } else {
    for (const d of data.dokumen) {
      drawText(
        `• ${d.jenisDokumen.replace(/_/g, " ")} — ${d.fileName} (${Math.round(d.sizeBytes / 1024)} KB) · ${fmtDateTimeID.format(d.uploadedAt)}`,
      );
      drawText(`  SHA-256: ${d.fileHashSha256.slice(0, 32)}…`, {
        font: fontItalic,
        color: rgb(0.5, 0.55, 0.62),
      });
    }
  }

  // ── Berkas DTSEN ──
  drawSection("Berkas Data DTSEN");
  if (!data.berkas) {
    drawText("(berkas belum diserahkan)", { font: fontItalic, color: rgb(0.5, 0.55, 0.62) });
  } else {
    drawKV("Nama File", data.berkas.fileName);
    drawKV("Ukuran", `${Math.round(data.berkas.sizeBytes / 1024)} KB`);
    drawKV("Diserahkan Pada", fmtDateTimeID.format(data.berkas.diserahkanPada));
    drawKV("Diserahkan Oleh", data.berkas.diserahkanBy.nama);
  }

  // ── Laporan Pemanfaatan ──
  drawSection("Laporan Pemanfaatan");
  if (!data.laporan) {
    drawText("(laporan belum dibuat)", { font: fontItalic, color: rgb(0.5, 0.55, 0.62) });
  } else {
    drawKV("Judul Kegiatan", data.laporan.judulKegiatan);
    drawKV(
      "Periode Pemanfaatan",
      `${fmtDateID.format(data.laporan.periodeMulai)} – ${fmtDateID.format(data.laporan.periodeSelesai)}`,
    );
    drawKV("Status", STATUS_LAPORAN_LABEL[data.laporan.status] ?? data.laporan.status);
    drawKV("Deadline", fmtDateID.format(data.laporan.deadlineAt));
    drawKV("Dikirim", data.laporan.dikirimAt ? fmtDateTimeID.format(data.laporan.dikirimAt) : "—");
    drawKV(
      "Direview Bapperida",
      data.laporan.direviewBapperidaAt ? fmtDateTimeID.format(data.laporan.direviewBapperidaAt) : "—",
    );
    drawKV(
      "Direview Dinsos",
      data.laporan.direviewDinsosAt ? fmtDateTimeID.format(data.laporan.direviewDinsosAt) : "—",
    );
    drawKV(
      "Disetujui Final",
      data.laporan.disetujuiAt ? fmtDateTimeID.format(data.laporan.disetujuiAt) : "—",
    );
    drawKV("Jumlah Record", data.laporan.jumlahRecordData?.toString() ?? "—");
    drawKV("File Pendukung", data.laporan.filePendukungName ?? "—");
    y -= ROW_GAP;
    drawText("Output Kegiatan:", { font: fontBold });
    drawText(data.laporan.outputKegiatan);
    y -= ROW_GAP;
    drawText("Manfaat Data:", { font: fontBold });
    drawText(data.laporan.manfaatData);
  }

  // ── Riwayat ──
  drawSection("Riwayat Permohonan");
  if (data.riwayatPermohonan.length === 0) {
    drawText("(belum ada aktivitas)", { font: fontItalic, color: rgb(0.5, 0.55, 0.62) });
  } else {
    for (const r of data.riwayatPermohonan) {
      const fromTo = r.dariStatus
        ? `${STATUS_PERMOHONAN_LABEL[r.dariStatus]} → ${STATUS_PERMOHONAN_LABEL[r.keStatus]}`
        : `→ ${STATUS_PERMOHONAN_LABEL[r.keStatus]}`;
      drawText(
        `• ${fmtDateTimeID.format(r.createdAt)} · ${r.aksi} · ${r.actor.nama} (${ROLES[r.actorRole] ?? r.actorRole}) — ${fromTo}`,
      );
      if (r.catatan) {
        drawText(`  Catatan: ${r.catatan}`, { font: fontItalic, color: rgb(0.5, 0.55, 0.62) });
      }
    }
  }

  if (data.riwayatLaporan.length > 0) {
    drawSection("Riwayat Laporan");
    for (const r of data.riwayatLaporan) {
      drawText(
        `• ${fmtDateTimeID.format(r.createdAt)} · ${r.aksi} · ${r.actor.nama} (${ROLES[r.actorRole] ?? r.actorRole})`,
      );
      if (r.catatan) {
        drawText(`  Catatan: ${r.catatan}`, { font: fontItalic, color: rgb(0.5, 0.55, 0.62) });
      }
    }
  }

  // ── Footer halaman terakhir ──
  if (y < MARGIN_BOTTOM + 40) newPage();
  page.drawText(
    `Dokumen ringkasan otomatis · Portal DTSEN Bangkalan · ${fmtDateTimeID.format(new Date())}`,
    {
      x: MARGIN_X,
      y: MARGIN_BOTTOM - 20,
      size: 8,
      font: fontItalic,
      color: rgb(0.55, 0.6, 0.66),
    },
  );

  return await pdf.save();
}
