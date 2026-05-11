import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Files,
  GaugeCircle,
  LineChart,
  Lock,
  ShieldCheck,
  Timer,
  Workflow,
} from "lucide-react";

import { BrandLockup, BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, DOKUMEN_WAJIB, ROLES } from "@/lib/constants";

const FEATURES = [
  {
    icon: Workflow,
    title: "Alur Persetujuan Multi-Tahap",
    desc: "Pemohon → Bapperida → Diskominfo → Dinas Sosial. Setiap tahap tercatat dengan jejak audit lengkap.",
  },
  {
    icon: Files,
    title: "Empat Dokumen Wajib",
    desc: "Surat Permintaan, KAK, Pakta Integritas, dan NDA terkumpul dalam satu permohonan terstruktur.",
  },
  {
    icon: Timer,
    title: "Pelaporan 30 Hari",
    desc: "Pemohon wajib mengirim laporan pemanfaatan data dalam 30 hari. Reminder otomatis H-7 sampai H+30.",
  },
  {
    icon: ShieldCheck,
    title: "Keamanan Data DTSEN",
    desc: "Berkas privat, signed URL berdurasi pendek, audit log per aksi, role-based access control.",
  },
  {
    icon: LineChart,
    title: "Dashboard Akuntabilitas",
    desc: "Statistik permohonan, kepatuhan pelaporan, dan performa SLA per perangkat daerah.",
  },
  {
    icon: GaugeCircle,
    title: "Notifikasi Real-Time",
    desc: "Pemberitahuan email & in-app saat permohonan berpindah tahap atau membutuhkan tindakan.",
  },
];

const ALUR = [
  {
    no: "1",
    aktor: "Pemohon (OPD)",
    aksi: "Mengisi form permohonan dan mengunggah 4 dokumen wajib (PDF).",
  },
  {
    no: "2",
    aktor: "Verifikator (Bapperida)",
    aksi: "Memeriksa kelengkapan administratif dan urgensi kebutuhan data.",
  },
  {
    no: "3",
    aktor: "E-Wali Data (Diskominfo)",
    aksi: "Validasi teknis dan kelayakan akses Data DTSEN.",
  },
  {
    no: "4",
    aktor: "Pengelola DTSEN (Dinsos)",
    aksi: "Persetujuan akhir dan penyerahan Berkas Data DTSEN.",
  },
  {
    no: "5",
    aktor: "Pemohon (OPD)",
    aksi: "Mengirim Laporan Pemanfaatan Data dalam 30 hari ke depan.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      {/* Background ornaments */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-primary/8 via-background to-background" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label={APP_NAME}>
            <BrandLockup />
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#fitur" className="text-muted-foreground transition-colors hover:text-foreground">
              Fitur
            </a>
            <a href="#alur" className="text-muted-foreground transition-colors hover:text-foreground">
              Alur
            </a>
            <a href="#dokumen" className="text-muted-foreground transition-colors hover:text-foreground">
              Dokumen Wajib
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/daftar">
                Daftar <ArrowRight className="ms-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-5 gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-[11px] uppercase tracking-wider text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> Pemerintah Kabupaten Bangkalan
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Portal pengelolaan izin pemanfaatan <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">Data DTSEN</span> Bangkalan
          </h1>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            Satu portal untuk perangkat daerah mengajukan akses Data Tunggal Sosial Ekonomi Nasional —
            terdokumentasi, akuntabel, dan ramah seluler.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-6">
              <Link href="/daftar">
                Mulai Sekarang <ArrowRight className="ms-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-6">
              <Link href="/login">Masuk ke Portal</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" /> 4 dokumen wajib</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" /> Audit trail otomatis</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" /> Reminder pelaporan</span>
          </div>
        </div>

        {/* Hero illustration / preview card */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl border bg-card/60 p-2 shadow-2xl shadow-primary/10 ring-1 ring-border/60 backdrop-blur">
            <div className="rounded-xl border bg-background/80 p-6 sm:p-10">
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  { icon: FileCheck2, label: "Permohonan Aktif", value: "—", caption: "Dalam alur persetujuan" },
                  { icon: Timer, label: "Rata-rata SLA", value: "—", caption: "Dari pengajuan ke selesai" },
                  { icon: Lock, label: "Kepatuhan Laporan", value: "—", caption: "Pelaporan tepat waktu" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border bg-card p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <item.icon className="size-4" />
                      {item.label}
                    </div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.caption}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-sm text-muted-foreground">
                Pratinjau dashboard akan menampilkan ringkasan kinerja persetujuan & pelaporan setelah Kak masuk.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Dirancang untuk akuntabilitas birokrasi</h2>
          <p className="mt-3 text-muted-foreground">
            Setiap fitur dibangun mengikuti SOP pengelolaan data sensitif di lingkungan pemerintah daerah.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5">
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg border bg-primary/5 text-primary">
                  <f.icon className="size-5" />
                </div>
                <CardTitle className="mt-3 text-lg">{f.title}</CardTitle>
                <CardDescription>{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="alur" className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Alur permohonan dalam 5 langkah</h2>
          <p className="mt-3 text-muted-foreground">
            Mulai dari pengajuan hingga pelaporan pemanfaatan — semuanya dalam satu portal.
          </p>
        </div>
        <div className="relative grid gap-4 md:grid-cols-5">
          {ALUR.map((step, i) => (
            <div key={step.no} className="relative rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {step.no}
                </div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Tahap {i + 1}</span>
              </div>
              <div className="mt-3 text-sm font-semibold">{step.aktor}</div>
              <div className="mt-1 text-sm text-muted-foreground">{step.aksi}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Required documents */}
      <section id="dokumen" className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Empat dokumen wajib</h2>
          <p className="mt-3 text-muted-foreground">
            Lengkapi keempat dokumen ini sebelum mengajukan permohonan Data DTSEN.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {DOKUMEN_WAJIB.map((d) => (
            <div key={d.id} className="flex gap-4 rounded-xl border bg-card p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-secondary text-secondary-foreground">
                <Files className="size-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{d.nama}</div>
                <div className="mt-1 text-sm text-muted-foreground">{d.deskripsi}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role roster */}
      <section className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Lima peran yang saling melengkapi</h2>
          <p className="mt-3 text-muted-foreground">Setiap peran punya wewenang spesifik untuk menjaga prinsip pemisahan tugas.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(ROLES) as Array<keyof typeof ROLES>).map((r) => (
            <div key={r} className="rounded-xl border bg-card p-5 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <div className="mt-3 text-sm font-semibold">{ROLES[r]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-secondary/30 py-10">
        <div className="container mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="size-7" />
            <div>
              <div className="text-sm font-semibold">{APP_NAME}</div>
              <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} Pemerintah Kabupaten Bangkalan</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span>Bapperida</span>
            <span>·</span>
            <span>Diskominfo</span>
            <span>·</span>
            <span>Dinas Sosial</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
