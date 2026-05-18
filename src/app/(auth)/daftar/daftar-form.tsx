"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { daftarAction, type AuthState } from "@/lib/auth/actions";

type OpdOption = { id: string; nama: string };

export function DaftarForm({ opdList }: { opdList: OpdOption[] }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    daftarAction,
    undefined,
  );
  const [opdId, setOpdId] = useState<string>("");

  return (
    <form action={formAction} className="space-y-4">
      {state?.ok === false && (
        <Alert variant="destructive">
          <AlertTitle>Pendaftaran gagal</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.ok === true && (
        <Alert>
          <AlertTitle>Pendaftaran berhasil</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nama">Nama lengkap</Label>
          <Input id="nama" name="nama" required autoComplete="name" placeholder="Mis. Andi Surya" />
          {state?.ok === false && state.fieldErrors?.nama && (
            <p className="text-xs text-destructive">{state.fieldErrors.nama[0]}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">Email dinas</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            required
            autoComplete="email"
            placeholder="nama@opd.bangkalankab.go.id"
          />
          {state?.ok === false && state.fieldErrors?.email && (
            <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="opd">Perangkat Daerah</Label>
          <Select value={opdId} onValueChange={setOpdId} name="opdId" required>
            <SelectTrigger id="opd" className="w-full">
              <SelectValue placeholder={opdList.length ? "Pilih OPD…" : "Belum ada OPD terdaftar — hubungi admin"} />
            </SelectTrigger>
            <SelectContent>
              {opdList.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Fallback hidden input so the form submission includes opdId even if shadcn's Select native input is overridden */}
          <input type="hidden" name="opdId" value={opdId} />
          {state?.ok === false && state.fieldErrors?.opdId && (
            <p className="text-xs text-destructive">{state.fieldErrors.opdId[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nip">NIP (opsional)</Label>
          <Input id="nip" name="nip" inputMode="numeric" autoComplete="off" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jabatan">Jabatan (opsional)</Label>
          <Input id="jabatan" name="jabatan" autoComplete="organization-title" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="noHp">No. HP (opsional)</Label>
          <Input id="noHp" name="noHp" inputMode="tel" autoComplete="tel" placeholder="0812xxxxxxxx" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          {state?.ok === false && state.fieldErrors?.password && (
            <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          {state?.ok === false && state.fieldErrors?.confirmPassword && (
            <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full h-10" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="me-2 size-4 animate-spin" /> Memproses…
          </>
        ) : (
          <>
            <UserPlus className="me-2 size-4" /> Daftar Akun
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Dengan mendaftar, Anda menyetujui ketentuan penggunaan Portal DTSEN Bangkalan.
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
