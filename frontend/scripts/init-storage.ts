/**
 * Inisialisasi 3 bucket Supabase Storage (privat) untuk Portal DTSEN Bangkalan.
 * Jalankan sekali setelah project Supabase dibuat:
 *   npx tsx scripts/init-storage.ts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

async function main() {
  // Dynamic import AFTER dotenv load (env vars dibaca saat Supabase client init).
  const { ensureBuckets, BUCKETS } = await import("../src/lib/storage");

  console.log("→ Memastikan bucket Supabase Storage tersedia…");
  await ensureBuckets();
  console.log("✓ Bucket privat siap:", Object.values(BUCKETS).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
