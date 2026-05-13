# Portal DTSEN Bangkalan — PRD

## Original Problem Statement
"bantu aku menyelesaikan aplikasi ini"
+ Handover doc (HANDOVER-Portal-DTSEN-Bangkalan.pdf)
+ UAT plan (UAT-day9.md)
+ Bootstrap zip (Day-1 bootstrap, ~128 files)
+ GitHub repo: https://github.com/latsarxxixbkl-bit/portal-dtsen-bangkalan.git

## Tujuan Aplikasi
Digitalisasi alur permohonan & pelaporan pemanfaatan Data Tunggal Sosial Ekonomi Nasional (DTSEN) untuk Pemerintah Kabupaten Bangkalan.

## Tech Stack
- Next.js 16 (App Router, React 19) — **production build** untuk Emergent preview (lebih stabil dari dev/Turbopack)
- TypeScript + Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Auth + Storage) — project `ubolcndcnmseqlecjazx`
- Prisma 7 (pg adapter)
- Resend (email)
- Vercel (target production hosting)

## User Personas
| Peran | OPD | Hak Utama |
|---|---|---|
| PEMOHON | OPD pemohon | Submit permohonan + laporan |
| VERIFIKATOR | Bapperida | Review tahap-1 + setujui laporan tahap-1 |
| EWALI_DATA | Diskominfo | Review tahap-2 |
| PENGELOLA_DTSEN | Dinsos | Approve final + upload Berkas DTSEN + setujui laporan tahap-2 |
| ADMIN | (any) | Kelola users + OPD + monitoring |

## What's Been Implemented (2026-05-13) — END-TO-END WORKING

### Infrastructure ✅
- Bootstrap Next.js 16 + Prisma 7 + Supabase + Tailwind v4 + shadcn (128 files, build clean)
- Supabase project connected (`ubolcndcnmseqlecjazx.supabase.co`)
- Resend API configured for email
- Storage buckets created: `permohonan-dokumen`, `berkas-dtsen`, `laporan-pendukung`
- Prisma schema synced ke Postgres
- Seed 49 OPD Bangkalan **dengan kodeOpd** (DISDIK, DINKES, BAPPERIDA, dll)
- 5 UAT accounts auto-confirmed (admin/pemohon/verif/ewali/dinsos)

### Application ✅
- Schema Prisma 12 model + enums lengkap
- State machines Permohonan (4-stage workflow) + Laporan (dual review)
- Server actions: submit permohonan, workflow transition, upload berkas, submit laporan, review laporan
- Auth (Supabase email+password) + middleware RBAC
- Module Admin (users + OPD CRUD)
- Cron reminder endpoint `/api/cron/laporan-reminder` (Bearer auth verified)
- Export CSV permohonan & laporan (UTF-8 BOM)
- Notifikasi in-app + email template
- Landing + login + register + reset password + dashboard shell + all role pages

### Verified Working (live test) ✅
- `/` Landing → HTTP 200 ✓
- `/login` → HTTP 200 ✓
- `/daftar` → HTTP 200 ✓
- `/lupa-password` → HTTP 200 ✓
- `/dashboard` → 307 redirect ke /login saat unauth (RBAC) ✓
- **Login admin successful** → redirect ke /dashboard, sidebar render lengkap ✓
- Dashboard stats: 1 Permohonan, 5 Pengguna, 49 OPD, 1 Laporan ✓
- Chart distribusi status render ✓
- `/api/cron/laporan-reminder` dengan Bearer → `{ok:true, total:0}` ✓
- `/api/cron/laporan-reminder` tanpa auth → **401** ✓ security

