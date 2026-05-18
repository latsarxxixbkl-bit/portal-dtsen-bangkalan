// Generator PDF template surat untuk Portal DTSEN Bangkalan.
// Memakai pdf-lib agar bisa generate di runtime tanpa file biner di repo.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type TemplateType =
  | "surat-permintaan"
  | "kak"
  | "pakta-integritas"
  | "nda"
  | "laporan-pemanfaatan";

export type TemplateMeta = {
  type: TemplateType;
  judul: string;
  ringkasan: string;
  filename: string;
};

export const TEMPLATES: TemplateMeta[] = [
  {
    type: "surat-permintaan",
    judul: "Surat Permintaan Data DTSEN",
    ringkasan:
      "Surat resmi dari Kepala OPD ke Bupati Bangkalan untuk meminta data DTSEN sesuai kebutuhan program.",
    filename: "template-surat-permintaan-data-dtsen.pdf",
  },
  {
    type: "kak",
    judul: "Kerangka Acuan Kerja (KAK)",
    ringkasan:
      "Dokumen KAK berisi latar belakang, tujuan, ruang lingkup, dan keluaran pemanfaatan data DTSEN.",
    filename: "template-kerangka-acuan-kerja.pdf",
  },
  {
    type: "pakta-integritas",
    judul: "Pakta Integritas",
    ringkasan:
      "Surat pernyataan integritas yang ditandatangani Kepala OPD terkait pemanfaatan data DTSEN.",
    filename: "template-pakta-integritas.pdf",
  },
  {
    type: "nda",
    judul: "Non-Disclosure Agreement (NDA)",
    ringkasan:
      "Perjanjian kerahasiaan untuk menjaga data DTSEN tidak disebarluaskan di luar tujuan permohonan.",
    filename: "template-nda.pdf",
  },
  {
    type: "laporan-pemanfaatan",
    judul: "Laporan Pemanfaatan Data DTSEN",
    ringkasan:
      "Format laporan paska pemanfaatan data DTSEN — wajib dikirim maksimal 30 hari setelah berkas diterima.",
    filename: "template-laporan-pemanfaatan.pdf",
  },
];

export function findTemplate(type: string): TemplateMeta | null {
  return TEMPLATES.find((t) => t.type === type) ?? null;
}

type Section = {
  heading?: string;
  paragraphs: string[];
};

