// Template email HTML sederhana (no React Email — biar bundle kecil).

import { APP_NAME } from "@/lib/constants";

const PRIMARY = "#0e4d92";
const ACCENT = "#caa54b";

function shell(opts: {
  title: string;
  preheader?: string;
  body: string;
  cta?: { label: string; url: string };
}) {
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0b1220;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;opacity:0">${escapeHtml(opts.preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6fb;padding:24px 0">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(11,18,32,.06)">
  <tr><td style="background:${PRIMARY};padding:18px 24px;color:#fff;font-weight:600;font-size:14px;letter-spacing:.3px;text-transform:uppercase">${escapeHtml(APP_NAME)}</td></tr>
  <tr><td style="padding:28px 28px 8px;font-size:20px;font-weight:600;line-height:1.3">${escapeHtml(opts.title)}</td></tr>
  <tr><td style="padding:6px 28px 22px;font-size:14px;line-height:1.65;color:#374151">${opts.body}</td></tr>
  ${
    opts.cta
      ? `<tr><td style="padding:6px 28px 28px"><a href="${escapeAttr(opts.cta.url)}" style="display:inline-block;background:${PRIMARY};color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-weight:600;font-size:14px">${escapeHtml(opts.cta.label)}</a></td></tr>`
      : ""
  }
  <tr><td style="padding:14px 28px 24px;border-top:1px solid #eef0f5;font-size:11px;line-height:1.5;color:#6b7280">Email otomatis dari ${escapeHtml(APP_NAME)}. Mohon tidak membalas email ini.<br/><span style="color:${ACCENT};font-weight:600">Akuntabel · Cepat · Terdokumentasi</span></td></tr>
</table>
</td></tr></table></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

export function permohonanEmail(opts: {
  judul: string;
  nomor?: string | null;
  ringkasanAksi: string;
  catatan?: string | null;
  ctaUrl: string;
  ctaLabel?: string;
  preheader?: string;
}): { html: string; text: string } {
  const body = `
<p>Halo,</p>
<p>Ada pembaruan pada permohonan <strong>${escapeHtml(opts.judul)}</strong>${opts.nomor ? ` (${escapeHtml(opts.nomor)})` : ""}.</p>
<p style="margin:14px 0;padding:12px 14px;background:#f4f6fb;border-radius:10px;border-left:3px solid ${PRIMARY}"><strong>${escapeHtml(opts.ringkasanAksi)}</strong></p>
${opts.catatan ? `<p><em>Catatan:</em><br/>${escapeHtml(opts.catatan)}</p>` : ""}
<p>Silakan buka portal untuk tindak lanjut.</p>`;
  const text = `${opts.ringkasanAksi}\n${opts.judul}${opts.nomor ? ` (${opts.nomor})` : ""}${opts.catatan ? `\nCatatan: ${opts.catatan}` : ""}\n${opts.ctaUrl}`;
  return {
    html: shell({
      title: opts.ringkasanAksi,
      preheader: opts.preheader,
      body,
      cta: { label: opts.ctaLabel ?? "Buka Permohonan", url: opts.ctaUrl },
    }),
    text,
  };
}

export function laporanEmail(opts: {
  judul: string;
  jenis: "REMINDER_H_MINUS_7" | "REMINDER_H_MINUS_1" | "REMINDER_OVERDUE" | "REVIEW";
  pesan: string;
  ctaUrl: string;
  catatan?: string | null;
}): { html: string; text: string } {
  const judulEmail =
    opts.jenis === "REMINDER_H_MINUS_7"
      ? "Pelaporan akan jatuh tempo 7 hari lagi"
      : opts.jenis === "REMINDER_H_MINUS_1"
        ? "Pelaporan jatuh tempo besok"
        : opts.jenis === "REMINDER_OVERDUE"
          ? "Pelaporan melampaui deadline"
          : "Pembaruan Pelaporan";
  const body = `
<p>Halo,</p>
<p>${escapeHtml(opts.pesan)}</p>
<p style="margin:14px 0;padding:12px 14px;background:#f4f6fb;border-radius:10px;border-left:3px solid ${PRIMARY}"><strong>${escapeHtml(opts.judul)}</strong></p>
${opts.catatan ? `<p><em>Catatan:</em><br/>${escapeHtml(opts.catatan)}</p>` : ""}`;
  const text = `${judulEmail}\n${opts.pesan}\n${opts.judul}\n${opts.ctaUrl}`;
  return {
    html: shell({
      title: judulEmail,
      preheader: opts.pesan,
      body,
      cta: { label: "Buka Pelaporan", url: opts.ctaUrl },
    }),
    text,
  };
}
