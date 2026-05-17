/**
 * Inisialisasi 3 bucket Supabase Storage (privat) untuk Portal DTSEN Bangkalan.
 * Jalankan sekali setelah project Supabase dibuat:
 *   npx tsx scripts/init-storage.ts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { ensureBuckets, BUCKETS } from "../src/lib/storage";

async function main() {
  console.log("→ Memastikan bucket Supabase Storage tersedia…");
  await ensureBuckets();
  console.log("✓ Bucket privat siap:", Object.values(BUCKETS).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
