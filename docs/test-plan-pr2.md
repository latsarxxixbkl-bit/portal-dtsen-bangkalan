# Test Plan — PR #2: Template Surat + Backup Data + Polish UI

**Goal**: Prove the 3 user-visible deliverables actually work end-to-end against the local dev build (`http://localhost:3000`, branch `devin/1779072257-template-backup-polish`, commit `ce6abbc`).

**Out of scope**: Re-running Day 9 UAT (already done & PASS); regression on existing Permohonan/Pelaporan flows.

---

## Test 1 — "It should let Pemohon download a usable Template Surat PDF"

**Reason it could regress if broken**: The `/api/template-surat/[type]` route uses `pdf-lib` at runtime; if the generator throws, the page would show a card list but the download endpoint would 500.

**Steps**
1. Login as `latsar.xxix.bkl+pemohon@gmail.com` / `Test12345!`.
2. Open sidebar group **"Dokumen"** → click **"Template Surat"**.
3. On `/dashboard/template-surat`, confirm exactly **5 cards** rendered.
4. Click **"Unduh Template"** on the **"Surat Permintaan Data DTSEN"** card.
5. Save the downloaded file, open with `pdfinfo` and `pdftotext` from shell.

**Pass criteria** (all must hold)
- HTTP response: `200 OK`, `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="template-surat-permintaan-data-dtsen.pdf"`
- File saved is a valid PDF (`pdfinfo` succeeds; reports ≥ 1 page).
- Extracted text contains the literal phrase **"PEMERINTAH KABUPATEN BANGKALAN"** (proves the kop block was rendered, not just a blank PDF).
- Extracted text contains **"Surat Permintaan"** OR **"DTSEN"** (proves correct template was generated, not a different one).

**Fail signature**: 500 from API; PDF parser fails; missing kop block; or wrong template content.

---

## Test 2 — "It should let ADMIN download a ZIP containing real permohonan data"

**Reason it could regress if broken**: Backup route streams via `archiver` (CJS, marked `serverExternalPackages`), calls `downloadFileBuffer` against Supabase storage, and generates `ringkasan.pdf` per permohonan. Any step can silently produce an empty/0-byte ZIP if mis-wired.

**Steps**
1. Logout, login as `latsar.xxix.bkl+admin@gmail.com` / `Test12345!`.
2. Sidebar group **"Dokumen & Sistem"** → click **"Backup Data"**.
3. Confirm stat cards show **Permohonan ≥ 1** (UAT created at least 1).
4. Click **"Unduh Semua Data (ZIP)"**.
5. Save file as `/tmp/backup.zip`. From shell, run `unzip -l /tmp/backup.zip` and `unzip -p /tmp/backup.zip '*/README.txt'`.

**Pass criteria**
- HTTP response: `200 OK`, `Content-Type: application/zip`, `Content-Disposition` starts with `attachment; filename="backup-portal-dtsen-`.
- `unzip -l` shows ≥ 1 top-level folder `backup-portal-dtsen-<stamp>/`.
- That folder contains a `README.txt` whose first line is exactly **"Portal DTSEN Bangkalan — Backup Data"**.
- It contains **at least 1 permohonan sub-folder** (named with the nomor surat or id prefix).
- Each permohonan sub-folder contains a `ringkasan.pdf` (size > 0) and at least one of `01-surat-permintaan_*.pdf`, `02-kerangka-acuan-kerja_*.pdf`, `03-pakta-integritas_*.pdf`, `04-nda_*.pdf`.
- Open `ringkasan.pdf` with `pdftotext`; extracted text contains the permohonan's `nomorSurat` value visible in dashboard.

**Fail signature**: 4xx/5xx; ZIP under 1 KB; no permohonan sub-folder; `ringkasan.pdf` missing/empty; or text inside `ringkasan.pdf` doesn't match the actual permohonan number.

---

## Test 3 — "It should enforce RBAC on the Backup endpoint"

**Reason it could regress if broken**: The page does `requireUser()` + `redirect("/dashboard")` if not admin. If the redirect were missing in the API route, a non-admin could exfiltrate everything.

**Steps**
1. Still logged in as ADMIN, in another browser window, login as `latsar.xxix.bkl+pemohon@gmail.com`.
2. As Pemohon, navigate directly to `http://localhost:3000/api/admin/backup`.

**Pass criteria**
- Browser is **redirected to `/dashboard`** (not a ZIP download).
- The Pemohon's sidebar does **not** contain a "Backup Data" link (`/dashboard/admin/backup`).

**Fail signature**: ZIP file downloads OR sidebar shows the Backup Data link.

---

## Test 4 — "It should no longer say 'Kak' and should render in Arial with premium polish"

**Reason it could regress if broken**: Mass copy-edit could miss instances; CSS variable changes could fail to override Tailwind defaults; gradient/glass utilities might not be wired.

**Steps**
1. As Pemohon, open `/dashboard`.
2. Capture screenshot.
3. Open DevTools → Elements → click `<body>` → Computed → inspect `font-family`.
4. Search the visible text on screen for the literal substring `Kak`.

**Pass criteria**
- The visible greeting reads **"Selamat datang, <name>"** — `Kak` not present anywhere on screen.
- Computed `font-family` on body **starts with `Arial`**, followed by `Helvetica, "Liberation Sans", system-ui, sans-serif`.
- Dashboard hero block has a visible **blue→darker-blue gradient** background (not a flat white/gray card).
- StatCards visibly **lift on hover** (shadow grows / element translates upward).

**Fail signature**: any "Kak" still visible on dashboard / sidebar / form; body font-family starts with anything other than Arial; hero is a flat card; cards do not lift on hover.

---

## Recording strategy

One continuous recording covering Test 1 → 2 → 3 → 4 in order. Annotate `test_start` per test, `assertion` after each pass criterion is verified. Shell commands for `unzip`/`pdftotext` will be run in parallel; outputs captured as text evidence and shown in the report (not in the recording, since the report is text + screenshots).