const CONTENT: Record<TemplateType, { subjek?: string; sections: Section[] }> = {
  "surat-permintaan": {
    subjek: "Permohonan Data DTSEN Kabupaten Bangkalan",
    sections: [
      {
        paragraphs: [
          "Dengan hormat,",
          "Sehubungan dengan pelaksanaan program ____________________ di lingkungan ____________________ (sebutkan OPD), bersama ini kami mengajukan permohonan untuk dapat memanfaatkan Data Tunggal Sosial Ekonomi Nasional (DTSEN) Kabupaten Bangkalan dengan rincian sebagai berikut:",
        ],
      },
      {
        heading: "1. Jenis Data yang Dimohonkan",
        paragraphs: [
          "____________________ (sebutkan jenis data, mis. data sasaran kemiskinan ekstrem, data penerima manfaat program perlindungan sosial, dll.).",
        ],
      },
      {
        heading: "2. Periode Data",
        paragraphs: ["Periode: ____________________ s/d ____________________."],
      },
      {
        heading: "3. Tujuan Pemanfaatan",
        paragraphs: [
          "Data tersebut akan dipergunakan untuk ____________________ (jelaskan tujuan singkat).",
        ],
      },
      {
        heading: "4. Penanggung Jawab",
        paragraphs: [
          "Nama: ____________________",
          "NIP: ____________________",
          "Jabatan: ____________________",
          "Kontak: ____________________ (email & HP)",
        ],
      },
      {
        heading: "5. Lampiran",
        paragraphs: [
          "Kerangka Acuan Kerja (KAK), Pakta Integritas, dan NDA terlampir.",
        ],
      },
      {
        paragraphs: [
          "Demikian permohonan ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
          "",
          "Bangkalan, ____________________",
          "Kepala OPD,",
          "",
          "",
          "____________________________",
          "NIP. ________________________",
        ],
      },
    ],
  },
  kak: {
    subjek: "Kerangka Acuan Kerja Pemanfaatan Data DTSEN",
    sections: [
      {
        heading: "I. Latar Belakang",
        paragraphs: [
          "____________________ (uraikan kondisi atau permasalahan yang mendasari kebutuhan data DTSEN).",
        ],
      },
      {
        heading: "II. Maksud dan Tujuan",
        paragraphs: [
          "Maksud: ____________________",
          "Tujuan: ____________________",
        ],
      },
      {
        heading: "III. Ruang Lingkup",
        paragraphs: [
          "Lokasi: ____________________ (kecamatan/desa).",
          "Sasaran: ____________________",
          "Periode pemanfaatan: ____________________",
        ],
      },
      {
        heading: "IV. Keluaran (Output)",
        paragraphs: [
          "1. ____________________",
          "2. ____________________",
          "3. ____________________",
        ],
      },
      {
        heading: "V. Indikator Keberhasilan",
        paragraphs: [
          "Cakupan sasaran tercapai: ____________________ %",
          "Tingkat akurasi data: ____________________",
        ],
      },
      {
        heading: "VI. Penanggung Jawab & Tim",
        paragraphs: [
          "Penanggung Jawab: ____________________",
          "Tim Pelaksana: ____________________",
        ],
      },
      {
        heading: "VII. Sumber Pembiayaan",
        paragraphs: ["____________________ (APBD / DAK / Lain-lain)"],
      },
      {
        heading: "VIII. Penutup",
        paragraphs: [
          "Kerangka Acuan Kerja ini menjadi dasar pelaksanaan pemanfaatan Data DTSEN sesuai prinsip kerahasiaan dan akuntabilitas.",
        ],
      },
    ],
  },
  "pakta-integritas": {
    subjek: "Pakta Integritas Pemanfaatan Data DTSEN",
    sections: [
      {
        paragraphs: [
          "Yang bertanda tangan di bawah ini:",
          "Nama: ____________________",
          "NIP: ____________________",
          "Jabatan: ____________________",
          "OPD: ____________________",
        ],
      },
      {
        paragraphs: [
          "Dalam rangka memanfaatkan Data Tunggal Sosial Ekonomi Nasional (DTSEN) Kabupaten Bangkalan, dengan ini menyatakan:",
        ],
      },
      {
        heading: "1.",
        paragraphs: [
          "Akan memanfaatkan data DTSEN hanya untuk keperluan tugas dan fungsi OPD yang sah serta sesuai dengan tujuan yang tertera dalam Surat Permohonan dan KAK.",
        ],
      },
      {
        heading: "2.",
        paragraphs: [
          "Tidak akan menyebarluaskan, menyalin, atau memberikan akses Data DTSEN kepada pihak yang tidak berkepentingan.",
        ],
      },
      {
        heading: "3.",
        paragraphs: [
          "Menjaga kerahasiaan Data DTSEN sesuai ketentuan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi serta peraturan terkait lainnya.",
        ],
      },
      {
        heading: "4.",
        paragraphs: [
          "Bersedia menerima sanksi administratif maupun hukum apabila terdapat pelanggaran terhadap pernyataan di atas.",
        ],
      },
      {
        paragraphs: [
          "Demikian Pakta Integritas ini dibuat dengan sebenar-benarnya tanpa paksaan dari pihak manapun.",
          "",
          "Bangkalan, ____________________",
          "Yang menyatakan,",
          "(meterai Rp10.000)",
          "",
          "____________________________",
          "NIP. ________________________",
        ],
      },
    ],
  },
  nda: {
    subjek: "Non-Disclosure Agreement (NDA) Data DTSEN",
    sections: [
      {
        paragraphs: [
          "Perjanjian Kerahasiaan ini (\"Perjanjian\") dibuat dan ditandatangani pada hari ini ____________________ oleh dan antara:",
        ],
      },
      {
        heading: "PARA PIHAK",
        paragraphs: [
          "PIHAK PERTAMA: Pemerintah Kabupaten Bangkalan, dalam hal ini diwakili oleh ____________________ selaku Kepala Dinas Sosial.",
          "PIHAK KEDUA: ____________________ (OPD pemohon), dalam hal ini diwakili oleh ____________________ selaku ____________________.",
        ],
      },
      {
        heading: "Pasal 1 — Ruang Lingkup",
        paragraphs: [
          "Perjanjian ini mengatur kewajiban PIHAK KEDUA dalam memelihara kerahasiaan Data DTSEN yang diterimanya dari PIHAK PERTAMA.",
        ],
      },
      {
        heading: "Pasal 2 — Kewajiban Kerahasiaan",
        paragraphs: [
          "PIHAK KEDUA berkewajiban:",
          "a. Menggunakan Data DTSEN hanya untuk keperluan yang disepakati;",
          "b. Tidak menggandakan, menyebarkan, atau mengungkapkan Data DTSEN kepada pihak ketiga tanpa izin tertulis PIHAK PERTAMA;",
          "c. Menerapkan kontrol akses dan keamanan data sesuai standar yang berlaku.",
        ],
      },
      {
        heading: "Pasal 3 — Jangka Waktu",
        paragraphs: [
          "Kewajiban kerahasiaan berlaku selama 5 (lima) tahun terhitung sejak penandatanganan Perjanjian ini.",
        ],
      },
      {
        heading: "Pasal 4 — Sanksi",
        paragraphs: [
          "Pelanggaran terhadap Perjanjian ini dapat berakibat pencabutan akses data, sanksi administratif, dan/atau tuntutan hukum sesuai peraturan yang berlaku.",
        ],
      },
      {
        heading: "Pasal 5 — Penutup",
        paragraphs: [
          "Perjanjian ini dibuat rangkap dua, masing-masing pihak menyimpan satu rangkap dengan kekuatan hukum yang sama.",
          "",
          "PIHAK PERTAMA,                                 PIHAK KEDUA,",
          "",
          "",
          "____________________            ____________________",
          "NIP. ______________                  NIP. ______________",
        ],
      },
    ],
  },
  "laporan-pemanfaatan": {
    subjek: "Laporan Pemanfaatan Data DTSEN Kabupaten Bangkalan",
    sections: [
      {
        heading: "I. Identitas Permohonan",
        paragraphs: [
          "Nomor Permohonan: ____________________",
          "Judul Permohonan: ____________________",
          "OPD Pemohon: ____________________",
          "Periode Pemanfaatan: ____________________ s/d ____________________",
        ],
      },
      {
        heading: "II. Judul Kegiatan",
        paragraphs: [
          "____________________ (judul singkat kegiatan yang memanfaatkan data DTSEN).",
        ],
      },
      {
        heading: "III. Output Kegiatan",
        paragraphs: [
          "____________________ (uraikan output konkret, mis. daftar penerima manfaat program X yang sudah terverifikasi DTSEN).",
        ],
      },
      {
        heading: "IV. Manfaat Data",
        paragraphs: [
          "____________________ (jelaskan manfaat aktual data DTSEN bagi pencapaian tujuan kegiatan).",
        ],
      },
      {
        heading: "V. Jumlah Record Data yang Dimanfaatkan",
        paragraphs: ["____________________ record."],
      },
      {
        heading: "VI. Kendala & Tindak Lanjut",
        paragraphs: [
          "Kendala: ____________________",
          "Tindak lanjut: ____________________",
        ],
      },
      {
        heading: "VII. Lampiran",
        paragraphs: [
          "Dokumen pendukung (PDF) yang relevan dilampirkan saat upload Laporan di Portal DTSEN.",
        ],
      },
      {
        paragraphs: [
          "Demikian Laporan Pemanfaatan ini disampaikan untuk dipergunakan sebagaimana mestinya.",
          "",
          "Bangkalan, ____________________",
          "Pelapor,",
          "",
          "",
          "____________________________",
          "NIP. ________________________",
        ],
      },
    ],
  },
};

