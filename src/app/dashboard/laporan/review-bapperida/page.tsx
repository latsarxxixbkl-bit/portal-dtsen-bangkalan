import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ReviewBapperidaPage() {
  const user = await requireUser();
  if (user.role !== "VERIFIKATOR" && user.role !== "ADMIN") redirect("/dashboard");
  redirect("/dashboard/laporan");
}
