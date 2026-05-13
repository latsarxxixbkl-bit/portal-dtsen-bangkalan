import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Health check sederhana untuk monitor uptime.
 * GET /api/health → 200 { ok: true, ts: <ISO> }
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "Portal DTSEN Bangkalan",
    ts: new Date().toISOString(),
  });
}
