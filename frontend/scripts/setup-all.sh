#!/usr/bin/env bash
# Portal DTSEN Bangkalan — Setup script
#
# Jalankan setelah .env.local diisi dengan credential Supabase real:
#   bash scripts/setup-all.sh
#
# Yang dilakukan:
#   1. Validasi .env.local
#   2. Push Prisma schema ke database Supabase
#   3. Seed master OPD (49 OPD + kode surat)
#   4. Bikin 3 bucket Supabase Storage (privat)
#   5. (Opsional) UAT setup: bikin 5 test accounts dengan auto-confirm

set -e

cd "$(dirname "$0")/.."

echo "=== Portal DTSEN Bangkalan Setup ==="
echo ""

# 1. Cek .env.local
if [ ! -f .env.local ]; then
  echo "❌ .env.local tidak ada. Copy .env.example dulu lalu isi credentialnya."
  exit 1
fi

# 2. Cek nilai-nilai krusial tidak placeholder
if grep -qE "(REPLACE_WITH|REPLACE_PASSWORD|re_placeholder)" .env.local; then
  echo "❌ .env.local masih punya placeholder. Isi credential real dulu:"
  grep -E "(REPLACE|placeholder)" .env.local
  exit 1
fi

echo "→ Step 1/4: Prisma db push (sync schema ke Supabase)…"
npx prisma db push

echo ""
echo "→ Step 2/4: Generate Prisma Client…"
npx prisma generate

echo ""
echo "→ Step 3/4: Seed master OPD…"
npx tsx prisma/seed.ts

echo ""
echo "→ Step 4/4: Init Supabase Storage buckets…"
npx tsx scripts/init-storage.ts

echo ""
echo "=== ✓ Setup BERHASIL ==="
echo ""
echo "Langkah selanjutnya:"
echo "  • Daftar akun pertama via UI di http://localhost:3000/daftar"
echo "  • Promote ke ADMIN:  npx tsx scripts/promote-admin.ts <email>"
echo "  • (Opsional UAT)     npx tsx scripts/uat-setup.ts  (bikin 5 test users auto-confirm)"
echo "  • Restart frontend:  sudo supervisorctl restart frontend"
echo ""