// PDF settings
const PAGE_WIDTH = 595.28; // A4 portrait pts
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 56;
const MARGIN_TOP = 70;
const MARGIN_BOTTOM = 56;
const FONT_SIZE_BODY = 11;
const FONT_SIZE_HEADING = 12;
const FONT_SIZE_TITLE = 14;
const LINE_HEIGHT = 16;
const PARAGRAPH_SPACING = 8;
const SECTION_SPACING = 12;

export async function generateTemplatePdf(type: TemplateType): Promise<Uint8Array> {
  const meta = TEMPLATES.find((t) => t.type === type);
  const content = CONTENT[type];
  if (!meta || !content) throw new Error(`Template not found: ${type}`);

  const pdf = await PDFDocument.create();
  pdf.setTitle(meta.judul);
  pdf.setAuthor("Portal DTSEN Bangkalan");
  pdf.setSubject(meta.ringkasan);
  pdf.setCreator("Portal DTSEN Bangkalan");

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN_TOP;
  const contentWidth = PAGE_WIDTH - 2 * MARGIN_X;

  const newPage = () => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN_TOP;
  };

  const writeText = (
    text: string,
    opts: { font: typeof fontRegular; size: number; color?: ReturnType<typeof rgb> } = {
      font: fontRegular,
      size: FONT_SIZE_BODY,
    },
  ) => {
    const words = text.split(/\s+/).filter(Boolean);
    let line = "";
    const lines: string[] = [];
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      const width = opts.font.widthOfTextAtSize(candidate, opts.size);
      if (width > contentWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    if (lines.length === 0) lines.push("");

    for (const l of lines) {
      if (y < MARGIN_BOTTOM + LINE_HEIGHT) newPage();
      page.drawText(l, {
        x: MARGIN_X,
        y,
        size: opts.size,
        font: opts.font,
        color: opts.color ?? rgb(0.12, 0.16, 0.21),
      });
      y -= LINE_HEIGHT;
    }
  };

  // Header (kop)
  page.drawText("PEMERINTAH KABUPATEN BANGKALAN", {
    x: MARGIN_X,
    y,
    size: FONT_SIZE_HEADING,
    font: fontBold,
    color: rgb(0.07, 0.27, 0.55),
  });
  y -= LINE_HEIGHT;
  page.drawText("Portal DTSEN — Dinas Sosial Kabupaten Bangkalan", {
    x: MARGIN_X,
    y,
    size: FONT_SIZE_BODY,
    font: fontRegular,
    color: rgb(0.4, 0.46, 0.55),
  });
  y -= LINE_HEIGHT;

  // Garis pembatas
  page.drawLine({
    start: { x: MARGIN_X, y: y - 2 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: y - 2 },
    thickness: 1,
    color: rgb(0.78, 0.83, 0.88),
  });
  y -= SECTION_SPACING + 4;

  // Title
  writeText(meta.judul.toUpperCase(), { font: fontBold, size: FONT_SIZE_TITLE });
  y -= PARAGRAPH_SPACING;

  if (content.subjek) {
    writeText(`Perihal: ${content.subjek}`, { font: fontBold, size: FONT_SIZE_BODY });
    y -= PARAGRAPH_SPACING;
  }

  for (const section of content.sections) {
    if (section.heading) {
      y -= 4;
      writeText(section.heading, { font: fontBold, size: FONT_SIZE_HEADING });
      y -= 2;
    }
    for (const para of section.paragraphs) {
      writeText(para || " ", { font: fontRegular, size: FONT_SIZE_BODY });
      y -= PARAGRAPH_SPACING;
    }
    y -= 4;
  }

  // Footer
  if (y < MARGIN_BOTTOM + 30) newPage();
  page.drawText(
    `Template ${meta.judul} — Portal DTSEN Bangkalan · dibuat otomatis ${new Date().toLocaleDateString("id-ID")}`,
    {
      x: MARGIN_X,
      y: MARGIN_BOTTOM - 20,
      size: 8,
      font: fontRegular,
      color: rgb(0.55, 0.6, 0.66),
    },
  );

  return await pdf.save();
}
