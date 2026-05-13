"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock3, FileText, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { STATUS_LAPORAN_LABEL } from "@/lib/constants";

const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export type EligibleItem = {
  permohonanId: string;
  judul: string;
  nomorSurat: string | null;
  laporanId: string;
  laporanStatus: keyof typeof STATUS_LAPORAN_LABEL;
  deadlineAt: Date;
};

export function TambahPelaporanButton({ items }: { items: EligibleItem[] }) {
  const [open, setOpen] = useState(false);
  const now = new Date();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="laporan-tambah-trigger">
          <Plus className="me-2 size-4" /> Tambah Pelaporan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Laporan Pemanfaatan</DialogTitle>
          <DialogDescription>
            Pilih permohonan yang sudah menerima Berkas DTSEN dari Dinas Sosial. Klik untuk membuka form
            pelaporan & mengunggah PDF pendukung.
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="rounded-md border bg-muted/40 px-4 py-8 text-center">
            <FileText className="mx-auto mb-2 size-8 text-muted-foreground" />
            <div className="text-sm font-medium">Belum ada permohonan siap dilaporkan</div>
            <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
              Tombol ini akan menampilkan permohonan Kak yang sudah diserahi Berkas DTSEN oleh Pengelola DTSEN
              (Dinas Sosial). Laporan otomatis dibuat saat berkas diserahkan, dengan deadline 30 hari.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link href="/dashboard/permohonan">Lihat status permohonan saya</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2" data-testid="laporan-eligible-list">
            {items.map((it) => {
              const sisaHari = Math.ceil(
                (new Date(it.deadlineAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );
              const overdue = sisaHari < 0;
              return (
                <Link
                  key={it.permohonanId}
                  href={`/dashboard/laporan/${it.laporanId}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg border bg-card p-3 transition-colors hover:bg-secondary/60"
                  data-testid={`laporan-eligible-${it.permohonanId}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-sm font-medium">{it.judul}</div>
                      {it.nomorSurat && (
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {it.nomorSurat}
                        </div>
                      )}
                    </div>
                    <Badge variant={it.laporanStatus === "MENUNGGAK" ? "destructive" : "secondary"}>
                      {STATUS_LAPORAN_LABEL[it.laporanStatus] ?? it.laporanStatus}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={overdue ? "text-destructive" : "text-muted-foreground"}>
                      <Clock3 className="me-1 inline size-3 -mt-0.5" />
                      Deadline {fmtDate.format(new Date(it.deadlineAt))}{" "}
                      ({overdue ? `telat ${Math.abs(sisaHari)} hari` : `sisa ${sisaHari} hari`})
                    </span>
                    <span className="font-medium text-primary">Isi Form →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
