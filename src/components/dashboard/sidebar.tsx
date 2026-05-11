"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrandLockup } from "@/components/brand";
import { RoleBadge } from "@/components/role-badge";
import type { NavSection } from "./nav-config";

export function DashboardSidebar({
  sections,
  user,
}: {
  sections: NavSection[];
  user: {
    nama: string;
    role: "PEMOHON" | "VERIFIKATOR" | "EWALI_DATA" | "PENGELOLA_DTSEN" | "ADMIN";
    opdNama: string | null;
  };
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col gap-4 border-e bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrandLockup subtitle="DTSEN Bangkalan" />
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-5 pb-4">
          {sections.map((s) => (
            <div key={s.title} className="space-y-1">
              <div className="px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {s.title}
              </div>
              <ul className="space-y-0.5">
                {s.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <item.icon className={cn("size-4", active ? "" : "text-muted-foreground group-hover:text-foreground")} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="mx-3 mb-3 rounded-lg border bg-card/60 p-3 text-card-foreground">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user.nama}</div>
            <div className="truncate text-xs text-muted-foreground">{user.opdNama ?? "—"}</div>
          </div>
          <RoleBadge role={user.role} />
        </div>
      </div>
    </aside>
  );
}
