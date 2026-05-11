// Promosikan user (by email) menjadi ADMIN.
// Run: npx tsx scripts/promote-admin.ts <email>
//
// Berguna untuk bootstrap admin pertama setelah deploy (akun yang sudah daftar
// akan diubah role-nya menjadi ADMIN supaya bisa mengelola pengguna lain).
import { prisma } from "../src/lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/promote-admin.ts <email>");
    process.exit(1);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User dengan email ${email} tidak ditemukan.`);
    process.exit(2);
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN", isActive: true },
  });
  console.log(`✓ ${updated.nama} (${updated.email}) sekarang ADMIN.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(99);
  })
  .finally(() => prisma.$disconnect());
