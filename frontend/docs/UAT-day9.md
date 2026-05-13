# Portal DTSEN Bangkalan — Day 9 UAT Test Plan

## Lingkup
Test plan ini membuktikan **primary end-to-end flow** dari portal DTSEN: Pemohon mengajukan permohonan data DTSEN → 4-tahap workflow review → Pengelola DTSEN upload Berkas → Laporan Pemanfaatan auto-create → dual review Laporan → status DISETUJUI.

## Lingkungan
- **Target**: local Next.js dev server di Devin VM (`http://localhost:3000`)
- **Backend**: Supabase project yang sama dengan deploy production (DB & Storage shared)
- **Alasan local, bukan preview**: Vercel Preview punya SSO gate (401) yang tidak bisa diakses tanpa login Vercel akun owner. Local dev = behavior identik karena fetch ke Supabase real.

## Akun Uji
Akan didaftarkan via UI `/daftar`. Jika Supabase auto-confirm email **ON** (default project baru), akun langsung bisa login. Jika **OFF**, daftarAction akan kembalikan pesan "Cek email" — fallback: tandai user sebagai confirmed lewat Supabase Admin API (script ad-hoc).

| Email alias | Peran target | OPD |
|---|---|---|
| `latsar.xxix.bkl+admin@gmail.com` | ADMIN | (apa saja) |
| `latsar.xxix.bkl+pemohon@gmail.com` | PEMOHON | Dinas Pendidikan |
| `latsar.xxix.bkl+verif@gmail.com` | VERIFIKATOR | Bapperida |
| `latsar.xxix.bkl+ewali@gmail.com` | EWALI_DATA | Diskominfo |
| `latsar.xxix.bkl+dinsos@gmail.com` | PENGELOLA_DTSEN | Dinas Sosial |

Admin pertama di-promote via `npx tsx scripts/promote-admin.ts <email>`. Sisa peran di-set via UI Admin → Pengguna oleh admin pertama.

## File Uji
4 PDF dummy generated dengan `printf '%PDF-1.4\n…\n%%EOF\n' > /tmp/dummy.pdf` (≈200 bytes, valid PDF magic bytes). Akan diberi nama berbeda saat upload sesuai dokumen.

---

## Test 1 — Daftar + Login Pemohon (smoke + RBAC)

### Steps
1. Buka `http://localhost:3000/` → klik "Daftar".
2. Isi form: nama "Pemohon UAT", email `+pemohon`, OPD "Dinas Pendidikan", password `Test12345!`.
3. Submit. 

### Pass criteria
- **Hard pass**: setelah submit, salah satu dari:
  - (a) auto-login → URL berubah ke `/dashboard` & sidebar menampilkan **PEMOHON** badge
  - (b) muncul alert "Pendaftaran berhasil. Cek email Kak untuk verifikasi sebelum masuk."
- Catatan eksak: jika (a), screenshot harus menunjukkan sidebar "Permohonan Baru". Jika (b), saya pakai workaround Supabase admin confirm.
- **Hard fail**: error 500, redirect 4xx, alert "Pendaftaran gagal" dengan pesan apa pun, atau form tidak submit.

### Mengapa adversarial
Jika `daftarAction` di-broken (mis. tidak insert ke tabel `users`), login berikutnya akan gagal — Test 2 langsung exposed.

---

## Test 2 — Pemohon Submit Permohonan (validation + state machine)

### Pre-state
Login sebagai `+pemohon` (confirmed via Test 1 atau workaround).

### Steps
1. Klik **"Permohonan Baru"** di sidebar.
2. **Submit form kosong** terlebih dahulu untuk uji validasi.
   - **Pass**: muncul setidaknya 1 inline error berisi salah satu dari: "Judul minimal 8 karakter", "Tujuan minimal 20 karakter", "Jenis data minimal 8 karakter", atau "Dokumen ... wajib diunggah".
   - **Fail**: form submit tanpa error / redirect ke dashboard / status DRAFT terbuat.
3. Isi field: 
   - Judul: "UAT — Permohonan Data DTSEN Bangkalan"
   - Tujuan: "Pengujian end-to-end alur permohonan data sosial untuk validasi sistem"
   - Jenis data: "Data sasaran intervensi kemiskinan ekstrem 2025"
4. Upload 4 PDF dummy ke 4 slot dokumen wajib.
5. Klik **"Ajukan Permohonan"**.

### Pass criteria
- Redirect ke `/dashboard/permohonan/{id}?baru=1`
- Header detail menampilkan:
  - Nomor surat format `001/PORTAL-DTSEN/{KODE_OPD}/{ROMAWI_BULAN}/{TAHUN}` (mis. `001/PORTAL-DTSEN/DISDIK/V/2026`)
  - Status badge **"VERIFIKATOR REVIEW"** (atau label terdekat)
