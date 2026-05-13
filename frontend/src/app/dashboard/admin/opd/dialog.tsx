"use client";

import * as React from "react";
import { useActionState } from "react";
import type { JenisOpd } from "@prisma/client";
import { Loader2 } from "lucide-react";

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
import { upsertOpd, type AdminFormState } from "@/lib/admin/actions";

type Opd = {
  id: string;
  kodeOpd: string | null;
  nama: string;
  jenis: JenisOpd;
  alamat: string | null;
  emailResmi: string | null;
  isActive: boolean;
};

export function OpdDialog({
  initial,
  children,
}: {
  initial?: Opd;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [jenis, setJenis] = React.useState<JenisOpd>(initial?.jenis ?? "DINAS");
  const [isActive, setIsActive] = React.useState<boolean>(initial?.isActive ?? true);
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(
    upsertOpd,
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
        <Button variant={initial ? "outline" : "default"} size={initial ? "sm" : undefined}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit OPD" : "Tambah OPD"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {initial?.id && <input type="hidden" name="id" value={initial.id} />}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="kodeOpd">Kode</Label>
              <Input id="kodeOpd" name="kodeOpd" required defaultValue={initial?.kodeOpd ?? ""} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nama">Nama OPD</Label>
              <Input id="nama" name="nama" required defaultValue={initial?.nama ?? ""} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Jenis</Label>
              <Select name="jenis" value={jenis} onValueChange={(v) => setJenis(v as JenisOpd)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DINAS">Dinas</SelectItem>
                  <SelectItem value="BADAN">Badan</SelectItem>
                  <SelectItem value="KANTOR">Kantor</SelectItem>
                  <SelectItem value="KECAMATAN">Kecamatan</SelectItem>
                  <SelectItem value="KELURAHAN">Kelurahan/Desa</SelectItem>
                  <SelectItem value="RSUD">RSUD</SelectItem>
                  <SelectItem value="SEKRETARIAT">Sekretariat</SelectItem>
                  <SelectItem value="LAINNYA">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emailResmi">Email Resmi</Label>
              <Input id="emailResmi" name="emailResmi" type="email" defaultValue={initial?.emailResmi ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="alamat">Alamat</Label>
            <Input id="alamat" name="alamat" defaultValue={initial?.alamat ?? ""} />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label className="text-sm">OPD Aktif</Label>
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
