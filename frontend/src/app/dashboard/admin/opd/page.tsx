import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import { OpdDialog } from "./dialog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kelola OPD" };

export default async function AdminOpdPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");

  const opdList = await prisma.opd.findMany({
    orderBy: [{ isActive: "desc" }, { nama: "asc" }],
    include: { _count: { select: { users: true, permohonan: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kelola OPD</h1>
          <p className="text-sm text-muted-foreground">
            {opdList.length} OPD terdaftar di Kabupaten Bangkalan.
          </p>
        </div>
        <OpdDialog>
          <span className="inline-flex">
            <Plus className="me-2 size-4" /> Tambah OPD
          </span>
        </OpdDialog>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Kode</TableHead>
              <TableHead>Nama OPD</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-center">Pengguna</TableHead>
              <TableHead className="text-center">Permohonan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opdList.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs">{o.kodeOpd ?? "—"}</TableCell>
                <TableCell className="text-sm font-medium max-w-[420px]">
                  {o.nama}
                  {o.emailResmi && (
                    <div className="text-xs font-normal text-muted-foreground">
                      {o.emailResmi}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{o.jenis}</Badge>
                </TableCell>
                <TableCell className="text-center text-sm">{o._count.users}</TableCell>
                <TableCell className="text-center text-sm">{o._count.permohonan}</TableCell>
                <TableCell>
                  {o.isActive ? (
                    <Badge className="bg-success/15 text-success border-success/30">Aktif</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <OpdDialog
                    initial={{
                      id: o.id,
                      kodeOpd: o.kodeOpd,
                      nama: o.nama,
                      jenis: o.jenis,
                      alamat: o.alamat,
                      emailResmi: o.emailResmi,
                      isActive: o.isActive,
                    }}
                  >
                    Edit
                  </OpdDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