- Section "Dokumen Wajib" menampilkan 4 row terisi.
- Section "Riwayat" menampilkan 1 entry: aksi **AJUKAN**, dari **DRAFT** ke **VERIFIKATOR_REVIEW**, actor = Pemohon UAT.

### Mengapa adversarial
- Jika nomor surat broken → format tidak match regex `^\d+/PORTAL-DTSEN/[A-Z0-9]+/[IVX]+/\d{4}$` → fail.
- Jika `prisma.dokumenPermohonan.create` broken → "Dokumen Wajib" kosong → fail.
- Jika `notifyTransition` broken → Test 3 (login Verifikator) tidak akan punya permohonan di antrian → cascade fail.

---

## Test 3 — Verifikator (Bapperida) Teruskan

### Pre-state
Admin login → buka **Pengguna** → undang `+verif`, set role **VERIFIKATOR**, OPD **Bapperida**. Setelah magic-link email muncul / auto-confirmed, login sebagai `+verif`.

### Steps
1. Login `+verif` → sidebar menampilkan badge **VERIFIKATOR**.
2. Buka **"Antrian Verifikasi"** (atau **"Permohonan"** filter status `VERIFIKATOR_REVIEW`).
3. Permohonan dari Test 2 harus muncul dengan judul "UAT — Permohonan Data DTSEN Bangkalan".
4. Klik untuk buka detail.
5. **Coba upload Berkas DTSEN sebagai Verifikator**: section "Unggah Berkas DTSEN" **TIDAK BOLEH** ada.
   - **Pass**: tombol upload tidak terlihat untuk role VERIFIKATOR.
   - **Fail**: section visible → RBAC bocor.
6. Klik **"Teruskan ke E-Wali"**.

### Pass criteria
- Toast/alert "Aksi 'Teruskan ke E-Wali' berhasil dijalankan."
- Status badge berubah ke **"EWALI REVIEW"**
- Riwayat dapat 1 entry baru: aksi **TERUSKAN**, dari **VERIFIKATOR_REVIEW** ke **EWALI_REVIEW**.

---

## Test 4 — E-Wali (Diskominfo) Teruskan

### Pre-state
Admin set `+ewali` role = **EWALI_DATA**, OPD = Diskominfo. Login `+ewali`.

### Steps
1. Buka detail permohonan UAT (cari via daftar Permohonan, status EWALI_REVIEW).
2. Klik **"Teruskan ke Pengelola DTSEN"**.

### Pass criteria
- Status berubah ke **"DTSEN REVIEW"**.
- Riwayat dapat entry baru aksi **TERUSKAN**, dari **EWALI_REVIEW** ke **DTSEN_REVIEW**.

---

## Test 5 — Pengelola DTSEN (Dinsos) Setujui + Upload Berkas (CRITICAL)

### Pre-state
Admin set `+dinsos` role = **PENGELOLA_DTSEN**, OPD = Dinas Sosial. Login `+dinsos`.

### Steps
1. Buka detail permohonan UAT (status DTSEN_REVIEW).
2. Klik **"Setujui Permohonan"**.
   - **Pass**: status berubah ke **"DISETUJUI"**, section "Unggah Berkas DTSEN" muncul.
3. Upload 1 PDF dummy via section "Unggah Berkas DTSEN" → klik **"Serahkan Berkas DTSEN"**.

### Pass criteria (CRITICAL ASSERTIONS)
- Status berubah ke **"SELESAI"**.
- Section "Berkas DTSEN" muncul dengan filename PDF yang baru di-upload.
- Riwayat tambah 2 entry: **SETUJUI** (DTSEN_REVIEW→DISETUJUI) + **UPLOAD_DATA** (DISETUJUI→SELESAI).
- **Auto-create laporan**: navigasi ke `/dashboard/laporan` (atau dashboard) sebagai `+pemohon` → muncul 1 record Laporan Pemanfaatan dengan:
  - Permohonan ref = "UAT — Permohonan Data DTSEN Bangkalan"
  - Status = **BELUM_DIKIRIM**
  - Deadline = tanggal hari ini + 30 hari (eksak)
  - Sisa hari = **"30 hari"** (atau 29 jika UAT lintas tengah malam UTC)

### Mengapa adversarial
- Jika `prisma.laporanPemanfaatan.create` di transaksi gagal silently → record laporan tidak ada → langkah Test 6 fail langsung.
- Jika `deadline = now + 30 days` computed salah (mis. 30 jam alih-alih hari) → deadline-nya hari ini → expected "30 hari" tidak match.
- Jika status SELESAI tidak ter-set di permohonan → riwayat tidak menambahkan UPLOAD_DATA → fail.

