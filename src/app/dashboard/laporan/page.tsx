import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/session";
import { fetchLaporanList } from "@/lib/laporan/queries";
import { laporanBadgeVariant } from "@/lib/workflow/laporan";
import { STATUS_LAPORAN_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "Laporan Pemanfaatan" };
export const dynamic = "force-dynamic";

const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function LaporanListPage() {
  const user = await requireUser();
  const list = await fetchLaporanList({ userId: user.id, role: user.role });
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Laporan Pemanfaatan</h1>
        <p className="text-sm text-muted-foreground">
          {user.role === "PEMOHON"
            ? "Laporan yang harus Kak kirim setelah menerima data DTSEN."
            : "Laporan pemanfaatan data DTSEN dari seluruh OPD."}
        </p>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <FileText className="size-6" />
            </div>
            <div className="text-base font-medium">Belum ada laporan</div>
            <div className="text-sm text-muted-foreground">
              Laporan dibuat otomatis setelah Berkas DTSEN diserahkan ke OPD pemohon.
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permohonan</TableHead>
                <TableHead>Pemohon / OPD</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((l) => {
                const sisaHari = Math.ceil(
                  (l.deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                );
                const overdue = sisaHari < 0 && l.status !== "DISETUJUI";
                return (
                  <TableRow key={l.id}>
                    <TableCell className="align-top max-w-[360px]">
                      <div className="line-clamp-2 text-sm font-medium">
                        {l.permohonan.judul}
                      </div>
                      {l.permohonan.nomorSurat && (
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {l.permohonan.nomorSurat}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-sm">{l.pelapor.nama}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.pelapor.opd?.nama}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-sm">{fmtDate.format(l.deadlineAt)}</div>
                      <div
                        className={`text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        <Clock3 className="me-1 inline size-3 -mt-0.5" />
                        {overdue
                          ? `Telat ${Math.abs(sisaHari)} hari`
                          : sisaHari === 0
                            ? "Hari ini"
                            : `Sisa ${sisaHari} hari`}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={laporanBadgeVariant(l.status)}>
                        {STATUS_LAPORAN_LABEL[l.status] ?? l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/laporan/${l.id}`}>Buka</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
