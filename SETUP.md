# Portal DTSEN Bangkalan — Setup di Emergent Environment

Aplikasi sudah **terpasang** dan **running** di `https://3af38edc-cee1-436f-8ec3-13f7f0086c70.preview.emergentagent.com/`.

Tapi semua halaman selain landing (`/`) butuh **Supabase credentials real** untuk berfungsi. Tanpa credential, login/daftar/dashboard akan error.

---

## ✅ Yang SUDAH selesai

1. **Bootstrap Next.js 16 + Prisma 7 + Supabase + Tailwind v4 + shadcn/ui** — 128 file
2. **Schema Prisma lengkap** — 12 model: User, Opd, Permohonan, DokumenPermohonan, RiwayatPermohonan, BerkasDtsen, LaporanPemanfaatan, RiwayatLaporan, LaporanReminderLog, Notifikasi
3. **State machines lengkap** — Permohonan (4-stage workflow) + Laporan (dual review)
4. **Server actions**: submit permohonan, workflow transition, upload berkas, submit laporan, review laporan
5. **Auth** — Supabase Auth (email+password) dengan magic link callback
6. **RBAC** — 5 role (PEMOHON / VERIFIKATOR / EWALI_DATA / PENGELOLA_DTSEN / ADMIN)
7. **Module Admin** — kelola user (invite via Supabase Admin API), kelola OPD
8. **Laporan Pemanfaatan** — auto-create saat Pengelola DTSEN upload berkas (+30 hari deadline)
9. **Cron reminder** — `/api/cron/laporan-reminder` (H-7, H-1, H+1, H+7, H+14, H+30) dengan auth Bearer token
10. **Export CSV** — permohonan & laporan (UTF-8 BOM untuk Excel locale ID)
11. **Notifikasi in-app** + email template (Resend)
12. **Landing page** — render perfect dengan branding Pemkab Bangkalan
13. **Seed OPD** — 49 OPD Bangkalan **WITH kodeOpd** (DISDIK, DINKES, BAPPERIDA, dst.) untuk nomor surat format `001/PORTAL-DTSEN/DISDIK/V/2026`
14. **Supervisor configured** — Next.js dev server running di port 3000 (HOT reload)
15. **Setup script all-in-one** — `bash scripts/setup-all.sh`

---

## ⚠️ Yang BELUM bisa karena BUTUH KREDENSIAL DARI KAKAK

Saya cuma punya `NEXT_PUBLIC_SUPABASE_URL=https://ubolcndcnmseqlecjazx.supabase.co` — **3 nilai krusial masih placeholder** di `/app/frontend/.env.local`.

Tanpa kredensial ini, **semua flow auth + database TIDAK akan jalan**:
- ❌ Login / Daftar / Reset password
- ❌ Dashboard
- ❌ Submit permohonan
- ❌ Upload PDF (Supabase Storage)
- ❌ State machine workflow
- ❌ Laporan pemanfaatan
- ❌ Notifikasi email (butuh Resend juga)
- ❌ UAT 10 test cases

---

## 🔑 LANGKAH KAKAK: Isi credential lalu jalankan setup

### 1. Buka Supabase Dashboard
- https://supabase.com/dashboard/project/ubolcndcnmseqlecjazx (ini project Kakak)

### 2. Ambil 3 nilai dari Settings

**A. Settings → API → Project API Keys**:
- Copy **`anon` `public`** key → tempel ke `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Klik *reveal* di **`service_role` `secret`** → copy → tempel ke `SUPABASE_SERVICE_ROLE_KEY`

**B. Settings → Database → Connection string → tab URI → mode Session pooler (port 5432)**:
- Copy full string, **ganti `[YOUR-PASSWORD]` dengan password DB project Kakak**
- Tempel ke `DATABASE_URL`
- Contoh: `postgresql://postgres.ubolcndcnmseqlecjazx:MyPassword123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`