---

## Test 6 — Pemohon Kirim Laporan Pemanfaatan

### Pre-state
Login `+pemohon`.

### Steps
1. Buka **"Laporan Pemanfaatan"** di sidebar.
2. Klik record Laporan UAT (status BELUM_DIKIRIM).
3. Isi form:
   - Judul kegiatan: "UAT — Implementasi data sasaran kemiskinan"
   - Periode mulai/selesai (opsional)
   - Output kegiatan: "Daftar penerima manfaat program terverifikasi"
   - Manfaat data: "Akurasi sasaran intervensi naik dari estimasi ke data riil"
   - Jumlah record: 100
4. Klik **"Kirim Laporan"**.

### Pass criteria
- Toast sukses "Laporan terkirim" atau setara.
- Status laporan berubah ke **"REVIEW_BAPPERIDA"** (atau label "Review Bapperida").
- `dikirimAt` ter-set di record (verifikasi via Riwayat di halaman detail laporan).

---

## Test 7 — Bapperida Review + Dinsos Review (Dual Review)

### Steps
1. Login `+verif` → buka **"Review Laporan (Bapperida)"** → laporan UAT muncul.
2. Buka detail → klik **"Setujui"** (atau action button serupa).
   - **Pass**: status berubah ke **"REVIEW_DINSOS"**.
3. Login `+dinsos` → buka **"Review Laporan (Dinsos)"** → laporan UAT muncul.
4. Klik **"Setujui Final"**.
   - **Pass**: status berubah ke **"DISETUJUI"**.

### Pass criteria
- Status final laporan = **DISETUJUI**.
- Riwayat laporan punya 3+ entry: KIRIM, REVIEW_BAPPERIDA_SETUJUI, REVIEW_DINSOS_SETUJUI (atau label setara dari aksi enum).

---

## Test 8 — Cron Reminder (manual trigger)

### Steps
Run di shell Devin:
```bash
curl -sv -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/laporan-reminder
```

### Pass criteria
- HTTP 200 dengan body JSON `{ "sent": N, "checked": M }` atau struktur similar.
- Karena laporan UAT sudah DISETUJUI, **tidak** seharusnya kirim reminder untuk record itu. `sent` mungkin 0 atau berisi reminder untuk laporan lain.
- HTTP 401 jika `Authorization` salah/kosong (RBAC cron).

---

## Test 9 — Export CSV

### Steps
Login `+admin`.
1. Buka **Permohonan** → klik **"Export CSV"**.
2. Buka **Laporan Pemanfaatan** → klik **"Export CSV"**.

### Pass criteria
- File `permohonan-dtsen-{YYYY-MM-DD}.csv` ter-download (browser save dialog atau auto-save).
- Buka file: baris pertama = header CSV exact: `Nomor Surat,Judul,Status,OPD,Pemohon,Email,Jenis Data,Periode Awal,Periode Akhir,Diajukan,Diperbarui` (atau order similar). Header tidak garbled.
- Row data: permohonan UAT terlihat dengan status SELESAI.
- BOM `\ufeff` di awal file untuk Excel locale ID.

---

## Test 10 — RBAC negative test (PENTING)

### Steps
1. Login `+pemohon`.
2. Coba akses langsung URL `/dashboard/admin/users`.

### Pass criteria
- Redirect ke `/dashboard` atau halaman error "Akses ditolak".
- Sidebar tidak menampilkan menu **"Pengguna"** & **"OPD"** untuk role PEMOHON.

### Mengapa adversarial
Jika RBAC di proxy.ts atau page guard rusak, pemohon bisa lihat halaman admin → exposed.

---

## Reporting

- Setiap test = 1 annotation `test_start` + `assertion` (pass/fail/untested) di recording.
- Jika ada test yang gagal: jangan claim "success", marshal sebagai BLOCKER di pesan final.
- Setiap regression test akan diberi tag "Regression" — tidak ada di plan ini, semua test = primary flow.

## Catatan teknis

- Supabase email-confirm: jika default project ON, daftar via UI bisa diteruskan langsung. Jika OFF, perlu workaround:
  ```bash
  npx tsx scripts/confirm-user.ts <email>   # belum ada — buat ad-hoc jika perlu
  ```
- Browser: Chrome melalui computer-use tool. Recording start setelah semua akun siap & login.
- DB cleanup setelah UAT: opsional — pertahankan data UAT untuk handover demo Kak Adii.
