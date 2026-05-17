import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { LupaPasswordForm } from "./form";

export const metadata: Metadata = {
  title: "Lupa Password",
};

export default function LupaPasswordPage() {
  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl shadow-primary/5 backdrop-blur">
      <CardHeader className="space-y-1.5 text-center">
        <CardTitle className="text-2xl">Lupa Password</CardTitle>
        <CardDescription>
          Masukkan email akun Kak — kami kirim link reset ke email tersebut.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LupaPasswordForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Kembali ke halaman masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
