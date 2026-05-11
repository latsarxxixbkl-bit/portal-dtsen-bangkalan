import { NextResponse } from "next/server";

import { runLaporanReminder } from "@/lib/cron/laporan-reminder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Cron Vercel: jalan sekali sehari (lihat vercel.json).
 * Disecure dengan header `Authorization: Bearer <CRON_SECRET>` atau via Vercel cron
 * (header `x-vercel-cron: 1`).
 */
export async function GET(req: Request) {
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!isVercelCron) {
    if (!expected) {
      return NextResponse.json({ error: "CRON_SECRET belum diset." }, { status: 503 });
    }
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
    }
  }

  const result = await runLaporanReminder();
  return NextResponse.json({ ok: true, ...result });
}
