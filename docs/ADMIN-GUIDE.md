# Portal DTSEN Bangkalan — Panduan Admin

Panduan ini untuk **Administrator sistem**: orang yang mengelola pengguna, OPD, & operasional aplikasi sehari-hari.

## Akses Awal: Mengangkat Admin Pertama

Saat database baru di-deploy, **belum ada user dengan peran ADMIN**. Untuk mengangkat akun pertama jadi Admin:

1. Pastikan akun email yang akan jadi Admin **sudah daftar** di aplikasi (`/daftar`).
2. Dari mesin developer (atau Vercel CLI), jalankan:
   ```bash
   npx tsx scripts/promote-admin.ts admin@email.com
   ```
3. Script ini akan set `role=ADMIN` & `isActive=true` di tabel `users`.
4. Login ulang → menu **Admin** muncul di sidebar.

Setelah Admin pertama ada, Admin berikutnya bisa dibuat dari UI (lihat di bawah).

## Kelola Pengguna

**Lokasi**: sidebar → **Pengguna** (`/dashboard/admin/users`)

### Undang Pengguna Baru
1. Klik **"Undang Pengguna"** (kanan atas)
2. Isi: email, nama lengkap, peran (Pemohon/Verifikator/E-Wali/Pengelola DTSEN/Admin), OPD (wajib untuk Pemohon)
3. Sistem akan kirim **email magic link** dari Supabase ke alamat tersebut
4. Penerima klik link → set password → login

### Edit Pengguna
1. Klik tombol **"Edit"** di row pengguna
2. Bisa ubah: peran, OPD, nama, jabatan, NIP, no HP
3. Pemohon **wajib** punya OPD (form akan tolak jika kosong)

### Aktif / Nonaktif
- Klik toggle di kolom **Status**.
- User nonaktif **tidak bisa login** dan tidak muncul di daftar reviewer.

### Tips Manajemen Pengguna
- **Satu Verifikator/E-Wali/Pengelola DTSEN per OPD utama sudah cukup** untuk pilot. Tambahkan backup bila volume permohonan tinggi.
- Jangan hapus user (hapus = lose audit trail). Pakai toggle nonaktif saja.

## Kelola OPD

**Lokasi**: sidebar → **OPD** (`/dashboard/admin/opd`)

49 OPD Pemkab Bangkalan sudah di-seed otomatis. Bisa edit / tambah baru.

### Tambah OPD
1. Klik **"Tambah OPD"**
2. Isi: **Kode** (unik, mis. `DINSOS`), **Nama**, **Jenis** (Dinas/Badan/Kantor/Kecamatan/Kelurahan/RSUD/Sekretariat/Lainnya), **Alamat**, **Email Resmi**
3. Aktifkan / Nonaktifkan via toggle

### Edit OPD
- Klik **"Edit"** di row OPD
- Field sama dengan tambah, kode tidak boleh duplikat dengan OPD lain

### Catatan
- Jika OPD dinonaktifkan, **user-nya tetap aktif** (asumsi peralihan OPD bisa terjadi). Tapi OPD nonaktif tidak muncul di dropdown saat invite user baru.

## Monitoring & Audit

### Dashboard Admin
- **Stat utama**: total permohonan, sedang berjalan, perlu tindakan, total laporan
- **Stat khusus admin**: jumlah pengguna, jumlah OPD, permohonan selesai
- **Chart distribusi status permohonan** (SVG, real-time)
- **Permohonan terbaru** (5 record, all OPD)
- **Laporan deadline terdekat** (5 record)

### Lihat semua permohonan / laporan
- Sidebar → **Semua Permohonan** & **Semua Laporan**
- Filter belum tersedia di UI v1; pakai **Export CSV** + filter di Excel/Sheets

### Audit trail
Setiap aksi di permohonan/laporan tercatat di tabel `riwayat_permohonan` / `riwayat_laporan`. Field: actor, aksi, status before/after, catatan, timestamp.

Akses langsung di halaman detail permohonan/laporan → tab **Riwayat**.

## Operasional Cron & Reminder

