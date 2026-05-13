# Portal DTSEN Bangkalan — PRD

## Original Problem Statement
"bantu aku menyelesaikan aplikasi ini"
+ Handover doc (HANDOVER-Portal-DTSEN-Bangkalan.pdf)
+ UAT plan (UAT-day9.md)
+ Bootstrap zip (portal-dtsen-bangkalan-devin-1778476246-day1-bootstrap.zip)
+ GitHub repo: https://github.com/latsarxxixbkl-bit/portal-dtsen-bangkalan.git (empty)

## Tujuan Aplikasi
Digitalisasi alur permohonan & pelaporan pemanfaatan Data Tunggal Sosial Ekonomi Nasional (DTSEN) untuk Pemerintah Kabupaten Bangkalan. Menggantikan proses manual berbasis kertas dengan workflow 4-stage review + laporan pemanfaatan 30 hari.

## Tech Stack (per handover)
- Next.js 16 (App Router, React 19, Turbopack)
- TypeScript + Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Auth + Storage)
- Prisma 7 (pg adapter)
- Resend (email)
- Vercel (target production hosting)
- Emergent (development preview)

## User Personas
| Peran | OPD | Hak Utama |
|---|---|---|
| PEMOHON | OPD pemohon | Submit permohonan, kirim laporan pemanfaatan |
| VERIFIKATOR | Bapperida | Review tahap-1 + setujui laporan tahap-1 |
| EWALI_DATA | Diskominfo | Review tahap-2 (validasi teknis) |
| PENGELOLA_DTSEN | Dinas Sosial | Setujui final + upload Berkas DTSEN + setujui laporan tahap-2 |
| ADMIN | Diskominfo | Kelola users + OPD + monitoring |

## Core Requirements (static)
- 4-stage workflow: Pemohon → Bapperida → Diskominfo → Dinsos → SELESAI
- 4 dokumen wajib PDF: Surat Permintaan, KAK, Pakta Integritas, NDA
- Nomor surat: `001/PORTAL-DTSEN/{KODE_OPD}/{ROMAWI_BULAN}/{TAHUN}`
- Laporan pemanfaatan auto-create dengan deadline +30 hari setelah Berkas DTSEN diserahkan
- Dual review laporan: Bapperida → Dinsos → DISETUJUI
- Reminder otomatis: H-7, H-1, H+1, H+7, H+14, H+30 (cron)
- Audit trail lengkap (RiwayatPermohonan + RiwayatLaporan)
- RBAC enforced via Next.js proxy + page guards
- Export CSV (UTF-8 BOM untuk Excel locale ID)

## What's Been Implemented (2026-05-13)
✅ Bootstrap Next.js + Prisma + Supabase + shadcn — 128 files
✅ Schema Prisma 12 model + enums lengkap
✅ State machines Permohonan + Laporan
✅ Server actions: submit permohonan, workflow transition, upload berkas, submit laporan, review laporan
✅ Auth (Supabase email+password) + RBAC proxy/middleware
✅ Module Admin (users + OPD CRUD)
✅ Cron reminder endpoint dengan Bearer token guard
✅ Export CSV permohonan & laporan
✅ Notifikasi in-app + email template (Resend)
✅ Landing page + dashboard shell
✅ Seed master 49 OPD Bangkalan **with kodeOpd** (DISDIK, DINKES, dll) — bug fix utama untuk pass UAT Test 2 nomor surat
✅ Setup script all-in-one (`scripts/setup-all.sh`)
✅ Supervisor configured untuk Next.js dev di port 3000
✅ Landing page render OK via preview URL Emergent

## What's Blocking — BUTUH USER ACTION
🔴 Credential Supabase yang Kakak share masih cuma URL (`ubolcndcnmseqlecjazx`)
🔴 **3 nilai krusial belum di-isi** di `/app/frontend/.env.local`:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (dengan password real)
🔴 Tanpa kredensial: tidak bisa `prisma db push`, tidak bisa seed, tidak bisa init Storage, semua flow runtime (login/daftar/dashboard/form) akan error
🔴 RESEND_API_KEY masih placeholder — email notifikasi gagal silent

## Prioritized Backlog (P0/P1/P2)

### P0 — BLOCKING
- [ ] **USER**: Paste 3 Supabase keys + Resend key ke `.env.local`
- [ ] **USER**: Run `bash scripts/setup-all.sh` (akan db push + seed + init storage)
- [ ] Validasi end-to-end: register → login → submit permohonan → 4-stage workflow → upload berkas → laporan → dual review → DISETUJUI
- [ ] UAT 10 test cases (lihat `/app/frontend/docs/UAT-day9.md`)

### P1 — Setelah credentials ada
- [ ] Bug fix issues yang muncul saat UAT (TBD per test result)
- [ ] Logo Pemkab Bangkalan (saat ini pakai generic gradient mark)
- [ ] Templat surat resmi (Surat Permintaan, dst) — handover doc menyebut "pending"
- [ ] SSO Pemkab integration (saat ini default email+password)
- [ ] Custom domain `.go.id`

### P2 — Polish
- [ ] Dashboard statistik (chart real data, saat ini placeholder)
- [ ] Mobile responsive audit
- [ ] Help/FAQ page

## Tech Decisions
- **Stack handover dipertahankan** (Next.js+Supabase+Prisma+Resend) per user choice — tidak diadaptasi ke Emergent native (React+FastAPI+MongoDB)
- **Storage akses** via service_role client (bypass RLS) + access control dienforce di server actions
- **State machine** hard-coded di TypeScript (bukan di DB) untuk maintainability
- **Nomor surat** sequence dihitung count+1 per (OPD, tahun) — assume single-writer; perlu lock kalau scale tinggi

## Deployment Path
- Development: Emergent preview (`yarn start` = `next dev`)
- Production: Push to GitHub → Vercel auto-deploy
- Cron: Vercel Cron daily 09:00 WIB → `/api/cron/laporan-reminder` (Bearer auth)
