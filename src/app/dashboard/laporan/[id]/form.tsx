"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadInput } from "@/components/file-upload-input";
import { submitLaporan, type LaporanFormState } from "@/lib/laporan/actions";

type LaporanInput = {
  id: string;
  judulKegiatan: string;
  periodeMulai: string;
  periodeSelesai: string;
  outputKegiatan: string;
  manfaatData: string;
  jumlahRecordData: number | null;
  filePendukungName: string | null;
};

export function LaporanForm({ laporan }: { laporan: LaporanInput }) {
  const [state, formAction, pending] = useActionState<LaporanFormState, FormData>(
    submitLaporan,
    undefined,
  );

  const fieldErr = (f: string) =>
    state && !state.ok ? state.fieldErrors?.[f]?.[0] : undefined;

  const dateStr = (iso: string) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="laporanId" value={laporan.id} />

      {state && !state.ok && (
        <Alert variant="destructive">
          <AlertTitle>Tidak bisa mengirim</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.ok && (
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="judulKegiatan">Judul Kegiatan</Label>
        <Input
          id="judulKegiatan"
          name="judulKegiatan"
          required
          defaultValue={laporan.judulKegiatan}
          placeholder="Mis. Pemetaan Sasaran Bantuan Pangan 2026"
        />
        {fieldErr("judulKegiatan") && (
          <p className="text-xs text-destructive">{fieldErr("judulKegiatan")}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="periodeMulai">Periode Mulai</Label>
          <Input
            id="periodeMulai"
            name="periodeMulai"
            type="date"
            required
            defaultValue={dateStr(laporan.periodeMulai)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="periodeSelesai">Periode Selesai</Label>
          <Input
            id="periodeSelesai"
            name="periodeSelesai"
            type="date"
            required
            defaultValue={dateStr(laporan.periodeSelesai)}
          />
          {fieldErr("periodeSelesai") && (
            <p className="text-xs text-destructive">{fieldErr("periodeSelesai")}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outputKegiatan">Output Kegiatan</Label>
        <Textarea
          id="outputKegiatan"
          name="outputKegiatan"
          rows={3}
          required
          defaultValue={laporan.outputKegiatan}
          placeholder="Hasil/output dari pemanfaatan data DTSEN."
        />
        {fieldErr("outputKegiatan") && (
          <p className="text-xs text-destructive">{fieldErr("outputKegiatan")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="manfaatData">Manfaat Data</Label>
        <Textarea
          id="manfaatData"
          name="manfaatData"
          rows={3}
          required
          defaultValue={laporan.manfaatData}
          placeholder="Bagaimana data DTSEN bermanfaat untuk kegiatan ini?"
        />
        {fieldErr("manfaatData") && (
          <p className="text-xs text-destructive">{fieldErr("manfaatData")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="jumlahRecordData">Jumlah Record Data Digunakan (opsional)</Label>
        <Input
          id="jumlahRecordData"
          name="jumlahRecordData"
          type="number"
          min={0}
          defaultValue={laporan.jumlahRecordData ?? ""}
        />
        {fieldErr("jumlahRecordData") && (
          <p className="text-xs text-destructive">{fieldErr("jumlahRecordData")}</p>
        )}
      </div>

      <FileUploadInput
        name="filePendukung"
        label={`File Pendukung (opsional)${laporan.filePendukungName ? ` — sebelumnya: ${laporan.filePendukungName}` : ""}`}
        description="PDF dokumentasi kegiatan (laporan akhir, hasil analisis, dll)."
        error={fieldErr("filePendukung")}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <><Loader2 className="me-2 size-4 animate-spin" /> Mengirim…</>
          ) : (
            <><Send className="me-2 size-4" /> Kirim Laporan</>
          )}
        </Button>
      </div>
    </form>
  );
}