### Cron Reminder Laporan
- Endpoint: `GET /api/cron/laporan-reminder`
- Header: `Authorization: Bearer <CRON_SECRET>`
- Vercel Cron schedule: setiap hari 06:00 WIB (00:00 UTC) — sudah dikonfigurasi di `vercel.json`
- 7 jenis reminder dikirim: H-7, H-1, H+1, H+7, H+14, H+30, eskalasi Bapperida

**Trigger manual** (mis. untuk testing):
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://portal-dtsen-bangkalan.vercel.app/api/cron/laporan-reminder
```

### Log Reminder
- Tabel `laporan_reminder_log` menyimpan setiap reminder yang dikirim (laporanId, jenis, tanggal).
- Akses via Supabase Studio bila perlu audit.

## Manajemen Storage

Berkas tersimpan di Supabase Storage bucket privat **`dtsen-docs`** (sudah ke-create otomatis).

### Struktur folder
```
dtsen-docs/
  permohonan/
    {permohonanId}/
      surat-permintaan.pdf
      kak.pdf
      pakta-integritas.pdf
      nda.pdf
  berkas-dtsen/
    {permohonanId}/
      berkas-{timestamp}.{ext}
  laporan/
    {laporanId}/
      lampiran.pdf
```

### Quota Free Tier
- **1 GB** total. Pantau via Supabase Studio → Storage → Usage.
- **Jika mendekati limit**: arsipkan permohonan lama (`SELESAI` > 1 tahun) ke Google Drive Pemda; hapus dari storage.

### Signed URL
- Tidak ada link permanen. Setiap klik download → generate signed URL **expire 5 menit**.
- Aman: link bocor kadaluarsa cepat.

## Manajemen User Lupa Password

User bisa reset sendiri via "Lupa Password" di `/lupa-password`. Email dari Resend.

Jika user **tidak menerima email reset**:
1. Cek Resend dashboard → Logs → status email
2. Pastikan Resend free quota belum habis (3.000 email/bulan)
3. Bila perlu, Admin bisa **set password manual** via Supabase Studio → Authentication → User → "Send recovery email" / "Set password"

## Manajemen Notifikasi

- Notifikasi disimpan di tabel `notifikasi`. Tipe: `INFO`, `SUKSES`, `PERINGATAN`, `BAHAYA`.
- Jangan delete row. Sistem hanya menandai `dibacaAt`.
- Jika tabel sudah ratusan ribu row dan storage DB hampir penuh, jalankan cleanup manual lewat SQL Supabase:
  ```sql
  DELETE FROM notifikasi WHERE dibaca_at IS NOT NULL AND created_at < NOW() - INTERVAL '6 months';
  ```

## Troubleshooting Umum

### "User tidak bisa login"
1. Cek `isActive` di Pengguna → harus true
2. Cek email di Supabase Auth → user ada & confirmed
3. Suruh reset password

### "Upload PDF gagal"
1. Cek ukuran < 10 MB
2. Cek koneksi internet user
3. Cek Supabase Storage quota (mungkin penuh)
4. Cek Service Role key valid di Vercel env

### "Email notifikasi tidak terkirim"
1. Cek `RESEND_API_KEY` valid di Vercel env
2. Cek Resend dashboard → Logs
3. Cek domain pengirim di Resend (default `onboarding@resend.dev` cukup, tapi bisa di-replace kalau mau domain custom Pemda)

### "Cron tidak jalan"
1. Cek `vercel.json` ada section `crons`
2. Cek Vercel Dashboard → Functions → Cron status
3. Trigger manual untuk verifikasi (lihat di atas)

## Pengaturan Lanjutan (Phase 2)

Tidak termasuk pilot, tapi bisa ditambahkan kemudian:
- **2FA** untuk Admin & Dinsos
- **SSO** dengan ID Pemkab
- **WhatsApp notifikasi** via Fonnte/Wablas (berbayar)
- **PDF preview inline** (saat ini hanya download)
- **Filter & pencarian** di list permohonan/laporan
- **Dashboard publik** transparansi (statistik agregat tanpa data sensitif)
