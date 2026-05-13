# HANDOVER — Portal DTSEN Bangkalan

**Tanggal**: 13 Mei 2026
**Status**: MVP lengkap, terverifikasi end-to-end, siap deploy ke Vercel
**Repo GitHub**: https://github.com/latsarxxixbkl-bit/portal-dtsen-bangkalan
**Preview Live (Emergent)**: https://3af38edc-cee1-436f-8ec3-13f7f0086c70.preview.emergentagent.com/

---

## 1. Konteks & Tujuan

Portal DTSEN Bangkalan adalah aplikasi web internal Pemerintah Kabupaten Bangkalan untuk **mendigitalkan alur izin pemanfaatan Data Tunggal Sosial Ekonomi Nasional (DTSEN)**.

Sebelumnya, OPD yang butuh data DTSEN harus:
1. Buat surat fisik (Surat Permintaan, KAK, Pakta Integritas, NDA)
2. Antar ke Bapperida → Diskominfo → Dinas Sosial (manual, antrian fisik)
3. Tidak ada tracking status, tidak ada SLA, tidak ada audit trail
4. Pelaporan pemanfaatan data sering terlewat / lupa

Portal ini menggantikan dengan:
- Online form + upload PDF
- 4-stage workflow tracking otomatis dengan audit trail
- Berkas DTSEN diserahkan via Supabase Storage (signed URL, encrypted)
- Pelaporan pemanfaatan otomatis +30 hari dengan reminder H-7 sampai H+30
- Dashboard akuntabilitas per OPD
- Notifikasi email + in-app

**Aktor utama**: ~50 OPD pemohon, Bapperida (verifikator), Diskominfo (e-wali data), Dinsos (pengelola DTSEN final).

---

## 2. Tech Stack

| Lapisan | Teknologi | Versi | Catatan |
|---|---|---|---|
| Frontend Framework | Next.js | 16 (App Router) | React 19, Server Actions |
| Bahasa | TypeScript | 5+ | Strict mode |
| Styling | Tailwind CSS | v4 | `@theme inline` di globals.css |
| UI Library | shadcn/ui | latest | + lucide-react icons |
| Font | **Arial** | system | Sengaja dipilih simple & familiar untuk birokrasi |
| Database | PostgreSQL | 16 (via Supabase) | Region `ap-northeast-1` |
| ORM | Prisma | 7 | Pakai pg adapter (bukan rust engine — Vercel-friendly) |
| Auth | Supabase Auth | latest | Email+password (SSR) |
| Storage | Supabase Storage | latest | 4 bucket privat |
| Email | Resend | latest | Free tier 3k/bulan |
| Hosting (target) | Vercel | Hobby | Free, auto-deploy dari GitHub |
| Cron | Vercel Cron | - | `0 1 * * *` (08:00 WIB daily) |
| Source Control | GitHub | - | Public repo |

**Stack ini sengaja dipilih supaya BIAYA Rp 0** untuk pilot. Detail upgrade path ke berbayar di `docs/DEPLOYMENT.md`.

---

## 3. Struktur Folder

Repo GitHub menggunakan **subfolder `frontend/`** sebagai root Next.js app. **Vercel Root Directory harus diset = `frontend`**.

