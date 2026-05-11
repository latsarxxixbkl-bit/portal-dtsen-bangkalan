# Portal DTSEN Bangkalan — Runbook Pengguna

Dokumen ini menjelaskan **alur penggunaan aplikasi** untuk masing-masing peran. Pasangkan dengan `ADMIN-GUIDE.md` (untuk pengelola) dan `DEPLOYMENT.md` (untuk operasional teknis).

## Akses & Login

1. Buka **`https://portal-dtsen-bangkalan.vercel.app`** (URL produksi) atau preview URL dari Vercel.
2. Login pakai email + password yang terdaftar di sistem.
3. Belum punya akun? Klik **"Daftar"** — isi nama, email, password, lalu pilih OPD asal. Akun baru default berperan **Pemohon**; Admin akan menyetujui & menetapkan peran lain bila perlu.

## Peran dalam Sistem

| Peran | Siapa | Yang dia kerjakan |
|---|---|---|
| **Pemohon** | Staf OPD pengguna data | Mengajukan permohonan data DTSEN, upload 4 dokumen, kirim Laporan Pemanfaatan |
| **Verifikator** | Bapperida (Perencanaan) | Verifikasi awal permohonan, review laporan tahap 1 |
| **E-Wali Data** | Diskominfo (Sekretariat Satu Data) | Validasi teknis & klasifikasi data |
| **Pengelola DTSEN** | Dinas Sosial (pemilik data) | Putuskan persetujuan akhir, upload Berkas DTSEN, review laporan tahap 2 |
| **Admin** | Sekretariat sistem | Kelola pengguna & OPD, semua akses read-only |

## Alur 1 — Pengajuan Permohonan (Pemohon)

1. Login → Klik **"Permohonan Baru"** di sidebar.
2. Isi form:
   - **Judul**: ringkas kegunaan data, mis. *"Sasaran intervensi stunting Kec. Bangkalan 2025"*
   - **Jenis data diminta**: variabel DTSEN yang dibutuhkan
   - **Periode awal/akhir** (opsional): rentang data
   - **Justifikasi kebutuhan**: latar belakang & manfaat
3. Upload **4 PDF wajib**:
   - Surat Permintaan Akses DTSEN (resmi dari OPD, ditandatangani pimpinan)
   - Kerangka Acuan Kerja (KAK)
   - Pakta Integritas
   - Non-Disclosure Agreement (NDA)
   - Ukuran maks **10 MB per file**, format PDF saja.
4. Klik **"Ajukan"**. Status → `VERIFIKATOR_REVIEW`. Notifikasi email otomatis terkirim ke Verifikator Bapperida.
5. Pantau di halaman **Daftar Permohonan** atau **Notifikasi** (ikon bell).

### Jika permohonan **dikembalikan untuk revisi**
- Buka detail permohonan → lihat catatan reviewer di **Riwayat**.
- Edit dokumen yang diminta → klik **"Kirim Ulang"**.

### Jika permohonan **ditolak**
- Status final `DITOLAK`. Alasan tertulis di Riwayat. Buat permohonan baru bila perlu.

## Alur 2 — Verifikasi (Verifikator Bapperida)

1. Login → buka **"Antrian Verifikasi"**.
2. Pilih permohonan dengan status `VERIFIKATOR_REVIEW`.
3. Cek 4 PDF (klik nama dokumen → buka via signed URL, expire 5 menit).
4. Pilih aksi:
   - **Terima & teruskan ke E-Wali** → status `EWALI_REVIEW`
   - **Kembalikan ke Pemohon** → input catatan revisi; status `DIKEMBALIKAN_KE_VERIFIKATOR`
   - **Tolak** → input alasan; status `DITOLAK` (final)

## Alur 3 — Validasi Teknis (E-Wali Diskominfo)

1. Buka **"Antrian E-Wali"** → permohonan status `EWALI_REVIEW`.
2. Validasi:
   - Klasifikasi data (umum/terbatas/rahasia)
   - Kelayakan teknis (apakah field DTSEN yang diminta ada & sesuai periode)
3. Aksi:
   - **Setuju & teruskan ke Pengelola DTSEN** → status `DTSEN_REVIEW`
   - **Kembalikan ke E-Wali** untuk revisi internal → status `DIKEMBALIKAN_KE_EWALI`
   - **Tolak** → status `DITOLAK`

