import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke Portal DTSEN Bangkalan",
};

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl shadow-primary/5 backdrop-blur">
      <CardHeader className="space-y-1.5 text-center">
        <CardTitle className="text-2xl">Masuk ke Portal</CardTitle>
        <CardDescription>
          Akses dasbor permohonan dan pelaporan Data DTSEN.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/daftar" className="font-medium text-primary hover:underline">
            Daftar perangkat daerah
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