```
portal-dtsen-bangkalan/                  ← repo root (di /app di Emergent)
├── frontend/                            ← Next.js app — set sebagai Vercel Root Directory
│   ├── public/
│   │   └── logo-bapperida.png           ← Logo Bapperida SMART (1.9 MB PNG)
│   ├── prisma/
│   │   ├── schema.prisma                ← 13 model + 7 enum
│   │   └── seed.ts                      ← 49 OPD Bangkalan + kodeOpd
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── daftar/page.tsx
│   │   │   │   └── lupa-password/page.tsx
│   │   │   ├── auth/callback/route.ts   ← Supabase Auth callback
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx           ← shell + RBAC sidebar + FAB WA
│   │   │   │   ├── page.tsx             ← stats dashboard
│   │   │   │   ├── admin/
│   │   │   │   │   ├── users/           ← kelola pengguna (Supabase Admin API)
│   │   │   │   │   ├── opd/             ← kelola OPD + kodeOpd
│   │   │   │   │   └── templat/         ← upload/kelola template surat (BARU)
│   │   │   │   ├── permohonan/
│   │   │   │   │   ├── page.tsx         ← list permohonan
│   │   │   │   │   ├── [id]/            ← detail + workflow action
│   │   │   │   │   └── baru/            ← form pengajuan (+ download template)
│   │   │   │   ├── laporan/
│   │   │   │   │   ├── page.tsx         ← list laporan
│   │   │   │   │   ├── [id]/            ← form laporan + dual review
│   │   │   │   │   ├── review-bapperida/
│   │   │   │   │   └── review-dinsos/
│   │   │   │   ├── notifikasi/
│   │   │   │   └── profil/
│   │   │   ├── api/
│   │   │   │   ├── cron/laporan-reminder/    ← Vercel Cron endpoint
│   │   │   │   ├── export/permohonan/        ← CSV export
│   │   │   │   ├── export/laporan/           ← CSV export
│   │   │   │   ├── file/                     ← Signed URL serve (dokumen/berkas/laporan/templat)
│   │   │   │   └── health/                   ← Uptime check
│   │   │   ├── layout.tsx               ← Root layout (font Arial, ThemeProvider, Toaster)
│   │   │   ├── globals.css              ← Tailwind v4 + font-sans: Arial
│   │   │   └── page.tsx                 ← Landing page publik
│   │   ├── components/
│   │   │   ├── ui/                      ← shadcn primitives
│   │   │   ├── dashboard/
│   │   │   │   ├── sidebar.tsx          ← navigation per role
│   │   │   │   ├── topbar.tsx
│   │   │   │   └── nav-config.ts        ← menu definitions per role
│   │   │   ├── brand.tsx                ← Logo + lockup pakai Next Image
│   │   │   ├── tanya-bapperida-fab.tsx  ← Floating WA button (BARU)
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── lib/
│   │   │   ├── auth/                    ← session helper + requireRole
│   │   │   ├── supabase/                ← client (browser/server/proxy)
│   │   │   ├── permohonan/actions.ts    ← submit, workflow, upload
│   │   │   ├── laporan/actions.ts       ← submit laporan, review
│   │   │   ├── templat/                 ← CRUD template surat (BARU)
│   │   │   │   ├── actions.ts
│   │   │   │   └── queries.ts
│   │   │   ├── workflow/
│   │   │   │   ├── permohonan.ts        ← state machine 4-stage
│   │   │   │   ├── laporan.ts           ← state machine dual review
│   │   │   │   └── numbering.ts         ← Nomor surat auto-generate
│   │   │   ├── notifikasi/
│   │   │   │   ├── service.ts           ← create notifikasi + email
│   │   │   │   └── actions.ts
│   │   │   ├── cron/laporan-reminder.ts ← Cron logic
│   │   │   ├── email/                   ← Resend templates
│   │   │   ├── export/                  ← CSV builder (UTF-8 BOM)
│   │   │   ├── storage.ts               ← Supabase Storage helpers
│   │   │   ├── prisma.ts                ← Prisma Client singleton
│   │   │   └── constants.ts
│   │   └── generated/prisma/            ← Prisma Client output (gitignored)
│   ├── scripts/
│   │   ├── setup-all.sh                 ← All-in-one setup (db push + seed + storage)
│   │   ├── init-storage.ts              ← Bikin 4 Storage bucket
│   │   ├── promote-admin.ts             ← Promote user → ADMIN by email
│   │   └── uat-setup.ts                 ← Bikin 5 test accounts auto-confirm
│   ├── docs/
│   │   ├── ADMIN-GUIDE.md
│   │   ├── DEPLOYMENT.md                ← Vercel + Supabase + Resend ops
│   │   ├── RUNBOOK.md                   ← Panduan pengguna per role
│   │   └── UAT-day9.md                  ← 10 UAT test cases
│   ├── proxy.ts                         ← Next.js 16 Proxy (auth refresh + route guard)
│   ├── next.config.ts                   ← allowedDevOrigins + serverActions allowed origins
│   ├── vercel.json                      ← Cron schedule `0 1 * * *`
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── prisma.config.ts                 ← Prisma 7 config (loads .env.local)
│   ├── .env.example                     ← Template env vars
│   ├── .gitignore                       ← excludes .env*, node_modules, .next
│   └── README.md                        ← Quick start
├── backend/                             ← Default FastAPI (TIDAK TERPAKAI — bisa di-delete)
├── memory/
│   ├── PRD.md                           ← Product requirements + history
│   ├── HANDOVER.md                      ← (file ini)
│   └── test_credentials.md              ← Akun UAT
├── SETUP.md                             ← Panduan setup Emergent
└── README.md
```

---

## 4. Database Schema (Prisma)

13 model di schema `public`:

