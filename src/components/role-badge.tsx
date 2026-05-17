import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ROLES } from "@/lib/constants";

const ROLE_COLORS: Record<keyof typeof ROLES, string> = {
  PEMOHON: "bg-info/10 text-info border-info/30",
  VERIFIKATOR: "bg-primary/10 text-primary border-primary/30",
  EWALI_DATA: "bg-accent/30 text-accent-foreground border-accent",
  PENGELOLA_DTSEN: "bg-success/10 text-success border-success/30",
  ADMIN: "bg-warning/15 text-warning-foreground border-warning/40",
};

export function RoleBadge({
  role,
  className,
}: {
  role: keyof typeof ROLES;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-0.5 text-[11px]", ROLE_COLORS[role], className)}
    >
      {ROLES[role]}
    </Badge>
  );
}
