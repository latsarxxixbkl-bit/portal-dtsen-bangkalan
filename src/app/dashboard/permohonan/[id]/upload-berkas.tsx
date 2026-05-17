"use client";

import { useActionState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FileUploadInput } from "@/components/file-upload-input";
import { uploadBerkasDtsen, type WorkflowState } from "@/lib/permohonan/actions";

export function UploadBerkasForm({ permohonanId }: { permohonanId: string }) {
  const [state, formAction, pending] = useActionState<WorkflowState, FormData>(
    uploadBerkasDtsen,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="permohonanId" value={permohonanId} />
      <FileUploadInput
        name="file"
        label="Berkas Data DTSEN (PDF)"
        description="File final yang akan diserahkan ke Pemohon."
        required
      />
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
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <><Loader2 className="me-2 size-4 animate-spin" /> Mengunggah…</>
          ) : (
            <><Upload className="me-2 size-4" /> Serahkan Berkas DTSEN</>
          )}
        </Button>
      </div>
    </form>
  );
}
