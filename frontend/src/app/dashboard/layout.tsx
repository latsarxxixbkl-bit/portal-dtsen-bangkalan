import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { TanyaBapperidaFab } from "@/components/tanya-bapperida-fab";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const unreadCount = await prisma.notifikasi.count({
    where: { userId: user.id, dibacaAt: null },
  });

  const navUser = {
    nama: user.nama,
    role: user.role,
    opdNama: user.opdNama,
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
      <div className="hidden h-screen sticky top-0 md:flex">
        <DashboardSidebar user={navUser} />
      </div>
      <div className="flex min-h-screen flex-col">
        <DashboardTopbar user={navUser} unreadCount={unreadCount} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <TanyaBapperidaFab />
    </div>
  );
}
