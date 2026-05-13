"use client";

import { useActionState, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { upsertTemplat, type TemplatFormState } from "@/lib/templat/actions";

export function UploadTemplatDialog({
  jenisDokumen,
  defaultNama,
  defaultDeskripsi,
  triggerLabel = "Unggah",
}: {
  jenisDokumen: "SURAT_PERMINTAAN" | "KAK" | "PAKTA_INTEGRITAS" | "NDA";
  defaultNama: string;
  defaultDeskripsi: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<TemplatFormState, FormData>(
    async (prev, fd) => {
      const res = await upsertTemplat(prev, fd);
      if (res?.ok) {
        toast.success(res.message);
        setOpen(false);
      } else if (res && !res.ok) {
        toast.error(res.error);
      }
      return res;
    },
    undefined,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" data-testid={`templat-upload-trigger-${jenisDokumen.toLowerCase()}`}>
          <Upload className="me-1 size-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Unggah Template</DialogTitle>
            <DialogDescription>
              {jenisDokumen.replace(/_/g, " ")} · format PDF / DOCX / DOC / ODT · maks 20 MB.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="jenisDokumen" value={jenisDokumen} />

          <div className="space-y-2">
            <Label htmlFor={`nama-${jenisDokumen}`}>Nama</Label>
            <Input
              id={`nama-${jenisDokumen}`}
              name="nama"
              required
              defaultValue={defaultNama}
              data-testid="templat-form-nama"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`deskripsi-${jenisDokumen}`}>Deskripsi (opsional)</Label>
            <Textarea
              id={`deskripsi-${jenisDokumen}`}
              name="deskripsi"
              rows={3}
              defaultValue={defaultDeskripsi}
              data-testid="templat-form-deskripsi"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`file-${jenisDokumen}`}>File Template</Label>
            <Input
              id={`file-${jenisDokumen}`}
              name="file"
              type="file"
              accept=".pdf,.doc,.docx,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              data-testid="templat-form-file"
            />
            <p className="text-xs text-muted-foreground">
              OPD akan mengunduh file ini sebagai dasar membuat dokumen permohonan.
            </p>
          </div>

          {state && !state.ok && (
            <p className="text-sm text-destructive" data-testid="templat-form-error">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" disabled={pending} data-testid="templat-form-submit">
              {pending ? (
                <><Loader2 className="me-2 size-4 animate-spin" /> Mengunggah…</>
              ) : (
                <><Upload className="me-2 size-4" /> Simpan Template</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
