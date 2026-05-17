"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loginAction, type AuthState } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && (
        <Alert variant="destructive">
          <AlertTitle>Tidak bisa masuk</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="nama@opd.bangkalankab.go.id"
        />
        {state && !state.ok && state.fieldErrors?.email && (
          <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/lupa-password"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Lupa password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />
        {state && !state.ok && state.fieldErrors?.password && (
          <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-10" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="me-2 size-4 animate-spin" /> Memproses…
          </>
        ) : (
          <>
            <LogIn className="me-2 size-4" /> Masuk
          </>
        )}
      </Button>
    </form>
  );
}
