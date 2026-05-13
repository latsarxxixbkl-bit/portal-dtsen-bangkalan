"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FileUploadInput } from "@/components/file-upload-input";
import { DOKUMEN_WAJIB } from "@/lib/constants";
import { submitPermohonan, type PermohonanFormState } from "@/lib/permohonan/actions";

export function PermohonanForm() {
  const [state, formAction, pending] = useActionState<PermohonanFormState, FormData>(
    submitPermohonan,
    undefined,
  );

  const fieldErr = (field: string): string | undefined =>
    state && !state.ok ? state.fieldErrors?.[field]?.[0] : undefined;

  return (
    <form action={formAction} className="space-y-6">
      {state && !state.ok && (
        <Alert variant="destructive">
          <AlertTitle>Tidak bisa mengirim</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="judul">Judul Permohonan</Label>
        <Input
          id="judul"
          name="judul"
          required
          maxLength={200}
          placeholder="Mis. Akses Data DTSEN untuk Pemetaan Sasaran Bantuan Pangan 2026"
        />
        {fieldErr("judul") && <p className="text-xs text-destructive">{fieldErr("judul")}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tujuanPenggunaan">Tujuan Penggunaan Data</Label>
        <Textarea
          id="tujuanPenggunaan"
          name="tujuanPenggunaan"
          required
          rows={4}
          placeholder="Jelaskan tujuan, output, dan manfaat akses data DTSEN."
        />
        {fieldErr("tujuanPenggunaan") && (
          <p className="text-xs text-destructive">{fieldErr("tujuanPenggunaan")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jenisDataDiminta">Jenis Data yang Diminta</Label>
        <Textarea
          id="jenisDataDiminta"
          name="jenisDataDiminta"
          required
          rows={3}
          placeholder="Mis. data sosial-ekonomi keluarga di Kec. Bangkalan & Burneh; variabel: status kemiskinan, jumlah anggota, kondisi rumah."
        />
        {fieldErr("jenisDataDiminta") && (
          <p className="text-xs text-destructive">{fieldErr("jenisDataDiminta")}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="periodeAwal">Periode Awal (opsional)</Label>
          <Input id="periodeAwal" name="periodeAwal" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="periodeAkhir">Periode Akhir (opsional)</Label>
          <Input id="periodeAkhir" name="periodeAkhir" type="date" />
          {fieldErr("periodeAkhir") && (
            <p className="text-xs text-destructive">{fieldErr("periodeAkhir")}</p>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold">Empat Dokumen Wajib</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Unggah PDF untuk masing-masing dokumen. Maksimal 10 MB per file.
        </p>
      </div>

      <div className="grid gap-4">
        {DOKUMEN_WAJIB.map((d) => (
          <FileUploadInput
            key={d.id}
            name={`dokumen.${d.id}`}
            label={d.nama}
            description={d.deskripsi}
            required
            error={fieldErr(`dokumen.${d.id}`)}
          />
        ))}
      </div>

      <Separator />

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="me-2 size-4 animate-spin" /> Mengirim…
            </>
          ) : (
            <>
              <Send className="me-2 size-4" /> Kirim Permohonan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
