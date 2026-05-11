import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";

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
import { ROLES } from "@/lib/constants";

import { InviteUserDialog } from "./invite-dialog";
import { UserRowActions } from "./row-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kelola Pengguna" };

export default async function AdminUsersPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [users, opdList] = await Promise.all([
    prisma.user.findMany({
      include: { opd: { select: { id: true, nama: true } } },
      orderBy: [{ isActive: "desc" }, { nama: "asc" }],
      take: 200,
    }),
    prisma.opd.findMany({
      where: { isActive: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, kodeOpd: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kelola Pengguna</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} pengguna · undang anggota baru, atur peran & OPD.
          </p>
        </div>
        <InviteUserDialog opdList={opdList}>
          <span className="inline-flex">
            <UserPlus className="me-2 size-4" /> Undang Pengguna
          </span>
        </InviteUserDialog>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama / Email</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>OPD</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="align-top">
                  <div className="text-sm font-medium">{u.nama}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                  {u.jabatan && (
                    <div className="text-xs text-muted-foreground italic">{u.jabatan}</div>
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Badge variant="outline" className="font-normal">
                    {ROLES[u.role]}
                  </Badge>
                </TableCell>
                <TableCell className="align-top text-sm">
                  {u.opd?.nama ?? <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="align-top">
                  {u.isActive ? (
                    <Badge className="bg-success/15 text-success border-success/30">Aktif</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Nonaktif
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="align-top text-right">
                  <UserRowActions
                    user={{
                      id: u.id,
                      nama: u.nama,
                      email: u.email,
                      role: u.role,
                      opdId: u.opdId,
                      jabatan: u.jabatan,
                      nip: u.nip,
                      noHp: u.noHp,
                      isActive: u.isActive,
                    }}
                    opdList={opdList}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
