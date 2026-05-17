import type { ReactNode } from "react";
import Link from "next/link";

import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] bg-gradient-to-b from-primary/10 via-background to-background" />

      <header className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <BrandMark className="size-7" />
          <span className="hidden sm:inline">Portal DTSEN Bangkalan</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </div>

      <footer className="border-t bg-secondary/20 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Pemerintah Kabupaten Bangkalan
      </footer>
    </main>
  );
}
