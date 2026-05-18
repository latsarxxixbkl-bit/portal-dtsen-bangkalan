import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Archive, Database, FileText, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Backup Data" };

export default async function BackupDataPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [totalPermohonan, totalDokumen, totalBerkas, totalLaporan] =
    await Promise.all([
      prisma.permohonan.count(),
      prisma.dokumenPermohonan.count(),
      prisma.berkasDtsen.count(),
      prisma.laporanPemanfaatan.count(),
    ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Backup Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unduh semua data Permohonan dalam satu file ZIP. Setiap permohonan
          terpisah dalam folder masing-masing, lengkap dengan ringkasan PDF,
          dokumen persyaratan, berkas DTSEN, dan laporan pemanfaatan.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Permohonan"
          value={totalPermohonan}
          icon={<Database className="size-4" />}
        />
        <StatCard
          label="Dokumen Persyaratan"
          value={totalDokumen}
          icon={<FileText className="size-4" />}
        />
        <StatCard
          label="Berkas DTSEN"
          value={totalBerkas}
          icon={<Archive className="size-4" />}
        />
        <StatCard
          label="Laporan Pemanfaatan"
          value={totalLaporan}
          icon={<ShieldCheck className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unduh Backup Lengkap</CardTitle>
          <CardDescription>
            Proses backup men-stream langsung ke browser. Untuk data besar,
            jangan tutup tab sampai unduhan selesai.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Isi file ZIP per permohonan:</p>
            <ul className="mt-2 space-y-1.5 pl-4">
              <li className="list-disc">
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                  ringkasan.pdf
                </code>{" "}
                — isian form + audit trail
              </li>
              <li className="list-disc">
                4 dokumen persyaratan (Surat Permintaan, KAK, Pakta Integritas, NDA)
              </li>
              <li className="list-disc">
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                  berkas-dtsen_*.pdf
                </code>{" "}
                — berkas final Dinsos (jika sudah ada)
              </li>
              <li className="list-disc">
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                  laporan/*.pdf
                </code>{" "}
                — lampiran laporan pemanfaatan (jika sudah ada)
              </li>
            </ul>
          </div>

          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href="/api/admin/backup" download>
              <Archive className="me-2 size-4" />
              Unduh Semua Data (ZIP)
            </a>
          </Button>

          <p className="text-xs text-muted-foreground">
            File ZIP berisi data sensitif. Simpan di lokasi aman dan jangan
            disebarluaskan ke pihak yang tidak berkepentingan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs uppercase tracking-wide">{label}</span>
        </div>
        <p className="mt-2 text-3xl font-semibold">{value.toLocaleString("id-ID")}</p>
      </CardContent>
    </Card>
  );
}