```prisma
// schema.prisma — lokasi: frontend/prisma/schema.prisma

enum Role {
  PEMOHON
  VERIFIKATOR        // Bapperida
  EWALI_DATA         // Diskominfo
  PENGELOLA_DTSEN    // Dinsos
  ADMIN
}

enum StatusPermohonan {
  DRAFT
  DIAJUKAN
  VERIFIKASI_BAPPERIDA
  DITOLAK_BAPPERIDA
  PERLU_REVISI_BAPPERIDA
  VALIDASI_DISKOMINFO
  DITOLAK_DISKOMINFO
  PERLU_REVISI_DISKOMINFO
  PERSETUJUAN_DINSOS
  DITOLAK_DINSOS
  PERLU_REVISI_DINSOS
  DISETUJUI
  BERKAS_DISERAHKAN  // trigger auto-create LaporanPemanfaatan +30 hari
  SELESAI
  DIBATALKAN
}

enum StatusLaporan {
  BELUM_DIKIRIM
  MENUNGGAK          // lewat deadline
  DIKIRIM
  PERLU_REVISI
  TERVERIFIKASI_BAPPERIDA
  DITOLAK_BAPPERIDA
  DISETUJUI          // final (dual review lulus)
  DITOLAK_DINSOS
}

enum JenisOpd {
  DINAS, BADAN, KANTOR, KECAMATAN, KELURAHAN, RSUD, SEKRETARIAT, LAINNYA
}

enum JenisDokumen {
  SURAT_PERMINTAAN, KAK, PAKTA_INTEGRITAS, NDA
}

enum NotifikasiTipe {
  PERMOHONAN_SUBMIT, PERMOHONAN_REVISI, PERMOHONAN_DISETUJUI,
  PERMOHONAN_DITOLAK, BERKAS_DISERAHKAN, LAPORAN_REMINDER,
  LAPORAN_SUBMIT, LAPORAN_REVIEW, LAPORAN_DISETUJUI, LAPORAN_DITOLAK
}

model User {
  id            String   @id @default(uuid()) @db.Uuid
  authUserId    String   @unique @db.Uuid          // sync ke Supabase Auth user
  email         String   @unique
  nama          String
  role          Role
  opdId         String?  @db.Uuid
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  opd           Opd?     @relation(fields: [opdId], references: [id])
  // ... relations to permohonan, laporan, notifikasi, riwayat, templat
}

model Opd {
  id          String   @id @default(uuid()) @db.Uuid
  nama        String
  jenis       JenisOpd
  kodeOpd     String?  // e.g. "DISDIK", "BAPPERIDA" — untuk nomor surat
  isInternal  Boolean  @default(false)
  // relations
}

model Permohonan {
  id              String   @id @default(uuid()) @db.Uuid
  nomorSurat      String?  @unique             // auto-gen: 001/PORTAL-DTSEN/DISDIK/V/2026
  judul           String
  tujuanPenggunaan String
  jenisDataDiminta String
  periodeAwal     DateTime?
  periodeAkhir    DateTime?
  status          StatusPermohonan @default(DRAFT)
  pemohonId       String   @db.Uuid
  opdPemohonId    String   @db.Uuid
  catatan*        String?    // per tahap (catatanVerifikator, catatanEWali, catatanDinsos)
  diajukanAt      DateTime?
  selesaiAt       DateTime?
  dokumen         DokumenPermohonan[]
  riwayat         RiwayatPermohonan[]
  berkas          BerkasDtsen?       // 1-to-1 setelah DISETUJUI
  laporan         LaporanPemanfaatan? // 1-to-1 setelah BERKAS_DISERAHKAN
}

model DokumenPermohonan {
  id           String       @id @default(uuid()) @db.Uuid
  permohonanId String       @db.Uuid
  jenisDokumen JenisDokumen
  filePath     String       // storage path in 'permohonan-dokumen' bucket
  fileName     String
  fileSize     Int
  uploadedAt   DateTime     @default(now())
  @@unique([permohonanId, jenisDokumen])  // 1 dokumen per jenis per permohonan
}

model BerkasDtsen {
  id            String   @id @default(uuid()) @db.Uuid
  permohonanId  String   @unique @db.Uuid
  filePath      String   // bucket 'berkas-dtsen'
  fileName      String
  fileSize      Int
  uploadedById  String   @db.Uuid
  diserahkanAt  DateTime @default(now())
}

model LaporanPemanfaatan {
  id                  String        @id @default(uuid()) @db.Uuid
  permohonanId        String        @unique @db.Uuid
  status              StatusLaporan @default(BELUM_DIKIRIM)
  deadline            DateTime      // = berkasDiserahkanAt + 30 hari
  ringkasanKegiatan   String?
  outputDihasilkan    String?
  manfaat             String?
  kendala             String?
  filePendukungPath   String?       // bucket 'laporan-pendukung'
  filePendukungName   String?
  dikirimAt           DateTime?
  verifikatorBapperidaId String?    @db.Uuid
  verifikasiBapperidaAt  DateTime?
  catatanBapperida    String?
  reviewerDinsosId    String?       @db.Uuid
  reviewDinsosAt      DateTime?
  catatanDinsos       String?
  riwayat             RiwayatLaporan[]
  reminders           LaporanReminderLog[]
}

model RiwayatPermohonan / RiwayatLaporan {
  // audit trail per transisi status, dengan aktorId, dari, ke, catatan, timestamp
}

model LaporanReminderLog {
  // log reminder yang sudah dikirim per laporan, supaya tidak dobel
  // tipe: "H-7", "H-1", "H+1", "H+7", "H+14", "H+30"
}

model Notifikasi {
  id        String         @id @default(uuid()) @db.Uuid
  userId    String         @db.Uuid
  tipe      NotifikasiTipe
  judul     String
  pesan     String
  linkUrl   String?
  emailDikirim Boolean     @default(false)
  dibacaAt  DateTime?
  createdAt DateTime       @default(now())
}

model TemplatSurat {                        // BARU (added this session)
  id            String       @id @default(uuid()) @db.Uuid
  jenisDokumen  JenisDokumen @unique         // 1 jenis = 1 template aktif
  nama          String
  deskripsi     String?
  filePath      String      // bucket 'templat-surat'
  fileName      String
  mimeType      String      // PDF/DOCX/DOC/ODT
  sizeBytes     Int
  uploadedById  String      @db.Uuid
  uploadedAt    DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  uploadedBy    User        @relation("TemplatUploaderRel", fields: [uploadedById], references: [id])
}
```

