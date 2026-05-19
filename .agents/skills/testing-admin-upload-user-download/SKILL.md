---
name: testing-admin-upload-user-download
description: Test features where one role uploads a file (PDF/DOCX/etc.) and another role downloads it. Use when verifying admin file upload → user file download flows, including byte-level verification, fallback behavior, and RBAC enforcement.
---

# Testing admin-upload → user-download features

This skill covers any feature where:
- An admin/elevated role uploads a binary file (PDF, DOCX, image, etc.) into Storage,
- A non-admin role downloads that file from a different page,
- And the API must serve the correct bytes (not a re-encoded or fallback version).

This covers Template Surat in this repo, but generalizes to: org logos, attachment templates, signature templates, branding assets, etc.

## Devin Secrets Needed

- `UAT_ADMIN_EMAIL` / `UAT_ADMIN_PASSWORD` — admin/elevated role test account (saved as org/user secret)
- `UAT_PEMOHON_EMAIL` / `UAT_PEMOHON_PASSWORD` — non-admin/end-user role test account (saved as org/user secret)
- All Supabase + DB secrets the app already needs (these are part of normal env setup)

If those don't exist, request them with the standard 3-option Skip / Session-only / Permanent prompt before starting.

## Core test scenarios (do all 3)

### Scenario 1: Admin uploads → user downloads → admin deletes → user falls back

1. Log in as admin in main window.
2. Upload a **fixture file with a unique marker string** (e.g. `ADMIN-FIXTURE-2026-PDF-MARKER`) so you can byte-verify later.
3. Open an **incognito window**, log in as user.
4. Trigger download from user UI.
5. **Byte-verify** the download contains the marker (NOT the auto-generated/default content). See "Byte verification" section below.
6. Switch back to admin → delete the uploaded file.
7. Reload user page → trigger download again.
8. **Byte-verify** the download now contains the fallback/auto-generated content (NOT the marker).

This is the most important scenario — it proves the upload, storage, signed URL, AND the fallback ordering all work.

### Scenario 2: Multi-format support (if applicable, e.g. PDF + DOCX)

- If admin can upload both PDF and DOCX (or other format pairs), test the DOCX path separately.
- DOCX usually has NO auto-generated fallback — so the negative state is "button disabled / 404 JSON".
- Verify: before admin upload, user sees disabled button + tooltip. After upload, button becomes enabled.
- Download DOCX and verify with `unzip -p file.docx word/document.xml | grep <marker>`.

### Scenario 3: RBAC negative test

- As the non-admin user, **paste the admin URL directly into the address bar** (don't navigate via sidebar — links can be conditionally hidden but the route may still serve content).
- Verify the URL bar ends up at a non-admin URL (e.g. `/dashboard`) — use `zoom` action on the URL bar region to read it precisely.
- Verify the rendered page header is NOT the admin page header.
- Verify the sidebar does NOT contain a link to the admin URL.

## Fixture creation

Create fixtures with **unique grep-able marker strings** so you can distinguish admin-uploaded bytes from auto-generated content at byte level.

### PDF fixture (use reportlab)

```python
from reportlab.pdfgen import canvas
c = canvas.Canvas("/tmp/tpl-fixtures/sample-admin-surat.pdf")
c.drawString(100, 750, "TEMPLATE ADMIN - SURAT PERMINTAAN DATA DTSEN")
c.drawString(100, 730, "PORTAL-DTSEN BANGKALAN - UPLOAD UJI COBA ADMIN")
c.drawString(100, 710, "Tanda pengenal unik: ADMIN-FIXTURE-2026-PDF-MARKER")
c.save()
```

### DOCX fixture (hand-crafted minimal zip — no python-docx dependency needed)

```python
import zipfile
doc_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n<w:body><w:p><w:r><w:t>TEMPLATE ADMIN - SURAT PERMINTAAN DTSEN - ADMIN-FIXTURE-2026-DOCX-MARKER</w:t></w:r></w:p></w:body>\n</w:document>'
content_types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
with zipfile.ZipFile("/tmp/tpl-fixtures/sample-admin-surat.docx", "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", content_types)
    z.writestr("_rels/.rels", rels)
    z.writestr("word/document.xml", doc_xml)
```

Resulting DOCX (~970 B) opens correctly in MS Word / LibreOffice / Pages.

## Byte verification

### PDF

```bash
# May need: sudo apt-get update && sudo apt-get install -y poppler-utils
pdftotext /tmp/downloads/admin.pdf - | grep -c "ADMIN-FIXTURE-2026-PDF-MARKER"  # Should print 1 for admin file, 0 for fallback
pdftotext /tmp/downloads/admin.pdf - | grep -c "PEMERINTAH KABUPATEN BANGKALAN"  # Inverse: 1 for fallback, 0 for admin file (replace with your auto-gen marker)
```

### DOCX

```bash
unzip -p /tmp/downloads/admin.docx word/document.xml | grep -c "ADMIN-FIXTURE-2026-DOCX-MARKER"
```

Also check file size matches the source fixture — if it differs, the server is re-encoding (which is usually a bug).

## Chrome download path pitfalls

On this VM, Chrome's default download path `~/Downloads` sometimes shows files like `.org.chromium.Chromium.XXXX` (incomplete sandbox stuff) instead of the actual file. **Fix:** when the Save dialog appears, type a path in `/tmp/downloads/` directly:

1. Triple-click the path field in Save dialog.
2. Type `/tmp/downloads/<filename>.<ext>`.
3. Click Save.

Files consistently land in `/tmp/downloads/` and are readable by shell tools. `mkdir -p /tmp/downloads` once at start of testing.

## RBAC redirect verification (URL bar reading)

When you type a URL in Chrome's address bar and the server returns a redirect, the URL bar updates but the visible page body may briefly show stale content. **Always verify via the URL bar, not body content.** Use `computer` action `zoom` on the URL bar region (approx top 80px) to read it precisely:

```
zoom region=[0, 30, 700, 80]
```

The HTML content returned by the computer tool can also come from a different Chrome window when multiple windows are open (e.g. admin + incognito-as-pemohon). The visible screenshot is the source of truth for what the user sees.

## Recording recipe

- Always record (browser UI testing).
- Maximize browser: `sudo apt-get install -y wmctrl 2>/dev/null; wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`. NEVER use `xdotool key super+Up` — tiles to half-screen on most WMs.
- Annotate: 1 `setup` at start, 1 `test_start` per scenario, 1 `assertion` per meaningful state change.
- Keep assertions <80 chars, consolidate related checks into single assertion.

## Common failure signatures to watch for

- User-downloaded file has filename of auto-generated default → API isn't reading the DB row for admin upload.
- User-downloaded file is the right name but content is wrong → Storage path mismatch (e.g. file uploaded to `surat_permintaan/foo.pdf` but API reads `SURAT_PERMINTAAN/foo.pdf`).
- DOCX downloads as PDF mime → API not respecting `?format=docx` query param.
- Fallback never fires after admin delete → DB row not actually deleted; check `select * from "TemplateSurat"` after delete.
- RBAC redirect works on sidebar but not direct URL paste → guard implemented in client component only, not server. Move to server-side `requireUser()` + `redirect()`.
