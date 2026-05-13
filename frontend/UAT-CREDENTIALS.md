# Portal DTSEN Bangkalan — Test Credentials

⚠️ **UAT/Dev only — JANGAN dipakai di production**

## Akun UAT (auto-confirmed via `scripts/uat-setup.ts`)

Semua akun dibuat di Supabase Auth project `ubolcndcnmseqlecjazx` dan Prisma DB:

| Email | Role | OPD | Password |
|---|---|---|---|
| `latsar.xxix.bkl+pemohon@gmail.com` | PEMOHON | Dinas Pendidikan Kabupaten Bangkalan | `Test12345!` |
| `latsar.xxix.bkl+admin@gmail.com` | ADMIN | Bapperida Kabupaten Bangkalan | `Test12345!` |
| `latsar.xxix.bkl+verif@gmail.com` | VERIFIKATOR | Bapperida Kabupaten Bangkalan | `Test12345!` |
| `latsar.xxix.bkl+ewali@gmail.com` | EWALI_DATA | Dinas Komunikasi dan Informatika Kabupaten Bangkalan | `Test12345!` |
| `latsar.xxix.bkl+dinsos@gmail.com` | PENGELOLA_DTSEN | Dinas Sosial Kabupaten Bangkalan | `Test12345!` |

## Re-seed akun (idempotent)
```bash
cd /app/frontend
npx tsx scripts/uat-setup.ts
```

## Promote user ke ADMIN by email
```bash
npx tsx scripts/promote-admin.ts <email>
```

## Cron secret
`CRON_SECRET=dtsen-bangkalan-cron-secret-2026`

Trigger cron reminder:
```bash
curl -H "Authorization: Bearer dtsen-bangkalan-cron-secret-2026" \
  http://localhost:3000/api/cron/laporan-reminder
```

## Supabase
- Project: https://ubolcndcnmseqlecjazx.supabase.co
- Dashboard: https://supabase.com/dashboard/project/ubolcndcnmseqlecjazx
- DB region: `aws-1-ap-northeast-1.pooler.supabase.com` (Session Pooler port 5432)

## Storage buckets (privat, 10MB limit, PDF-only)
- `permohonan-dokumen` — 4 dokumen wajib per permohonan
- `berkas-dtsen` — Berkas final DTSEN dari Dinsos
- `laporan-pendukung` — Lampiran laporan pemanfaatan
