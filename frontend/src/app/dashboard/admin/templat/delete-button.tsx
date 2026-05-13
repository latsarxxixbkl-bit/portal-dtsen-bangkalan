"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteTemplat } from "@/lib/templat/actions";

export function DeleteTemplatButton({
  jenisDokumen,
}: {
  jenisDokumen: "SURAT_PERMINTAAN" | "KAK" | "PAKTA_INTEGRITAS" | "NDA";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" disabled={pending} data-testid={`templat-delete-${jenisDokumen.toLowerCase()}`}>
          <Trash2 className="me-1 size-4" /> Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus template?</AlertDialogTitle>
          <AlertDialogDescription>
            Template ini akan dihapus permanen. OPD tidak bisa lagi mengunduh template ini sampai admin mengunggah pengganti.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const fd = new FormData();
                fd.set("jenisDokumen", jenisDokumen);
                const res = await deleteTemplat(undefined, fd);
                if (res?.ok) toast.success(res.message);
                else if (res && !res.ok) toast.error(res.error);
              });
            }}
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