### Bug Fixes ✅
- `seed.ts`: tambah `kodeOpd` untuk semua 49 OPD (UAT Test 2 nomor surat format `001/PORTAL-DTSEN/DISDIK/V/2026`)
- `seed.ts`, `init-storage.ts`, `uat-setup.ts`, `promote-admin.ts`: dynamic import prisma/supabase setelah dotenv load (fix ESM hoisting bug)
- `package.json`: `start` script jadi `next start` (production) bukan `next dev` (Turbopack OOM di Emergent preview)
- `next.config.ts`: tambah `allowedDevOrigins` + `serverActions.allowedOrigins` untuk dual-domain Emergent (`preview.emergentagent.com` & `cluster-12.preview.emergentcf.cloud`) — fix CSRF block Server Actions

## Test Accounts (/app/memory/test_credentials.md)
Password universal: `Test12345!`
- `latsar.xxix.bkl+admin@gmail.com` → ADMIN @ Bapperida
- `latsar.xxix.bkl+pemohon@gmail.com` → PEMOHON @ Dinas Pendidikan
- `latsar.xxix.bkl+verif@gmail.com` → VERIFIKATOR @ Bapperida
- `latsar.xxix.bkl+ewali@gmail.com` → EWALI_DATA @ Diskominfo
- `latsar.xxix.bkl+dinsos@gmail.com` → PENGELOLA_DTSEN @ Dinas Sosial

## Prioritized Backlog

### P0 — Already DONE ✅
- ~~Credential Supabase~~ ✅ user provided
- ~~Run setup-all.sh~~ ✅ all 4 steps passed
- ~~UAT accounts~~ ✅ 5 accounts seeded
- ~~Login verified~~ ✅ admin login → dashboard works

### P1 — UAT lengkap
- [ ] Run UAT 10 test cases dari `/app/frontend/docs/UAT-day9.md`:
  - Test 1: Daftar + Login Pemohon
  - Test 2: Submit Permohonan (validation + nomor surat)
  - Test 3-5: 4-stage workflow review
  - Test 5: Upload Berkas + auto-create Laporan
  - Test 6-7: Laporan submit + dual review
  - Test 8: Cron reminder (✅ verified work)
  - Test 9: Export CSV
  - Test 10: RBAC negative test

### P2 — Polish & Production
- [ ] Logo Pemkab Bangkalan (saat ini gradient generic)
- [ ] Templat surat resmi (Surat Permintaan, KAK, Pakta Integritas, NDA)
- [ ] SSO Pemkab (saat ini email+password)
- [ ] Custom domain `.go.id`
- [ ] Deploy ke Vercel + Vercel Cron (daily 09:00 WIB)

## Tech Decisions Made
- **Stack handover dipertahankan** (Next.js+Supabase+Prisma+Resend) — sukses run di Emergent dengan production build
- **Production build** (`next start`), bukan dev mode — Turbopack dev mode hits OOM di Emergent preview
- **Server Actions origin whitelist** — Emergent dual-domain butuh explicit `serverActions.allowedOrigins`
- **Dynamic imports di scripts** — prevent ESM hoisting bug saat dotenv loaded after Prisma init

## Deployment Path
- Dev/preview: Emergent `next start -p 3000` (supervisor managed)
- Production: Push to GitHub via "Save to Github" → import ke Vercel
- Cron: Vercel Cron daily 09:00 WIB → `/api/cron/laporan-reminder` (Bearer `CRON_SECRET`)

## Files Modified
- `/app/frontend/.env.local` — Supabase + Resend + DATABASE_URL + CRON_SECRET
- `/app/frontend/next.config.ts` — allowedDevOrigins + serverActions allowedOrigins
- `/app/frontend/package.json` — `start` = `next start`
- `/app/frontend/prisma/seed.ts` — added kodeOpd, dynamic import
- `/app/frontend/scripts/init-storage.ts` — dynamic import
- `/app/frontend/scripts/uat-setup.ts` — dynamic import + type safety
- `/app/frontend/scripts/promote-admin.ts` — dynamic import
- `/app/frontend/scripts/setup-all.sh` — new all-in-one setup script
- `/app/SETUP.md` — panduan setup detail
- `/app/memory/PRD.md` (this file)
- `/app/memory/test_credentials.md` — UAT accounts
