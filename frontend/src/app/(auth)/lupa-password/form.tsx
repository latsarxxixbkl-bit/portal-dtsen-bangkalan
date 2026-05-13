"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction, type AuthState } from "@/lib/auth/actions";

export function LupaPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    resetPasswordAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.ok === false && (
        <Alert variant="destructive">
          <AlertTitle>Gagal</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.ok === true && (
        <Alert>
          <AlertTitle>Link terkirim</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="nama@opd.bangkalankab.go.id" />
      </div>

      <Button type="submit" className="w-full h-10" disabled={pending}>
        {pending ? (
          <><Loader2 className="me-2 size-4 animate-spin" /> Mengirim…</>
        ) : (
          <><Send className="me-2 size-4" /> Kirim link reset</>
        )}
      </Button>
    </form>
  );
}
