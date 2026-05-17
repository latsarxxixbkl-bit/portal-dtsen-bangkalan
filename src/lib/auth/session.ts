// Server-side helpers to load the authenticated user (auth + profile).
import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  authUserId: string;
  email: string;
  nama: string;
  role: "PEMOHON" | "VERIFIKATOR" | "EWALI_DATA" | "PENGELOLA_DTSEN" | "ADMIN";
  opdId: string | null;
  opdNama: string | null;
  nip: string | null;
  jabatan: string | null;
  noHp: string | null;
  isActive: boolean;
};

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const profile = await prisma.user.findFirst({
    where: {
      OR: [{ authUserId: authUser.id }, { email: authUser.email ?? "" }],
    },
    include: { opd: true },
  });

  if (!profile) return null;

  // Self-heal: link Supabase auth.id to our users.auth_user_id if missing.
  if (!profile.authUserId && authUser.id) {
    await prisma.user.update({
      where: { id: profile.id },
      data: { authUserId: authUser.id },
    });
  }

  return {
    id: profile.id,
    authUserId: authUser.id,
    email: profile.email,
    nama: profile.nama,
    role: profile.role,
    opdId: profile.opdId,
    opdNama: profile.opd?.nama ?? null,
    nip: profile.nip,
    jabatan: profile.jabatan,
    noHp: profile.noHp,
    isActive: profile.isActive,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/login?error=nonaktif");
  return user;
}

export async function requireRole(
  roles: SessionUser["role"][],
): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