**Total**: 13 model. Migration via `npx prisma db push` (schema-first development, tidak pakai migration files karena pilot stage).

---

## 5. State Machines

### 5.1 Permohonan Workflow (4-stage)

```
DRAFT
  └─ submit → DIAJUKAN → VERIFIKASI_BAPPERIDA
                                ├─ approve  → VALIDASI_DISKOMINFO
                                │                   ├─ approve → PERSETUJUAN_DINSOS
                                │                   │                  ├─ approve → DISETUJUI
                                │                   │                  │              └─ uploadBerkas → BERKAS_DISERAHKAN
                                │                   │                  │                                  └─ auto-create LaporanPemanfaatan dengan deadline +30 hari
                                │                   │                  │                                      └─ pemohon submit & dual review → SELESAI
                                │                   │                  ├─ revisi → PERLU_REVISI_DINSOS → (pemohon revisi & resubmit) → PERSETUJUAN_DINSOS
                                │                   │                  └─ tolak → DITOLAK_DINSOS
                                │                   ├─ revisi → PERLU_REVISI_DISKOMINFO
                                │                   └─ tolak → DITOLAK_DISKOMINFO
                                ├─ revisi → PERLU_REVISI_BAPPERIDA
                                └─ tolak → DITOLAK_BAPPERIDA
```

Source: `frontend/src/lib/workflow/permohonan.ts` — function `allowedTransitions(status, role)` return valid next states + UI labels.

### 5.2 Laporan Workflow (dual review)

```
BELUM_DIKIRIM (auto-created saat permohonan jadi BERKAS_DISERAHKAN)
   ├─ pemohon submit → DIKIRIM
   │                       └─ verifikator Bapperida review:
   │                            ├─ approve → TERVERIFIKASI_BAPPERIDA
   │                            │              └─ reviewer Dinsos review:
   │                            │                   ├─ approve → DISETUJUI ✓ (final, permohonan jadi SELESAI)
   │                            │                   └─ tolak → DITOLAK_DINSOS
   │                            ├─ revisi → PERLU_REVISI
   │                            │              └─ pemohon revisi → DIKIRIM (loop)
   │                            └─ tolak → DITOLAK_BAPPERIDA
   └─ deadline lewat → MENUNGGAK (di-mark via cron)
```

Source: `frontend/src/lib/workflow/laporan.ts`

### 5.3 Reminder Cron

Setiap hari pukul 08:00 WIB (01:00 UTC), endpoint `/api/cron/laporan-reminder` di-trigger Vercel Cron:

1. Query semua `LaporanPemanfaatan` dengan status `BELUM_DIKIRIM` atau `PERLU_REVISI`
2. Untuk masing-masing, cek `deadline` vs `now()`:
   - **H-7** (7 hari sebelum deadline) → kirim email + notifikasi in-app
   - **H-1** → kirim email + notifikasi
   - **H+1** (sehari setelah deadline, mark MENUNGGAK)
   - **H+7**, **H+14**, **H+30** → escalation reminder + tembusan ke atasan
3. Setiap reminder di-log di `LaporanReminderLog` supaya tidak kirim 2x untuk fase yang sama

Source: `frontend/src/lib/cron/laporan-reminder.ts`

---

## 6. Routing & Halaman

22 routes (per `next build`):

