"use client";

import { useTransition } from "react";
import { CheckCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { markAllNotifikasiRead } from "@/lib/notifikasi/actions";

export function MarkAllReadButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markAllNotifikasiRead();
        })
      }
    >
      {pending ? (
        <Loader2 className="me-2 size-4 animate-spin" />
      ) : (
        <CheckCheck className="me-2 size-4" />
      )}
      Tandai sudah dibaca
    </Button>
  );
}
