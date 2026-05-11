import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

import { PermohonanForm } from "./form";

export const metadata: Metadata = { title: "Permohonan Baru" };

export default async function PermohonanBaruPage() {
  const user = await requireUser();

  if (user.role !== "PEMOHON" && user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl">
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Tidak diizinkan</AlertTitle>
          <AlertDescription>Hanya peran Pemohon yang bisa mengajukan permohonan.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user.opdId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard"><ArrowLeft className="me-1 size-4" /> Dashboard</Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>OPD belum ditetapkan</AlertTitle>
          <AlertDescription>
            Akun Kak belum terhubung ke perangkat daerah. Hubungi admin untuk menetapkan OPD sebelum mengajukan permohonan.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ms-3">
          <Link href="/dashboard/permohonan"><ArrowLeft className="me-1 size-4" /> Kembali</Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Permohonan Akses Data DTSEN</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lengkapi data permohonan dan unggah keempat dokumen wajib. Permohonan akan langsung diteruskan ke Verifikator Bapperida setelah dikirim.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sebagai: {user.nama}</CardTitle>
          <CardDescription>OPD Pemohon: {user.opdNama}</CardDescription>
        </CardHeader>
        <CardContent>
          <PermohonanForm />
        </CardContent>
      </Card>
    </div>
  );
}
