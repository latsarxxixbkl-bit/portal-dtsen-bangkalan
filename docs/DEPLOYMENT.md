# Portal DTSEN Bangkalan — Catatan Deployment & Operasional

## Stack Overview

| Komponen | Layanan | Tier |
|---|---|---|
| Hosting | **Vercel** (Hobby) | Free |
| Database | **Supabase Postgres** | Free (500 MB) |
| Auth | **Supabase Auth** | Free (50k MAU) |
| Storage | **Supabase Storage** | Free (1 GB) |
| Email | **Resend** | Free (3k email/bulan, 100/hari) |
| Source code | **GitHub** (private/public) | Free |
| Cron | **Vercel Cron** | Free (Hobby) |

**Total biaya: Rp 0** untuk skala pilot.

## Environment Variables

Set di **Vercel → Settings → Environment Variables** untuk **Production + Preview + Development**:

| Nama | Sumber | Fungsi |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Client Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API → Publishable/anon key | Auth dari browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → Secret/service_role key | Admin operasi server-side |
| `DATABASE_URL` | Supabase → Database → Connection string (Session pooler, port 5432) | Prisma client |
| `RESEND_API_KEY` | Resend → API Keys | Kirim email |
| `CRON_SECRET` | Generate sendiri (random 32+ char) | Auth endpoint cron |

**Jangan commit nilai env ke repo.** `.env.local` sudah ada di `.gitignore`.

## First-time Setup

### 1. Supabase Project
- Create new project di Supabase, region **Southeast Asia (Singapore)**
- Tunggu provisioning ±2 menit
- Copy Project URL, anon key, service_role key

### 2. Push schema ke Supabase
Dari mesin developer:
```bash
git clone https://github.com/latsarxxixbkl-bit/portal-dtsen-bangkalan.git
cd portal-dtsen-bangkalan
npm install
cp .env.example .env.local
# Edit .env.local — isi 6 env vars di atas
npx prisma db push
npx tsx scripts/init-storage.ts  # buat bucket Storage
npx tsx prisma/seed.ts            # seed 49 OPD Pemkab Bangkalan
```

### 3. Bootstrap Admin pertama
```bash
# Daftar dulu via UI /daftar dengan email Kak Adii
# Lalu jalankan:
npx tsx scripts/promote-admin.ts admin@email.com
```

### 4. Vercel Connect
- Login Vercel pakai akun GitHub yang sama dengan repo owner
- Add New → Project → import `portal-dtsen-bangkalan`
- Set 6 env vars di Settings
- Deploy

### 5. Set Auth Redirect URLs di Supabase
- Supabase → Authentication → URL Configuration
- **Site URL**: `https://portal-dtsen-bangkalan.vercel.app` (atau domain custom)
- **Redirect URLs**: `https://*.vercel.app/auth/callback`, `https://portal-dtsen-bangkalan.vercel.app/auth/callback`

### 6. Resend Domain (opsional)
- Default pakai `onboarding@resend.dev` (sandbox) — cuma bisa kirim ke email Kak Adii sendiri
- Untuk produksi: verify domain (mis. `dtsen.bangkalanab.go.id`) di Resend → DNS records di domain provider Pemda

## Migrasi Schema

Pakai Prisma:
```bash
# Edit prisma/schema.prisma
npx prisma db push          # push langsung (dev/pilot)
# atau
npx prisma migrate dev      # bikin migration file (production)
```

**Jangan edit migration file generated**. Re-run `prisma migrate` saat schema berubah.

## Build & Test Lokal

```bash
npm run dev     # http://localhost:3000
npm run lint    # ESLint check
npm run build   # Production build
```

## Vercel Cron

Sudah konfigurasi di `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/laporan-reminder", "schedule": "0 23 * * *" }
  ]
}
```
- Schedule: setiap hari 23:00 UTC = 06:00 WIB
- Vercel akan auto-hit endpoint dengan header `Authorization: Bearer <CRON_SECRET>`
- Cek log di Vercel Dashboard → Logs

## Monitoring

| Aspek | Lokasi |
|---|---|
| Error frontend | Vercel Logs → Function Logs |
| Email delivery | Resend Dashboard → Logs |
| DB usage | Supabase Studio → Reports |
| Storage usage | Supabase Studio → Storage → Usage |
| User activity | Supabase Studio → Auth → Users |
| Build status | Vercel Dashboard → Deployments |

## Quota Free Tier — Hal yang harus dipantau

1. **Supabase DB 500 MB**: ribuan permohonan + ratusan ribu notifikasi masih aman. Cleanup notifikasi lama secara berkala.
2. **Supabase Storage 1 GB**: ±200 permohonan × 5 PDF × 1 MB = 1 GB. Arsipkan permohonan lama ke Google Drive Pemda.
3. **Resend 3k email/bulan**: untuk pilot puluhan permohonan/bulan jauh dari habis. Pantau saat scale.
4. **Vercel 100 GB bandwidth/bulan**: aman untuk traffic internal Pemda.
5. **Supabase auto-pause**: project di-pause jika tidak diakses 7 hari berturut-turut. Untuk app yang dipakai harian, tidak akan kena.

## Backup Database

Supabase Free Tier:
- Auto-backup **daily, retained 7 days**
- Restore via Supabase Studio → Database → Backups

Untuk arsip jangka panjang (compliance), ekspor manual mingguan:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```
Simpan ke Google Drive Pemda atau cloud storage Pemkab.

## Disaster Recovery

Kalau Supabase project hilang/corrupt:
1. Restore dari backup harian di Supabase Studio
2. Atau provisioning baru → restore dari pg_dump backup
3. Update env var `DATABASE_URL` di Vercel
4. Jalankan `npx tsx scripts/init-storage.ts` untuk recreate bucket
5. Re-upload berkas dari arsip Google Drive (kalau ada)

## Security Notes

- **Service role key** hanya di server (env Vercel). **Tidak pernah** ada di kode client / Git.
- **RLS (Row-Level Security)** di Supabase Postgres aktif via Prisma — akses kontrol via session user.
- **Signed URL** Storage expire 5 menit; tidak ada link permanen.
- **Password** di-hash via Supabase Auth (bcrypt).
- **HTTPS** wajib (Vercel default).
- **Audit trail** semua transisi status disimpan di `riwayat_permohonan` / `riwayat_laporan`.

## Upgrade Path

Jika butuh lebih dari free tier:

| Komponen | Upgrade | Harga (per bulan) |
|---|---|---|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Resend | Pro | $20 (50k email) |
| Total | | **±$65** = Rp 1 jt |

Atau migrasi ke server Pemda sendiri (self-hosted):
- Postgres + Storage di server Pemda
- Next.js di-deploy via PM2 / Docker
- Konversi Supabase Auth ke Auth.js (NextAuth) — perlu development tambahan

## Custom Domain

Setelah pilot OK, untuk domain `.bangkalanab.go.id`:
1. Vercel Dashboard → Project → Settings → Domains → Add
2. Mis. `dtsen.bangkalanab.go.id`
3. Di DNS provider Pemda, tambah record CNAME → `cname.vercel-dns.com`
4. Update `NEXT_PUBLIC_SITE_URL` env var di Vercel
5. Update Supabase Auth Site URL / Redirect URLs ke domain baru

## Kontak & Bantuan

- **Codebase issues**: lihat README.md repo
- **Devin AI session history**: link di PR description
- **Supabase issues**: https://supabase.com/support
- **Vercel issues**: https://vercel.com/help
- **Resend issues**: https://resend.com/help
