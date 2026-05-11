import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { navForRole } from "@/components/dashboard/nav-config";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const sections = navForRole(user.role);
  const unreadCount = await prisma.notifikasi.count({
    where: { userId: user.id, dibacaAt: null },
  });

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
      <div className="hidden h-screen sticky top-0 md:flex">
        <DashboardSidebar sections={sections} user={user} />
      </div>
      <div className="flex min-h-screen flex-col">
        <DashboardTopbar sections={sections} user={user} unreadCount={unreadCount} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
