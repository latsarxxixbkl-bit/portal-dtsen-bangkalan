import type { Metadata } from "next";
import Link from "next/link";
import { Bell, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import { MarkAllReadButton } from "./mark-all-read";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifikasi" };

const fmtDateTime = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function NotifikasiPage() {
  const user = await requireUser();
  const items = await prisma.notifikasi.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = items.filter((n) => !n.dibacaAt).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifikasi</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} belum dibaca` : "Semua sudah dibaca"}.
          </p>
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Bell className="size-6" />
            </div>
            <div className="text-base font-medium">Belum ada notifikasi</div>
            <div className="text-sm text-muted-foreground">
              Notifikasi pembaruan permohonan & pelaporan akan muncul di sini.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y">
            {items.map((n) => (
              <li
                key={n.id}
                className={`flex gap-3 px-5 py-4 ${n.dibacaAt ? "opacity-70" : "bg-primary/[0.03]"}`}
              >
                <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  {n.dibacaAt ? <MailCheck className="size-4" /> : <Bell className="size-4 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{n.judul}</div>
                    <div className="text-xs text-muted-foreground">{fmtDateTime.format(n.createdAt)}</div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.isi}</p>
                  {n.linkUrl && (
                    <Button
                      asChild
                      size="sm"
                      variant="link"
                      className="mt-1 h-auto p-0 text-xs"
                    >
                      <Link href={n.linkUrl.replace(/^https?:\/\/[^/]+/, "")}>Buka →</Link>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
