import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

import { DaftarForm } from "./daftar-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Daftar akun perangkat daerah di Portal DTSEN Bangkalan",
};

export default async function DaftarPage() {
  const opd = await prisma.opd.findMany({
    orderBy: { nama: "asc" },
    select: { id: true, nama: true },
  });

  return (
    <Card className="w-full max-w-2xl border-border/60 shadow-xl shadow-primary/5 backdrop-blur">
      <CardHeader className="space-y-1.5 text-center">
        <CardTitle className="text-2xl">Daftar Akun Perangkat Daerah</CardTitle>
        <CardDescription>
          Daftarkan diri Anda sebagai Pemohon. Akun akan terhubung otomatis dengan OPD yang dipilih.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DaftarForm opdList={opd} />
      </CardContent>
    </Card>
  );
}
