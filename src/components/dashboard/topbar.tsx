"use client";

import { LogOut, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { logoutAction } from "@/lib/auth/actions";

import { DashboardSidebar } from "./sidebar";
import type { NavSection } from "./nav-config";

export function DashboardTopbar({
  sections,
  user,
  pageTitle,
}: {
  sections: NavSection[];
  user: {
    nama: string;
    role: "PEMOHON" | "VERIFIKATOR" | "EWALI_DATA" | "PENGELOLA_DTSEN" | "ADMIN";
    opdNama: string | null;
  };
  pageTitle?: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buka menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Navigasi Portal DTSEN Bangkalan</SheetDescription>
            </SheetHeader>
            <DashboardSidebar sections={sections} user={user} />
          </SheetContent>
        </Sheet>
        <div className="text-sm font-medium text-muted-foreground">{pageTitle ?? "Dashboard"}</div>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="me-1.5 size-4" /> Keluar
          </Button>
        </form>
      </div>
    </header>
  );
}
