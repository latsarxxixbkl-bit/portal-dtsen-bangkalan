import { prisma } from "@/lib/prisma";

export async function fetchAllTemplat() {
  return prisma.templatSurat.findMany({
    orderBy: { jenisDokumen: "asc" },
    select: {
      id: true,
      jenisDokumen: true,
      nama: true,
      deskripsi: true,
      fileName: true,
      sizeBytes: true,
      mimeType: true,
      uploadedAt: true,
      updatedAt: true,
      uploadedBy: { select: { nama: true, email: true } },
    },
  });
}

export type TemplatRow = Awaited<ReturnType<typeof fetchAllTemplat>>[number];

export async function fetchTemplatPublicMap(): Promise<Record<string, TemplatRow>> {
  const list = await fetchAllTemplat();
  const map: Record<string, TemplatRow> = {};
  for (const t of list) map[t.jenisDokumen] = t;
  return map;
}
