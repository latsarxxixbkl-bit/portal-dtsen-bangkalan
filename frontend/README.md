# Portal DTSEN Bangkalan

Portal pengelolaan izin pemanfaatan **Data Tunggal Sosial Ekonomi Nasional (DTSEN)** di Kabupaten Bangkalan.

> Pemohon (OPD) → Verifikator (Bapperida) → E-Wali Data (Diskominfo) → Pengelola DTSEN (Dinas Sosial) → Pelaporan Pemanfaatan (30 hari).

## Stack

- **Next.js 16** (App Router, React 19)
- **TypeScript** + **Tailwind CSS v4** + **shadcn/ui** + font **Arial**
- **Supabase** (Postgres + Auth + Storage) — free tier
- **Prisma 7** (pg adapter)
- **Resend** untuk notifikasi email
- **Vercel** untuk hosting + Cron (auto-deploy dari GitHub)

## Quick Start (Local Dev)

```bash
# 1. Install dependencies (butuh Node 22+)
yarn install   # atau: npm install

# 2. Copy env template & isi nilainya
cp .env.example .env.local
# Edit .env.local — isi 6 variabel: NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
# DATABASE_URL, RESEND_API_KEY, CRON_SECRET.

# 3. Setup all-in-one (db push + seed + storage buckets)
bash scripts/setup-all.sh

# 4. (Opsional) bikin 5 test accounts UAT auto-confirmed
npx tsx scripts/uat-setup.ts
# Password universal: Test12345!

# 5. Jalankan dev server
yarn dev   # http://localhost:3000
```

## Deploy ke Vercel (Production)

1. **Push code ke GitHub** (via fitur "Save to GitHub" di Emergent atau git push manual)
2. **Vercel Dashboard** → Add New Project → Import repo
3. **Settings → Environment Variables** — set semua 6 var dari `.env.example` untuk Production + Preview + Development
4. **Deploy** — Vercel auto-detect Next.js, build & deploy
5. **Supabase Dashboard → Authentication → URL Configuration**:
   - **Site URL**: `https://<your-vercel-app>.vercel.app`
   - **Redirect URLs**: `https://<your-vercel-app>.vercel.app/auth/callback`
6. **Vercel Cron** auto-aktif dari `vercel.json` (daily 01:00 UTC = 08:00 WIB → `/api/cron/laporan-reminder`)

Detail lengkap: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Struktur Direktori

```
src/
  app/
    (auth)/                       → login, daftar, lupa-password
    auth/callback/                → callback Supabase Auth
    dashboard/                    → shell dashboard semua role
      admin/{users,opd,templat}   → admin: kelola pengguna, OPD, template surat
      permohonan/{baru,[id]}      → submit & detail permohonan
      laporan/{[id],review-*}     → laporan pemanfaatan + dual review
    api/
      cron/laporan-reminder       → Vercel Cron — reminder H-7..H+30
      export/{permohonan,laporan} → CSV export
      file                        → signed URL serve (dokumen/berkas/laporan/templat)
      health                      → /api/health uptime check
    page.tsx                      → landing publik
  components/                     → UI shadcn + komponen aplikasi
  lib/
    auth/                         → server actions + session helper
    supabase/                     → client (browser, server, proxy)
    permohonan/, laporan/,        → server actions per modul
    templat/                      → CRUD template surat
    workflow/                     → state machines (permohonan, laporan, numbering)
    notifikasi/                   → in-app + email notifications
    cron/, email/, export/        → helper modules
    storage.ts, prisma.ts,        → core helpers
    constants.ts
prisma/
  schema.prisma                   → 13 model: User, Opd, Permohonan, DokumenPermohonan,
                                    RiwayatPermohonan, BerkasDtsen, TemplatSurat,
                                    LaporanPemanfaatan, RiwayatLaporan,
                                    LaporanReminderLog, Notifikasi + enums
  seed.ts                         → 49 OPD Pemkab Bangkalan + kodeOpd
scripts/
  setup-all.sh                    → all-in-one db push + seed + init storage
  init-storage.ts                 → bikin 4 Supabase Storage bucket
  promote-admin.ts                → promote user by email ke ADMIN
  uat-setup.ts                    → bikin 5 UAT test accounts (auto-confirm)
proxy.ts                          → Next.js 16 Proxy — refresh session + route guard
vercel.json                       → Vercel Cron schedule
```

## Fitur Utama

- ✅ Auth Supabase (email+password) + RBAC 5 role
- ✅ Workflow Permohonan 4-stage dengan audit trail
- ✅ Upload 4 dokumen wajib PDF (Surat Permintaan, KAK, Pakta Integritas, NDA)
- ✅ Nomor surat auto-generate: `001/PORTAL-DTSEN/{KODE_OPD}/{ROMAWI_BULAN}/{TAHUN}`
- ✅ Berkas DTSEN final upload oleh Pengelola DTSEN
- ✅ Laporan Pemanfaatan auto-create dengan deadline 30 hari
- ✅ Dual review laporan (Bapperida + Dinsos)
- ✅ **Template Surat** — admin upload, OPD download saat ajukan permohonan
- ✅ Cron reminder otomatis H-7, H-1, H+1, H+7, H+14, H+30
- ✅ Notifikasi in-app + email (Resend)
- ✅ Export CSV (UTF-8 BOM untuk Excel locale ID)
- ✅ Admin: kelola Pengguna, OPD, Template Surat

## Dokumentasi

- [`docs/RUNBOOK.md`](docs/RUNBOOK.md) — panduan pengguna per peran
- [`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md) — panduan administrator
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deployment & ops detail
- [`docs/UAT-day9.md`](docs/UAT-day9.md) — 10 test case UAT end-to-end

## Lisensi & Kepemilikan

Dikembangkan untuk Pemerintah Kabupaten Bangkalan oleh Latsar XXIX (latsar.xxix.bkl@gmail.com).
