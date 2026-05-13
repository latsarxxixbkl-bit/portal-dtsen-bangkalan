import Image from "next/image";

import { cn } from "@/lib/utils";

/** Logo Bapperida Kabupaten Bangkalan (PNG di /public/logo-bapperida.png). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-9 shrink-0 overflow-hidden rounded-md bg-white", className)}>
      <Image
        src="/logo-bapperida.png"
        alt="Logo Bapperida Kabupaten Bangkalan"
        fill
        sizes="64px"
        className="object-contain"
        priority
      />
    </div>
  );
}

export function BrandLockup({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="size-10" />
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight">Portal DTSEN</div>
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {subtitle ?? "Kabupaten Bangkalan"}
        </div>
      </div>
    </div>
  );
}