| Route | Tipe | RBAC | Fungsi |
|---|---|---|---|
| `/` | Static | Public | Landing page + FAB Tanya Bapperida |
| `/login` | Static | Public | Login form |
| `/daftar` | Static | Public | Registrasi (auto-create user di Prisma + Supabase) |
| `/lupa-password` | Static | Public | Reset password via Supabase Auth |
| `/auth/callback` | Dynamic | - | Supabase Auth OAuth/email callback |
| `/dashboard` | Dynamic | All logged | Stats + ringkasan |
| `/dashboard/profil` | Dynamic | All logged | Edit profile, ubah password |
| `/dashboard/notifikasi` | Dynamic | All logged | List notifikasi in-app |
| `/dashboard/permohonan` | Dynamic | PEMOHON: own, ADMIN/others: all | List permohonan |
| `/dashboard/permohonan/baru` | Dynamic | PEMOHON | Form + upload + download template |
| `/dashboard/permohonan/[id]` | Dynamic | RBAC by role | Detail + action buttons workflow |
| `/dashboard/laporan` | Dynamic | RBAC | List laporan |
| `/dashboard/laporan/[id]` | Dynamic | RBAC | Form laporan (jika status memungkinkan) |
| `/dashboard/laporan/review-bapperida` | Dynamic | VERIFIKATOR/ADMIN | Antrian review tahap-1 |
| `/dashboard/laporan/review-dinsos` | Dynamic | PENGELOLA_DTSEN/ADMIN | Antrian review tahap-2 |
| `/dashboard/admin/users` | Dynamic | ADMIN | CRUD + invite via Supabase Admin API |
| `/dashboard/admin/opd` | Dynamic | ADMIN | CRUD OPD + kodeOpd |
| `/dashboard/admin/templat` | Dynamic | ADMIN | Upload/replace/delete 4 template surat |
| `/api/cron/laporan-reminder` | Dynamic | Bearer / x-vercel-cron | Cron endpoint |
| `/api/export/permohonan` | Dynamic | ADMIN | CSV export (UTF-8 BOM) |
| `/api/export/laporan` | Dynamic | ADMIN | CSV export |
| `/api/file` | Dynamic | RBAC | Signed URL serve (5 min TTL) untuk dokumen/berkas/laporan/templat |
| `/api/health` | Dynamic | Public | `{ ok: true, app, ts }` |

**RBAC enforcement**: di Next.js Proxy (`frontend/proxy.ts`) untuk route guard + di server actions (`requireRole(['ADMIN'])`).

---

## 7. Storage Buckets (Supabase)

4 bucket privat. Akses via signed URL (5 menit TTL).

| Bucket | Format | Size Limit | Akses |
|---|---|---|---|
| `permohonan-dokumen` | PDF only | 10 MB | Pemohon upload, role lain read |
| `berkas-dtsen` | PDF only | 10 MB | Dinsos upload, pemohon read |
| `laporan-pendukung` | PDF only | 10 MB | Pemohon upload, reviewer read |
| `templat-surat` | PDF/DOCX/DOC/ODT | 20 MB | Admin upload, semua role read |

Path convention: `<jenis>/<timestamp>-<uuid>-<sanitized-filename>.<ext>`

Init via: `npx tsx scripts/init-storage.ts` (idempotent).

---

## 8. Environment Variables

File `.env.example` (template) dan `.env.local` (actual, gitignored):

```bash
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=https://ubolcndcnmseqlecjazx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# === Database (Prisma) ===
# Session pooler port 5432, password URL-encoded (@ → %40)
DATABASE_URL=postgresql://postgres.ubolcndcnmseqlecjazx:Bangkalan%4012345@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres

# === Email (Resend) ===
RESEND_API_KEY=re_gPGstwm4_QASarovJPHLonTEG6uyVSpbX
RESEND_FROM_EMAIL=onboarding@resend.dev

# === App ===
NEXT_PUBLIC_APP_NAME=Portal DTSEN Bangkalan
NEXT_PUBLIC_APP_URL=http://localhost:3000

# === FAB WhatsApp ===
# Format internasional tanpa "+", ganti dengan nomor real Bapperida
NEXT_PUBLIC_BAPPERIDA_WA=6285XXXXXXXXX

# === Cron ===
CRON_SECRET=dtsen-bangkalan-cron-secret-2026
```

**Untuk Vercel production**: set semua 8 var di Dashboard → Settings → Environment Variables (Production + Preview + Development).

---

## 9. Setup Lokal (Quick Start)

```bash
# 1. Clone
git clone https://github.com/latsarxxixbkl-bit/portal-dtsen-bangkalan.git
cd portal-dtsen-bangkalan/frontend       # Next.js app di subfolder

# 2. Install (butuh Node 22+, gunakan nvm/n)
yarn install                              # atau: npm install

# 3. Copy env & isi
cp .env.example .env.local
# Edit .env.local — paste 8 variable di atas dengan nilai real

# 4. Setup all-in-one (db push + generate + seed + storage)
bash scripts/setup-all.sh

# 5. (Opsional) bikin 5 UAT test accounts dengan auto-confirm email
npx tsx scripts/uat-setup.ts
# Password universal: Test12345!

# 6. Run dev
yarn dev                                  # http://localhost:3000

# 7. Build production
yarn build && yarn start                  # untuk test production build
```

---

## 10. Deploy ke Vercel (Production)

### 10.1 Persiapan
1. Punya akun GitHub + Vercel + Supabase + Resend
2. Repo sudah di-push ke GitHub: `latsarxxixbkl-bit/portal-dtsen-bangkalan`
3. Supabase project sudah dibuat (region SE Asia / Singapore disarankan untuk Bangkalan)

### 10.2 Langkah Deploy

