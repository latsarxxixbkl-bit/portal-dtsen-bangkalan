"use client";

import { useActionState } from "react";
import { Loader2, Save } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfil, type ProfilFormState } from "@/lib/profil/actions";

export function ProfilForm({
  user,
}: {
  user: { nama: string; jabatan: string | null; nip: string | null; noHp: string | null };
}) {
  const [state, formAction, pending] = useActionState<ProfilFormState, FormData>(
    updateProfil,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.ok && (
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="nama">Nama Lengkap</Label>
        <Input id="nama" name="nama" required defaultValue={user.nama} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="jabatan">Jabatan</Label>
          <Input id="jabatan" name="jabatan" defaultValue={user.jabatan ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nip">NIP</Label>
          <Input id="nip" name="nip" defaultValue={user.nip ?? ""} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="noHp">No HP</Label>
        <Input id="noHp" name="noHp" defaultValue={user.noHp ?? ""} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <><Loader2 className="me-2 size-4 animate-spin" /> Menyimpan…</>
          ) : (
            <><Save className="me-2 size-4" /> Simpan</>
          )}
        </Button>
      </div>
    </form>
  );
}
