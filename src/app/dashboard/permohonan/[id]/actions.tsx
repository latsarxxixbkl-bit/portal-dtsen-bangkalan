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
import { applyWorkflowAction, type WorkflowState } from "@/lib/permohonan/actions";
import type { WorkflowAction } from "@/lib/workflow/permohonan";

export function WorkflowActions({
  permohonanId,
  actions,
}: {
  permohonanId: string;
  actions: WorkflowAction[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {actions.map((a) => (
        <ActionDialog key={a.aksi} permohonanId={permohonanId} action={a} />
      ))}
    </div>
  );
}

function ActionDialog({
  permohonanId,
  action,
}: {
  permohonanId: string;
  action: WorkflowAction;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState<WorkflowState, FormData>(
    applyWorkflowAction,
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
          {action.description && (
            <DialogDescription>{action.description}</DialogDescription>
          )}
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="permohonanId" value={permohonanId} />
          <input type="hidden" name="aksi" value={action.aksi} />
          <div className="space-y-1.5">
            <Label htmlFor="catatan">
              Catatan {action.requiresNote ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(opsional)</span>}
            </Label>
            <Textarea
              id="catatan"
              name="catatan"
              rows={4}
              placeholder={
                action.requiresNote
                  ? "Tuliskan alasan singkat & jelas."
                  : "Tambahkan catatan jika perlu."
              }
              required={action.requiresNote}
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
