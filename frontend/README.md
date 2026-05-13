# Portal DTSEN Bangkalan

Portal pengelolaan izin pemanfaatan **Data Tunggal Sosial Ekonomi Nasional (DTSEN)** di Kabupaten Bangkalan.

> Pemohon (OPD) → Verifikator (Bapperida) → E-Wali Data (Diskominfo) → Pengelola DTSEN (Dinas Sosial) → Pelaporan Pemanfaatan (30 hari).

## Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript** + **Tailwind CSS v4** + **shadcn/ui** (Radix preset Nova)
- **Supabase** (Postgres + Auth + Storage) — free tier
- **Prisma 7** (pg adapter)
- **Resend** untuk notifikasi email
- **Vercel** untuk hosting (auto-deploy dari GitHub)

## Setup lokal

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template & isi nilainya
cp .env.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, RESEND_API_KEY

# 3. Sinkronkan skema database
npx prisma db push

# 4. Seed master OPD
npx tsx prisma/seed.ts

# 5. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Struktur direktori

```
src/
  app/
    (auth)/        → halaman login, daftar, lupa password
    auth/callback/ → callback Supabase
    dashboard/     → shell dashboard untuk semua role
    page.tsx       → landing page publik
  components/      → UI (shadcn) + komponen aplikasi
  lib/
    auth/          → server actions auth & session helper
    supabase/      → client (browser, server, proxy)
    prisma.ts      → Prisma singleton
    constants.ts   → enum label & konstanta
prisma/
  schema.prisma    → model: User, Opd, Permohonan, DokumenPermohonan,
                     RiwayatPermohonan, BerkasDtsen, LaporanPemanfaatan,
                     RiwayatLaporan, LaporanReminderLog, Notifikasi
  seed.ts          → master OPD Pemkab Bangkalan
proxy.ts           → Next.js 16 "Proxy" (auth refresh & route protection)
```

## Roadmap pengembangan

| Hari | Fokus |
| ---- | ----- |
| 1 | Bootstrap: design system, auth, schema, landing, dashboard shell |
| 2–3 | Modul User & OPD, form permohonan, upload 4 PDF |
| 4–5 | State machine permohonan, audit trail, notifikasi |
| 6–7 | Modul Pelaporan + cron reminder H-7…H+30 |
| 8 | Dashboard, statistik, export, polish UI |
| 9 | UAT end-to-end, screen recording |
| 10 | Production deploy + handover |

## Dokumentasi

- **[docs/RUNBOOK.md](docs/RUNBOOK.md)** — panduan pengguna per peran (Pemohon, Verifikator, E-Wali, Pengelola DTSEN)
- **[docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md)** — panduan administrator (kelola user, OPD, monitoring, troubleshooting)
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — catatan deployment, env vars, backup, security, upgrade path

## Lisensi & kepemilikan

Dikembangkan untuk Pemerintah Kabupaten Bangkalan oleh Latsar XXIX (latsar.xxix.bkl@gmail.com).
