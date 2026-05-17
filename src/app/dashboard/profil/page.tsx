import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge } from "@/components/role-badge";
import { requireUser } from "@/lib/auth/session";
import { ROLE_DESCRIPTIONS } from "@/lib/constants";

import { ProfilForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profil" };

export default async function ProfilPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui informasi pribadi dan kontak Kak.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Akun</CardTitle>
          <CardDescription>
            Peran & OPD ditentukan oleh Administrator dan tidak bisa diubah dari halaman ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">Peran:</span>
            <RoleBadge role={user.role} />
            <span className="text-xs text-muted-foreground">· {ROLE_DESCRIPTIONS[user.role]}</span>
          </div>
          {user.opdNama && (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">OPD:</span>
              <span className="font-medium">{user.opdNama}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Pribadi</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfilForm
            user={{
              nama: user.nama,
              jabatan: user.jabatan,
              nip: user.nip,
              noHp: user.noHp,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
