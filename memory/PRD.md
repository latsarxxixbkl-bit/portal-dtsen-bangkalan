# Portal DTSEN Bangkalan — PRD

## Tujuan
Digitalisasi alur permohonan & pelaporan pemanfaatan Data DTSEN untuk Pemkab Bangkalan.

## Tech Stack
- Next.js 16 (App Router, React 19) — production build
- TypeScript + Tailwind v4 + shadcn/ui — **font Arial**
- Supabase (Postgres + Auth + Storage) — project `ubolcndcnmseqlecjazx`
- Prisma 7 (pg adapter, no rust engine — Vercel-friendly)
- Resend (email)
- Vercel (target hosting + Cron)

## What's Been Implemented (Final — 2026-05-13)

### Infrastructure ✅
- Bootstrap Next.js 16 + Prisma 7 + Supabase + Tailwind v4 + shadcn (build clean, 22 routes)
- Supabase connected + DB schema synced + 49 OPD seeded dengan kodeOpd
- 4 Storage buckets created (`permohonan-dokumen`, `berkas-dtsen`, `laporan-pendukung`, `templat-surat`)
- 5 UAT accounts auto-confirmed (password `Test12345!`)
- vercel.json with cron schedule (daily 01:00 UTC = 08:00 WIB)
- /api/health endpoint untuk uptime monitor
- ESLint clean (0 errors)

### Modules ✅
- Schema Prisma 13 model + 7 enums (+TemplatSurat baru)
- State machines: Permohonan 4-stage + Laporan dual review
- Server actions: submit permohonan, workflow, upload berkas, submit/review laporan, **template CRUD**
- Auth Supabase + middleware RBAC
- Module Admin: kelola Users + OPD + **Template Surat (baru)**
- **Template Surat**: admin upload (PDF/DOCX/DOC/ODT max 20MB), OPD download di form permohonan baru
- Cron reminder dengan dual auth (Bearer `CRON_SECRET` ATAU `x-vercel-cron: 1`)
- Export CSV (UTF-8 BOM)
- Notifikasi in-app + email (Resend)

### UX Improvements ✅
- Form permohonan baru: tombol "Unduh Template" muncul di samping setiap field upload dokumen
- Laporan list empty state: penjelasan jelas bahwa laporan auto-create 30 hari setelah Berkas DTSEN diserahkan + link ke status permohonan
- Font **Arial** global (sebelumnya Geist)
- All interactive elements ber-`data-testid`

### Verified Working (Live Test) ✅
- `/` Landing → 200
- `/login` → 200
- `/daftar` → 200
- `/api/health` → `{ok:true, app:"Portal DTSEN Bangkalan", ts:"..."}`
- `/api/cron/laporan-reminder` (Bearer auth) → `{ok:true, total:0}` 
- `/api/cron/laporan-reminder` (no auth) → 401 security
- **Admin login → /dashboard render dengan stats + sidebar lengkap**
- **/dashboard/admin/templat render dengan 4 cards** (Surat Permintaan, KAK, Pakta Integritas, NDA)
- **Font Arial confirmed** via `getComputedStyle(body).fontFamily`

## Bug Fixes & Architectural Decisions

| Issue | Resolution |
|---|---|
| OPD nomor surat tanpa kodeOpd | Added kodeOpd untuk 49 OPD di seed.ts (DISDIK, DINKES, BAPPERIDA, dll) |
| ESM hoisting: prisma init sebelum dotenv | Dynamic import prisma/supabase di scripts setelah loadEnv |
| Next.js dev Turbopack OOM di Emergent | Switch ke `next start` (production build) |
| Server Actions CSRF block (Emergent dual-domain) | `serverActions.allowedOrigins` di next.config.ts |
| Templat surat butuh multi-format | Bucket `templat-surat` dengan PDF/DOCX/DOC/ODT mime |
| Font Geist → Arial | Remove Geist imports, set `--font-sans: Arial` di globals.css |

## Test Credentials
`/app/memory/test_credentials.md` — 5 akun universal password `Test12345!`

## Vercel Deployment Path
1. Push ke GitHub (`https://github.com/latsarxxixbkl-bit/portal-dtsen-bangkalan.git`) — via fitur "Save to Github" di Emergent
2. Vercel Dashboard → Import → set 6 env vars (lihat `.env.example`)
3. Deploy — Next.js auto-detected
4. Supabase Auth → URL Configuration → set Site URL = vercel app URL
5. Vercel Cron auto-aktif dari `vercel.json`

## Backlog

### P1 — Operasional
- [ ] Upload template surat asli (Surat Permintaan, KAK, Pakta Integritas, NDA) via admin UI
- [ ] Run UAT 10 test cases dari docs/UAT-day9.md
- [ ] Custom domain `.bangkalanab.go.id`
- [ ] Verify domain di Resend untuk email FROM `noreply@bangkalanab.go.id`

### P2 — Polish
- [ ] Logo Pemkab Bangkalan
- [ ] SSO Pemkab integration
- [ ] Public transparency dashboard (tanpa login) `/transparansi`
- [ ] Mobile responsive audit

## Files Modified This Session
- `/app/frontend/.env.local` — credentials configured
- `/app/frontend/.env.example` — production template
- `/app/frontend/next.config.ts` — allowedDevOrigins + serverActions.allowedOrigins (Emergent + Vercel compat)
- `/app/frontend/package.json` — `start` = `next start` (production)
- `/app/frontend/vercel.json` — cron `0 1 * * *`
- `/app/frontend/README.md` — quick start + Vercel deploy guide
- `/app/frontend/src/app/layout.tsx` — remove Geist, no font imports
- `/app/frontend/src/app/globals.css` — `--font-sans: Arial`
- `/app/frontend/src/app/api/health/route.ts` — new health check
- `/app/frontend/src/app/api/file/route.ts` — added type=templat handler
- `/app/frontend/src/app/dashboard/admin/templat/` — new page + dialog + delete (3 files)
- `/app/frontend/src/app/dashboard/laporan/page.tsx` — improved empty state
- `/app/frontend/src/app/dashboard/permohonan/baru/form.tsx` — download template buttons
- `/app/frontend/src/app/dashboard/permohonan/baru/page.tsx` — pass templatMap
- `/app/frontend/src/components/dashboard/nav-config.ts` — Template Surat menu (ADMIN)
- `/app/frontend/src/lib/storage.ts` — added TEMPLAT_SURAT bucket + multi-mime support
- `/app/frontend/src/lib/templat/{actions,queries}.ts` — new module
- `/app/frontend/prisma/schema.prisma` — TemplatSurat model + User.templatUploaded relation
- `/app/frontend/prisma/seed.ts` — kodeOpd untuk 49 OPD, dynamic import
- `/app/frontend/scripts/{init-storage,uat-setup,promote-admin}.ts` — dynamic import fix
- `/app/frontend/scripts/setup-all.sh` — new all-in-one setup
- `/app/SETUP.md` — Emergent setup guide
- `/app/memory/test_credentials.md` — UAT accounts
- `/app/memory/PRD.md` (this file)
