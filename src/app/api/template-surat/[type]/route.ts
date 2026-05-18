import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import { findTemplate, generateTemplatePdf } from "@/lib/templates/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ type: string }> },
) {
  await requireUser();
  const { type } = await ctx.params;

  const meta = findTemplate(type);
  if (!meta) {
    return NextResponse.json({ error: "Template tidak ditemukan." }, { status: 404 });
  }

  const bytes = await generateTemplatePdf(meta.type);

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${meta.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
