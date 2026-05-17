"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reviewLaporan, type LaporanFormState } from "@/lib/laporan/actions";
import type { LaporanWorkflowAction } from "@/lib/workflow/laporan";

export function ReviewLaporanActions({
  laporanId,
  actions,
}: {
  laporanId: string;
  actions: LaporanWorkflowAction[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {actions.map((a) => (
        <ReviewDialog key={a.aksi} laporanId={laporanId} action={a} />
      ))}
    </div>
  );
}

function ReviewDialog({
  laporanId,
  action,
}: {
  laporanId: string;
  action: LaporanWorkflowAction;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState<LaporanFormState, FormData>(
    reviewLaporan,
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
        <Button variant={action.intent} className="w-full justify-start">
          {action.label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action.label}</DialogTitle>
          {action.description && <DialogDescription>{action.description}</DialogDescription>}
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="laporanId" value={laporanId} />
          <input type="hidden" name="aksi" value={action.aksi} />
          <div className="space-y-1.5">
            <Label htmlFor="catatan">
              Catatan{" "}
              {action.requiresNote ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="text-muted-foreground">(opsional)</span>
              )}
            </Label>
            <Textarea
              id="catatan"
              name="catatan"
              rows={4}
              required={action.requiresNote}
              placeholder={
                action.requiresNote
                  ? "Tuliskan poin revisi dengan jelas."
                  : "Tambahkan catatan jika perlu."
              }
            />
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
            <Button type="submit" variant={action.intent} disabled={pending}>
              {pending && <Loader2 className="me-2 size-4 animate-spin" />}
              {action.label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