1. Login Vercel pakai akun GitHub
2. **Add New → Project** → import repo `portal-dtsen-bangkalan`
3. **Configure Project**:
   - **Root Directory**: `frontend` ← **WAJIB, jangan biarkan `./`**
   - Framework Preset: Next.js (auto-detected)
   - Build Command: kosongkan (auto = `next build`)
   - Install Command: kosongkan (auto = `yarn install`)
4. **Environment Variables**: tambahkan 8 var dari section 8 untuk **Production**, **Preview**, **Development**
5. **Deploy** → tunggu ±2 menit

### 10.3 Post-Deploy

1. **Supabase Dashboard → Authentication → URL Configuration**:
   - **Site URL**: `https://<your-app>.vercel.app`
   - **Redirect URLs** (whitelist):
     - `https://<your-app>.vercel.app/auth/callback`
     - `https://*.vercel.app/auth/callback` (untuk preview deploys)
2. **Vercel Cron**: otomatis aktif dari `vercel.json`. Cek di Dashboard → Cron tab.
3. **Test endpoint**:
   ```bash
   curl https://<your-app>.vercel.app/api/health
   # Expected: {"ok":true,"app":"Portal DTSEN Bangkalan","ts":"..."}
   ```

### 10.4 Custom Domain (opsional)

1. Vercel → Project → Settings → Domains → Add
2. Tambah `dtsen.bangkalanab.go.id`
3. Update DNS provider Pemda: CNAME → `cname.vercel-dns.com`
4. Update env `NEXT_PUBLIC_APP_URL` + Supabase Auth Site URL
5. Verify domain di **Resend → Domains** supaya bisa kirim email dari `noreply@bangkalanab.go.id`

---

## 11. Test Credentials (UAT)

Semua password: **`Test12345!`** — auto-confirmed via `scripts/uat-setup.ts`.

| Email | Role | OPD |
|---|---|---|
| `latsar.xxix.bkl+admin@gmail.com` | ADMIN | Bapperida Kabupaten Bangkalan |
| `latsar.xxix.bkl+pemohon@gmail.com` | PEMOHON | Dinas Pendidikan Kabupaten Bangkalan |
| `latsar.xxix.bkl+verif@gmail.com` | VERIFIKATOR | Bapperida Kabupaten Bangkalan |
| `latsar.xxix.bkl+ewali@gmail.com` | EWALI_DATA | Dinas Komunikasi dan Informatika Kabupaten Bangkalan |
| `latsar.xxix.bkl+dinsos@gmail.com` | PENGELOLA_DTSEN | Dinas Sosial Kabupaten Bangkalan |

Re-seed: `npx tsx scripts/uat-setup.ts` (idempotent — update jika sudah ada).

---

## 12. UAT 10 Test Cases (Ringkas)

Detail full di `frontend/docs/UAT-day9.md`. Ringkasnya:

| # | Skenario | Aktor | Expected |
|---|---|---|---|
| 1 | Daftar akun OPD baru + login | Anonim → Pemohon | Auto-create user di Prisma; redirect ke dashboard |
| 2 | Submit Permohonan dengan 4 PDF + cek nomor surat | Pemohon | Nomor format `001/PORTAL-DTSEN/DISDIK/V/2026` |
| 3 | Verifikator approve permohonan tahap-1 | Verifikator (Bapperida) | Status → VALIDASI_DISKOMINFO, notifikasi ke E-Wali |
| 4 | E-Wali approve + Dinsos approve | E-Wali, Dinsos | Status → DISETUJUI |
| 5 | Dinsos upload Berkas DTSEN | Dinsos | LaporanPemanfaatan auto-created, deadline +30 hari |
| 6 | Pemohon submit Laporan Pemanfaatan | Pemohon | Status DIKIRIM, antrian review Bapperida |
| 7 | Dual review laporan (Bapperida → Dinsos) | Verifikator, Dinsos | Status DISETUJUI, permohonan SELESAI |
| 8 | Cron reminder H-7 dipicu manual | System | `LaporanReminderLog` ada entry, email terkirim |
| 9 | Export CSV permohonan | Admin | File CSV download dengan UTF-8 BOM, header lengkap |
| 10 | RBAC negative: Pemohon akses /dashboard/admin/users | Pemohon | Block dengan error 403 atau redirect |

Cara run UAT: login akun sesuai role di table 11, ikuti skenario satu per satu.

---

## 13. Decisions & Trade-offs

