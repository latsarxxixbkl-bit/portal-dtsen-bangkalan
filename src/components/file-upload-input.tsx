"use client";

import * as React from "react";
import { FileText, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 10 * 1024 * 1024;

export type FileUploadProps = {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  accept?: string;
  error?: string;
};

export function FileUploadInput({
  name,
  label,
  description,
  required,
  accept = "application/pdf",
  error,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  function pickFile(f: File | null | undefined) {
    if (!f) {
      setFile(null);
      return;
    }
    setLocalError(null);
    if (f.type !== "application/pdf") {
      setLocalError("Hanya PDF yang diizinkan.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setLocalError("Maksimal 10 MB.");
      return;
    }
    setFile(f);
  }

  function setInputFiles(f: File) {
    // Use DataTransfer to programmatically set <input type=file>.files so the
    // value is included when the parent form is submitted with a Server Action.
    const dt = new DataTransfer();
    dt.items.add(f);
    if (inputRef.current) {
      inputRef.current.files = dt.files;
    }
  }

  React.useEffect(() => {
    if (file) setInputFiles(file);
    else if (inputRef.current) inputRef.current.value = "";
  }, [file]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium" htmlFor={name}>
          {label}
          {required && <span className="ms-0.5 text-destructive">*</span>}
        </label>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setFile(null)}
          >
            <X className="size-3" /> Ganti
          </Button>
        )}
      </div>

      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed bg-card transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border",
          (error || localError) && "border-destructive/60 bg-destructive/5",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          id={name}
          name={name}
          accept={accept}
          required={required && !file}
          className="absolute inset-0 z-10 size-full cursor-pointer opacity-0"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <div className="pointer-events-none flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-secondary text-secondary-foreground">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0">
            {file ? (
              <>
                <div className="truncate text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-medium">Pilih PDF atau seret ke sini</div>
                <div className="text-xs text-muted-foreground">Maks 10 MB · format PDF</div>
              </>
            )}
          </div>
        </div>
      </div>

      {description && !error && !localError && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {(localError || error) && (
        <p className="text-xs text-destructive">{localError ?? error}</p>
      )}
    </div>
  );
}
