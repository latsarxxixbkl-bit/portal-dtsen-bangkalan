"use client";

import * as React from "react";
import { useActionState } from "react";
import type { FormatTemplate, TipeTemplate } from "@prisma/client";
import { FileUp, Loader2, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  uploadTemplate,
  deleteTemplate,
  type TemplateFormState,
} from "@/lib/templates/admin-actions";

type Props = {
  tipe: TipeTemplate;
  format: FormatTemplate;
  hasFile: boolean;
};

export function TemplateUploadForm({ tipe, format, hasFile }: Props) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<TemplateFormState, FormData>(
    uploadTemplate,
    undefined,
  );

  React.useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const accept = format === "PDF" ? "application/pdf,.pdf" : ".docx";
  const label = format === "PDF" ? "PDF" : "DOCX";

  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label} {hasFile ? "(ganti file)" : "(upload baru)"}
        </Label>
        {hasFile && (
          <form
            action={deleteTemplate}
            onSubmit={(e) => {
              if (!confirm(`Hapus template ${label}?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="tipe" value={tipe} />
            <input type="hidden" name="format" value={format} />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="me-1 size-3.5" />
              Hapus
            </Button>
          </form>
        )}
      </div>
      <form ref={formRef} action={formAction} className="space-y-2">
        <input type="hidden" name="tipe" value={tipe} />
        <input type="hidden" name="format" value={format} />
        <Input
          type="file"
          name="file"
          accept={accept}
          required
          className="cursor-pointer file:cursor-pointer file:rounded file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-xs file:text-primary"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">Maks 20 MB</p>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="me-1.5 size-3.5 animate-spin" />
            ) : (
              <FileUp className="me-1.5 size-3.5" />
            )}
            {hasFile ? "Ganti" : "Upload"}
          </Button>
        </div>
        {state && !state.ok && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{state.error}</AlertDescription>
          </Alert>
        )}
        {state?.ok && (
          <Alert className="border-success/30 bg-success/10 py-2 text-success">
            <AlertDescription className="text-xs">{state.message}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}
