"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteUser, type AdminFormState } from "@/lib/admin/actions";

type Opd = { id: string; nama: string; kodeOpd: string | null };

export function InviteUserDialog({
  opdList,
  children,
}: {
  opdList: Opd[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [role, setRole] = React.useState<"PEMOHON" | "VERIFIKATOR" | "EWALI_DATA" | "PENGELOLA_DTSEN" | "ADMIN">("PEMOHON");
  const [opdId, setOpdId] = React.useState("");
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    inviteUser,
    undefined,
  );

  const wasOk = React.useRef(false);
  React.useEffect(() => {
    if (state?.ok && !wasOk.current) {
      wasOk.current = true;
      setOpen(false);
    }
    if (!state?.ok) wasOk.current = false;
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{children}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Undang Pengguna Baru</DialogTitle>
          <DialogDescription>
            Pengguna akan menerima email undangan untuk membuat password mereka sendiri.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="nama@bangkalankab.go.id" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input id="nama" name="nama" required placeholder="Nama lengkap" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="role">Peran</Label>
              <Select name="role" value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEMOHON">Pemohon (OPD)</SelectItem>
                  <SelectItem value="VERIFIKATOR">Verifikator (Bapperida)</SelectItem>
                  <SelectItem value="EWALI_DATA">E-Wali Data (Diskominfo)</SelectItem>
                  <SelectItem value="PENGELOLA_DTSEN">Pengelola DTSEN (Dinsos)</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opdId">
                OPD {role === "PEMOHON" && <span className="text-destructive">*</span>}
              </Label>
              <Select name="opdId" value={opdId} onValueChange={setOpdId}>
                <SelectTrigger id="opdId">
                  <SelectValue placeholder="— pilih OPD —" />
                </SelectTrigger>
                <SelectContent>
                  {opdList.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {state && !state.ok && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="me-2 size-4 animate-spin" />}
              Kirim Undangan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
