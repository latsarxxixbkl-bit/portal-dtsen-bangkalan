"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import type { UserRole } from "@prisma/client";
import { Loader2, Pencil, PowerOff, Power } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Switch } from "@/components/ui/switch";
import {
  toggleUserActive,
  updateUser,
  type AdminFormState,
} from "@/lib/admin/actions";

type User = {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  opdId: string | null;
  jabatan: string | null;
  nip: string | null;
  noHp: string | null;
  isActive: boolean;
};

export function UserRowActions({
  user,
  opdList,
}: {
  user: User;
  opdList: { id: string; nama: string; kodeOpd: string | null }[];
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-end gap-2">
      <EditUserDialog user={user} opdList={opdList} />
      <form
        action={(fd) =>
          startTransition(async () => {
            await toggleUserActive(fd);
          })
        }
      >
        <input type="hidden" name="id" value={user.id} />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={pending}
          aria-label={user.isActive ? "Nonaktifkan" : "Aktifkan"}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : user.isActive ? (
            <PowerOff className="size-4" />
          ) : (
            <Power className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

function EditUserDialog({
  user,
  opdList,
}: {
  user: User;
  opdList: { id: string; nama: string; kodeOpd: string | null }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [role, setRole] = React.useState<UserRole>(user.role);
  const [opdId, setOpdId] = React.useState<string>(user.opdId ?? "");
  const [isActive, setIsActive] = React.useState<boolean>(user.isActive);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    updateUser,
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
        <Button size="sm" variant="outline" aria-label="Edit">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <div className="space-y-1.5">
            <Label htmlFor={`nama-${user.id}`}>Nama</Label>
            <Input id={`nama-${user.id}`} name="nama" required defaultValue={user.nama} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Peran</Label>
              <Select name="role" value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
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
              <Label>
                OPD {role === "PEMOHON" && <span className="text-destructive">*</span>}
              </Label>
              <Select name="opdId" value={opdId} onValueChange={setOpdId}>
                <SelectTrigger>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`jabatan-${user.id}`}>Jabatan</Label>
              <Input id={`jabatan-${user.id}`} name="jabatan" defaultValue={user.jabatan ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`nip-${user.id}`}>NIP</Label>
              <Input id={`nip-${user.id}`} name="nip" defaultValue={user.nip ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`noHp-${user.id}`}>No HP</Label>
            <Input id={`noHp-${user.id}`} name="noHp" defaultValue={user.noHp ?? ""} />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <Label className="text-sm">Aktif</Label>
              <p className="text-xs text-muted-foreground">
                Pengguna nonaktif tidak bisa login ke portal.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <input type="hidden" name="isActive" value={isActive ? "on" : ""} />
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
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
