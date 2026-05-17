"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

export async function markAllNotifikasiRead() {
  const user = await requireUser();
  await prisma.notifikasi.updateMany({
    where: { userId: user.id, dibacaAt: null },
    data: { dibacaAt: new Date() },
  });
  revalidatePath("/dashboard/notifikasi");
  revalidatePath("/dashboard");
}

export async function markNotifikasiRead(id: string) {
  const user = await requireUser();
  await prisma.notifikasi.updateMany({
    where: { id, userId: user.id, dibacaAt: null },
    data: { dibacaAt: new Date() },
  });
  revalidatePath("/dashboard/notifikasi");
}
