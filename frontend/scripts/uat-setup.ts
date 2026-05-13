// UAT-only: confirm existing pemohon + create 4 test users (admin/verif/ewali/dinsos) with auto-confirm.
// NOT FOR PRODUCTION. Run: npx tsx scripts/uat-setup.ts
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const PASSWORD = "Test12345!";

type AccSeed = { email: string; nama: string; role: "PEMOHON" | "ADMIN" | "VERIFIKATOR" | "EWALI_DATA" | "PENGELOLA_DTSEN"; opdName: string };

const ACCOUNTS: AccSeed[] = [
  { email: "latsar.xxix.bkl+pemohon@gmail.com", nama: "Pemohon UAT", role: "PEMOHON", opdName: "Dinas Pendidikan" },
  { email: "latsar.xxix.bkl+admin@gmail.com", nama: "Admin UAT", role: "ADMIN", opdName: "Bapperida" },
  { email: "latsar.xxix.bkl+verif@gmail.com", nama: "Verifikator UAT", role: "VERIFIKATOR", opdName: "Bapperida" },
  { email: "latsar.xxix.bkl+ewali@gmail.com", nama: "EWali UAT", role: "EWALI_DATA", opdName: "Dinas Komunikasi dan Informatika" },
  { email: "latsar.xxix.bkl+dinsos@gmail.com", nama: "Dinsos UAT", role: "PENGELOLA_DTSEN", opdName: "Dinas Sosial" },
];

async function main() {
  // Dynamic imports AFTER dotenv load
  const { createClient } = await import("@supabase/supabase-js");
  const { prisma } = await import("../src/lib/prisma");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  async function findOpdId(name: string): Promise<string> {
    const opd = await prisma.opd.findFirst({ where: { nama: { contains: name } } });
    if (!opd) throw new Error(`OPD not found: ${name}`);
    return opd.id;
  }

  async function ensureUser(acc: AccSeed) {
    const opdId = await findOpdId(acc.opdName);

    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let authUser = list?.users.find((u) => u.email === acc.email);
    if (!authUser) {
      const { data, error } = await admin.auth.admin.createUser({
        email: acc.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { nama: acc.nama },
      });
      if (error) throw error;
      authUser = data.user!;
      console.log(`  + auth user created: ${acc.email}`);
    } else {
      if (!authUser.email_confirmed_at) {
        await admin.auth.admin.updateUserById(authUser.id, { email_confirm: true });
        console.log(`  ~ auth user confirmed: ${acc.email}`);
      } else {
        console.log(`  = auth user exists: ${acc.email}`);
      }
      await admin.auth.admin.updateUserById(authUser.id, { password: PASSWORD });
    }

    const existing = await prisma.user.findUnique({ where: { email: acc.email } });
    if (existing) {
      const upd = await prisma.user.update({
        where: { email: acc.email },
        data: {
          authUserId: authUser.id,
          nama: acc.nama,
          role: acc.role,
          opdId: opdId,
          isActive: true,
        },
      });
      console.log(`  ~ prisma updated: ${upd.email} → role=${upd.role}, opd=${acc.opdName}`);
    } else {
      const cr = await prisma.user.create({
        data: {
          authUserId: authUser.id,
          email: acc.email,
          nama: acc.nama,
          role: acc.role,
          opdId: opdId,
          isActive: true,
        },
      });
      console.log(`  + prisma created: ${cr.email} → role=${cr.role}, opd=${acc.opdName}`);
    }
  }

  for (const acc of ACCOUNTS) {
    console.log(`\n[${acc.role}] ${acc.email}`);
    await ensureUser(acc);
  }
  console.log("\n✓ UAT setup complete. Password for all accounts: " + PASSWORD);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
