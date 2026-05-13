"use client";

import { MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Tombol mengambang "Tanya Bapperida" — buka WhatsApp ke nomor Bapperida.
 *
 * Ganti `BAPPERIDA_WA_NUMBER` di bawah dengan nomor WA resmi Bapperida Bangkalan
 * (format internasional tanpa "+", contoh: 6285XXXXXXXXX).
 */
const BAPPERIDA_WA_NUMBER = process.env.NEXT_PUBLIC_BAPPERIDA_WA ?? "6285XXXXXXXXX";
const DEFAULT_MESSAGE =
  "Halo Bapperida Bangkalan, saya ingin bertanya seputar Portal DTSEN.";

export function TanyaBapperidaFab({
  className,
  message = DEFAULT_MESSAGE,
}: {
  className?: string;
  message?: string;
}) {
  const href = `https://wa.me/${BAPPERIDA_WA_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="tanya-bapperida-fab"
      aria-label="Tanya Bapperida via WhatsApp"
      className={cn(
        "group fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-600/30 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6",
        className,
      )}
    >
      <MessageCircle className="size-5 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">Tanya Bapperida</span>
      <span className="sm:hidden">Tanya</span>
    </a>
  );
}