**C. (Opsional) Resend API key** — dari https://resend.com/api-keys
- Tempel ke `RESEND_API_KEY`
- Kalau belum perlu email, biarkan placeholder, email akan gagal silent (tidak crash)

### 3. Edit `.env.local`

```bash
# Buka file di code-server atau VS Code
nano /app/frontend/.env.local
# atau pakai built-in editor di Emergent
```

Ganti 4 baris ini dengan nilai real:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres.ubolcndcnmseqlecjazx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
RESEND_API_KEY=re_xxxxx
```

### 4. Jalankan setup all-in-one

```bash
cd /app/frontend
bash scripts/setup-all.sh
```

Script ini akan:
1. ✅ Validasi `.env.local` (refuse kalau masih placeholder)
2. ✅ `prisma db push` — sync semua tabel ke Supabase Postgres
3. ✅ `prisma generate` — generate Prisma Client
4. ✅ Seed 49 OPD Bangkalan
5. ✅ Bikin 3 Storage bucket privat: `permohonan-dokumen`, `berkas-dtsen`, `laporan-pendukung`

### 5. Restart frontend
```bash
sudo supervisorctl restart frontend
```

### 6. (Opsional) Setup UAT test accounts auto-confirm
```bash
cd /app/frontend
npx tsx scripts/uat-setup.ts
```

Akan bikin 5 akun (semua password `Test12345!`):
- `latsar.xxix.bkl+admin@gmail.com` → ADMIN @ Bapperida
- `latsar.xxix.bkl+pemohon@gmail.com` → PEMOHON @ Dinas Pendidikan
- `latsar.xxix.bkl+verif@gmail.com` → VERIFIKATOR @ Bapperida
- `latsar.xxix.bkl+ewali@gmail.com` → EWALI_DATA @ Diskominfo
- `latsar.xxix.bkl+dinsos@gmail.com` → PENGELOLA_DTSEN @ Dinas Sosial

### 7. Mulai UAT
Buka dokumentasi UAT plan: `/app/frontend/docs/UAT-day9.md` — 10 test case end-to-end.

---

## 🛠️ Troubleshooting

### Frontend error after credential update
```bash
sudo supervisorctl restart frontend
tail -f /var/log/supervisor/frontend.out.log
```

### Cek service status
```bash
sudo supervisorctl status
```

### Cek log
```bash
tail -n 100 /var/log/supervisor/frontend.err.log
tail -n 100 /var/log/supervisor/frontend.out.log
```

### Test Prisma connection
```bash
cd /app/frontend
npx prisma db pull   # akan gagal kalau DATABASE_URL salah
```

### Reset database (HATI-HATI — drop semua data)
```bash
cd /app/frontend
npx prisma db push --force-reset
npx tsx prisma/seed.ts
npx tsx scripts/init-storage.ts
```

---

## 🚀 Deploy Production

Aplikasi ini **NOT designed** untuk deploy via Emergent native (Emergent native = React+FastAPI+MongoDB). Untuk production:

1. Push code ke GitHub via fitur **"Save to GitHub"** (icon di chat Emergent)
2. Import repo ke **Vercel** (https://vercel.com)
3. Set env vars yang sama dengan `.env.local`
4. Deploy → dapat URL production `*.vercel.app`
5. Set custom domain Pemkab (`portal-dtsen.bangkalankab.go.id`)
6. Set Vercel Cron untuk `/api/cron/laporan-reminder` (daily 09:00 WIB)

Detail di: `/app/frontend/docs/DEPLOYMENT.md`

---

## 📚 Dokumentasi lain

- `/app/frontend/docs/RUNBOOK.md` — panduan pengguna per peran
- `/app/frontend/docs/ADMIN-GUIDE.md` — panduan administrator
- `/app/frontend/docs/UAT-day9.md` — 10 test case UAT
- `/app/frontend/docs/DEPLOYMENT.md` — deployment & ops
