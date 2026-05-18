import type { Metadata } from "next";
import Link from "next/link";
import { Download, FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/session";
import { fetchPermohonanList } from "@/lib/permohonan/queries";
import { statusBadgeVariant } from "@/lib/workflow/permohonan";
import { STATUS_PERMOHONAN_LABEL } from "@/lib/constants";

export const metadata: Metadata = { title: "Permohonan" };
export const dynamic = "force-dynamic";

const fmtDate = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function PermohonanListPage() {
  const user = await requireUser();
  const list = await fetchPermohonanList({
    userId: user.id,
    role: user.role,
    opdId: user.opdId,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daftar Permohonan</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === "PEMOHON"
              ? "Permohonan yang Anda ajukan."
              : "Permohonan yang relevan untuk peran Anda."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {list.length > 0 && (
            <Button asChild variant="outline">
              <a href="/api/export/permohonan" download>
                <Download className="me-2 size-4" /> Export CSV
              </a>
            </Button>
          )}
          {user.role === "PEMOHON" && (
            <Button asChild>
              <Link href="/dashboard/permohonan/baru">
                <FilePlus2 className="me-2 size-4" /> Permohonan Baru
              </Link>
            </Button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <FilePlus2 className="size-6" />
            </div>
            <div>
              <div className="text-base font-medium">Belum ada permohonan</div>
              <div className="text-sm text-muted-foreground">
                {user.role === "PEMOHON"
                  ? "Ajukan permohonan pertama dengan klik tombol di atas."
                  : "Tidak ada permohonan dalam antrian peran Anda saat ini."}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Nomor / Tanggal</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>OPD Pemohon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell className="align-top">
                    <div className="text-sm font-medium">{p.nomorSurat ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate.format(p.diajukanAt ?? p.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="align-top max-w-[420px]">
                    <div className="line-clamp-2 text-sm font-medium">{p.judul}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Oleh {p.pemohon.nama} · {p._count.dokumen} dokumen
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <span className="text-sm">{p.opdPemohon.nama}</span>
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={statusBadgeVariant(p.status)}>
                      {STATUS_PERMOHONAN_LABEL[p.status] ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/permohonan/${p.id}`}>Buka</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