| Keputusan | Alasan | Trade-off |
|---|---|---|
| Next.js 16 (App Router + Server Actions) | Modern, fast, server-first | Bleeding edge — beberapa lib belum support penuh |
| Prisma 7 pakai pg adapter (bukan rust engine) | Vercel-friendly, no binary issues | Slightly slower vs rust engine |
| Supabase (vs self-hosted Postgres) | Auth + Storage + DB satu paket, free tier generous | Vendor lock-in (mitigation: export pg_dump regular) |
| Resend (vs SendGrid/SMTP Pemda) | Modern API, gratis 3k/bulan, deliverability bagus | Butuh verify domain untuk email branded |
| Vercel (vs server Pemda) | Zero ops, auto-SSL, auto-CDN, Cron built-in | US-based (latency +50ms untuk user Bangkalan, masih OK) |
| Font Arial (bukan Inter/Geist) | Familiar untuk birokrasi, dukungan native semua OS | Less "modern" aesthetic |
| Email+password (bukan SSO Pemda) | Cepat implement, tidak butuh koordinasi IT Pemda | Future: bisa upgrade ke OAuth Google/Microsoft via Supabase |
| Laporan auto-create (bukan pemohon klik "buat") | Mencegah lupa lapor (sistem enforces) | Lebih kompleks UX, perlu edukasi pemohon |
| Hard-coded state machine (bukan workflow DB) | Type-safe, mudah debug | Susah custom workflow per OPD (kalau dibutuhkan nanti) |
| 1 template per jenis dokumen (bukan multiple versions) | Sederhana untuk admin | Tidak ada history versioning template |

---

## 14. Known Issues / Limitations

1. **Logo Bapperida PNG 1.9 MB** — relatif besar. Bisa dioptimasi ke WebP <200 KB dengan tools seperti `sharp` (saat ini Next Image auto-optimize, jadi tidak critical).

2. **Resend default FROM = `onboarding@resend.dev`** — sandbox, hanya bisa kirim ke email Kak Adii sendiri. Untuk production: verify domain di Resend Dashboard.

3. **Cron Vercel Hobby tier**: max 2 cron jobs, hanya jalan di production deployment (bukan preview). Saat ini cuma 1 cron (`laporan-reminder`), aman.

4. **Supabase Free Tier**:
   - DB 500 MB → cukup untuk ratusan permohonan
   - Storage 1 GB → ±200 permohonan x 5 PDF
   - Project auto-pause kalau idle 7 hari → tidak akan kena untuk app yang dipakai harian
   - Backup harian retain 7 hari

5. **No SSO**: saat ini email+password biasa. Kalau Pemda butuh integrasi dengan SSO Pemda Bangkalan (kalau ada), perlu development tambahan via Supabase Auth provider.

6. **Tidak ada offline mode / PWA**: aplikasi require koneksi internet aktif. Untuk OPD di kecamatan dengan internet lemah, perlu add Service Worker (future enhancement).

7. **Field validation client-side**: pakai Zod di server actions, tapi UI feedback bisa lebih real-time dengan client-side schema (saat ini per-field error muncul setelah submit).

8. **No bulk operations**: admin tidak bisa bulk-approve / bulk-delete OPD. Untuk skala 50 OPD masih manageable manual.

---

## 15. Backlog / TODO

### P1 — Operasional sebelum go-live
- [ ] Upload 4 template surat asli (Surat Permintaan, KAK, Pakta Integritas, NDA) via `/dashboard/admin/templat`
- [ ] Verify domain di Resend untuk email FROM branded
- [ ] Set nomor WA Bapperida real di `NEXT_PUBLIC_BAPPERIDA_WA`
- [ ] Custom domain `.bangkalanab.go.id` di Vercel + DNS Pemda
- [ ] Run full UAT 10 test cases dengan saksi user representative tiap role
- [ ] Bikin user guide PDF untuk Pemohon, Verifikator, E-Wali, Dinsos

### P2 — Enhancement (post-launch)
- [ ] **Logo Pemkab Bangkalan** di footer (saat ini cuma logo Bapperida)
- [ ] **SSO integration** dengan SSO Pemda (kalau Pemda punya OIDC/SAML provider)
- [ ] **Public transparency dashboard** `/transparansi` (tanpa login) — tampilkan jumlah permohonan diproses, SLA rata-rata, kepatuhan laporan
- [ ] **In-app AI chatbot** (Tanya Bapperida AI) pakai LLM + knowledge base — auto-jawab pertanyaan umum, escalate ke WA hanya jika kompleks
- [ ] **Mobile PWA** — installable, offline draft form
- [ ] **Multi-language** ID + EN (kalau ada audience eksternal)
- [ ] **Field analytics** — track form abandonment, error rate per field

### P3 — Skala besar
- [ ] **Workflow custom per OPD** (kalau ada OPD dengan SOP berbeda)
- [ ] **Audit log searchable** dengan filter advanced
- [ ] **API public** (read-only) untuk integrasi dengan portal Pemda lain
- [ ] **Versioning template** — history perubahan template surat

---

## 16. Critical Bugs Fixed dalam Sesi Ini

1. **`seed.ts` tanpa kodeOpd** → UAT Test 2 akan gagal karena nomor surat tidak match format `001/PORTAL-DTSEN/DISDIK/...`. **Fix**: tambah `kodeOpd` untuk 49 OPD.

