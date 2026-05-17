import { cn } from "@/lib/utils";

/** Inline SVG logo — gradient mark with "DT" wordmark. Lightweight, no external assets. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="brand-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="oklch(0.45 0.18 252)" />
          <stop offset="1" stopColor="oklch(0.55 0.18 305)" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#brand-grad)" />
      <path
        d="M14 16h8.5c4.7 0 8.5 3.6 8.5 8s-3.8 8-8.5 8H14V16Zm5 4v8h3.3c2.4 0 4.2-1.8 4.2-4s-1.8-4-4.2-4H19Z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="36" cy="14" r="3" fill="oklch(0.94 0.04 75)" />
    </svg>
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
      <BrandMark className="size-9 shrink-0" />
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight">Portal DTSEN</div>
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {subtitle ?? "Kabupaten Bangkalan"}
        </div>
      </div>
    </div>
  );
}