## Alur 4 — Persetujuan & Penyerahan Data (Pengelola DTSEN / Dinsos)

1. Buka **"Antrian Persetujuan"** → status `DTSEN_REVIEW`.
2. Putuskan:
   - **Setujui** → status `DISETUJUI`. Lanjut step 3.
   - **Tolak** → status `DITOLAK`.
3. Setelah disetujui, upload **Berkas DTSEN** final (PDF/Excel/ZIP):
   - Klik tombol **"Upload Berkas DTSEN"** di halaman detail.
   - Sistem akan otomatis:
     - Status permohonan → `SELESAI`
     - Buat record **Laporan Pemanfaatan** dengan deadline 30 hari sejak hari ini
     - Kirim email & in-app notif ke Pemohon: "Berkas siap diunduh, deadline laporan = …"

## Alur 5 — Laporan Pemanfaatan (Pemohon)

1. Setelah menerima Berkas DTSEN, sistem auto-buat record Laporan dengan deadline **H+30**.
2. Notifikasi reminder dikirim otomatis: **H-7**, **H-1**, **H+1** (telat), **H+7**, **H+14**, **H+30**, eskalasi ke Bapperida.
3. Buka **"Laporan Pemanfaatan"** → pilih record laporan.
4. Isi form:
   - Judul kegiatan, periode pemanfaatan
   - **Output kegiatan** (apa saja yang dihasilkan)
   - **Manfaat & dampak** (uraian kualitatif/kuantitatif)
   - **Jumlah record** DTSEN yang akhirnya dipakai
   - Upload PDF pendukung (opsional, mis. laporan kegiatan lengkap)
5. Klik **"Kirim Laporan"** → status `REVIEW_BAPPERIDA`.

## Alur 6 — Review Laporan (Bapperida → Dinsos)

### Bapperida
1. Buka **"Review Laporan (Bapperida)"** → pilih record status `REVIEW_BAPPERIDA`.
2. Aksi:
   - **Setujui & teruskan** → status `REVIEW_DINSOS`
   - **Minta revisi** → input catatan; status `PERLU_REVISI`; pemohon revisi & kirim ulang.

### Dinsos
1. Buka **"Review Laporan (Dinsos)"** → pilih record status `REVIEW_DINSOS`.
2. Aksi:
   - **Setujui final** → status `DISETUJUI` (final). Pemohon notified.
   - **Minta revisi** → kembali ke pemohon.

## Tab Notifikasi

- Bell di topbar menampilkan badge **unread**.
- Buka **`/dashboard/notifikasi`** untuk lihat semua notif.
- Klik notif untuk navigasi langsung ke permohonan/laporan terkait.

## Export Data

- Daftar Permohonan → tombol **"Export CSV"** di kanan atas
- Daftar Laporan → tombol **"Export CSV"** di kanan atas
- File CSV bisa langsung dibuka di Excel/Google Sheets (sudah pakai BOM UTF-8).

## Profil

- Klik nama Kak di sidebar (atau **Pengaturan → Profil**)
- Ubah: nama lengkap, jabatan, NIP, no HP
- Email & Peran tidak bisa diubah sendiri (kontak Admin)

## FAQ

**Q: PDF saya lebih besar dari 10 MB.**
A: Kompres dulu pakai Adobe Acrobat / ilovepdf.com. Sistem strict 10 MB karena keterbatasan storage free tier.

**Q: Saya lupa password.**
A: Klik "Lupa password" di halaman login. Email reset akan terkirim dari Resend.

**Q: Saya belum dapat email reset/invite.**
A: Cek folder Spam. Kalau tetap tidak ada, kontak Admin.

**Q: Permohonan saya stuck di satu status.**
A: Lihat di halaman detail → Riwayat untuk status terkini. Kalau lebih dari 7 hari hari tanpa update, kontak Admin atau OPD yang memegang antrian (lihat sidebar status).

**Q: Apakah data DTSEN bisa di-download ulang setelah laporan?**
A: Bisa, asal status permohonan = `SELESAI`. Berkas tersimpan di Supabase Storage; signed URL dibuat ulang setiap klik (expire 5 menit).