2. **ESM hoisting bug** di scripts (seed.ts, init-storage.ts, uat-setup.ts, promote-admin.ts) — `import { prisma }` di-hoist sebelum `loadEnv()` jalan → DATABASE_URL undefined → Prisma fallback ke `127.0.0.1:5432`. **Fix**: dynamic import prisma/supabase setelah dotenv load.

3. **Next.js Turbopack dev OOM di Emergent preview** — pod kena reset terus saat compile pertama. **Fix**: switch supervisor `start` script dari `next dev` ke `next start` (production build, jauh lebih hemat memory).

4. **Next.js Server Actions CSRF block** — Emergent pakai dual-domain (`preview.emergentagent.com` + `cluster-12.preview.emergentcf.cloud`), host header ≠ origin header → action di-abort. **Fix**: set `serverActions.allowedOrigins` di `next.config.ts`.

5. **Storage `ensureBuckets()` hardcode PDF-only** — saat tambah bucket `templat-surat`, harus support DOCX/DOC/ODT juga. **Fix**: split bucket creation jadi PDF-only group + templat-surat group dengan multi-mime.

6. **Password DB ada `@`** (Bangkalan@12345) → Postgres connection parser fail. **Fix**: URL-encode `@` → `%40` di DATABASE_URL.

---

## 17. Bagaimana Cara Iterate dari Sini

Kalau Kakak mau **lanjut development** dengan AI lain (Claude/ChatGPT/Cursor/dll):

1. **Share file ini** (`HANDOVER.md`) sebagai context awal
2. **Share juga**:
   - `frontend/prisma/schema.prisma` — full DB schema
   - `frontend/src/lib/workflow/permohonan.ts` & `laporan.ts` — state machines
   - `frontend/src/lib/permohonan/actions.ts` & `laporan/actions.ts` — server actions
   - `frontend/.env.example` — env var template
   - `frontend/docs/UAT-day9.md` — test cases

3. **Konvensi yang harus diikuti**:
   - Pakai **Server Actions** (bukan API routes) untuk mutation
   - Pakai **Prisma** untuk DB access (jangan raw SQL kecuali perlu)
   - Pakai **shadcn/ui** components (jangan custom dari scratch)
   - Pakai **lucide-react** untuk icons
   - Semua interactive element wajib `data-testid="..."` (kebab-case)
   - Server-only files: tambah `import "server-only"` di top (kalau ada secret access)
   - Date format: `Intl.DateTimeFormat("id-ID", ...)` untuk display, ISO string untuk storage
   - Mata uang: tidak ada (app gratis)
   - Currency display: tidak ada
   - Locale Indonesia: "Kak" (bukan "Anda"), "Kakak" formal

4. **Untuk fitur baru**:
   - Schema change → edit `schema.prisma` → `npx prisma db push` → `npx prisma generate`
   - Route baru → bikin di `src/app/...`
   - Component baru → `src/components/...`
   - Server action → di `src/lib/<modul>/actions.ts`, pakai `"use server"`
   - Email template → di `src/lib/email/...`

5. **Untuk bug fix**:
   - Cek log via `tail /var/log/supervisor/frontend.*.log` (di Emergent)
   - Atau Vercel Dashboard → Logs (production)
   - Reproduce dulu sebelum fix
   - Update test case di `docs/UAT-day9.md`

---

## 18. Kontak & Lisensi

- **Project Owner**: Pemerintah Kabupaten Bangkalan
- **Stakeholder utama**:
  - Bapperida (Verifikator) — Kak Adii (PIC handover)
  - Diskominfo (E-Wali Data) — internal
  - Dinas Sosial (Pengelola DTSEN) — internal
- **Developer initial**: Latsar XXIX (latsar.xxix.bkl@gmail.com)
- **AI assistant**: Emergent E1 (sesi finish-app-18, Mei 2026)
- **Lisensi**: Internal Pemkab Bangkalan, tidak open source.

---

## 19. Lampiran — Useful Commands

```bash
# Setup ulang dari nol
cd frontend
rm -rf node_modules .next
yarn install
bash scripts/setup-all.sh

# Reset database (HATI-HATI — drop semua data)
npx prisma db push --force-reset
bash scripts/setup-all.sh

# Cek schema vs DB
npx prisma db pull
npx prisma format

# Test connection
npx prisma db execute --stdin <<< "SELECT 1;"

# Generate Prisma Client (kalau ada error type)
npx prisma generate

# Tail backend logs (Emergent)
tail -f /var/log/supervisor/frontend.out.log
tail -f /var/log/supervisor/frontend.err.log

# Restart Next.js (Emergent)
sudo supervisorctl restart frontend

# Build + start production
yarn build
yarn start                                # port 3000

# Trigger cron manual
curl -H "Authorization: Bearer dtsen-bangkalan-cron-secret-2026" \
  http://localhost:3000/api/cron/laporan-reminder

# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Promote user ke ADMIN
npx tsx scripts/promote-admin.ts user@email.com
```

---

**Akhir handover. Total file: ±25K karakter. Siap di-share ke AI lain atau developer untuk continue work.**
