// Supabase Storage helpers (server-only). Uses the service role client so all
// reads/writes bypass storage RLS — we enforce access control ourselves in
// server actions / route handlers.
import { createHash, randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/server";

export const BUCKETS = {
  PERMOHONAN_DOKUMEN: "permohonan-dokumen",
  BERKAS_DTSEN: "berkas-dtsen",
  LAPORAN_PENDUKUNG: "laporan-pendukung",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Ensure all required private storage buckets exist. Idempotent. */
export async function ensureBuckets(): Promise<void> {
  const admin = createAdminClient();
  const { data: existing, error: listErr } = await admin.storage.listBuckets();
  if (listErr) throw listErr;
  const have = new Set((existing ?? []).map((b) => b.name));

  for (const name of Object.values(BUCKETS)) {
    if (have.has(name)) continue;
    const { error } = await admin.storage.createBucket(name, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB
      allowedMimeTypes: ["application/pdf"],
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
}

export type UploadInput = {
  bucket: BucketName;
  /** Logical sub-path (no leading slash). A UUID will be appended for uniqueness. */
  pathPrefix: string;
  file: File;
};

export type UploadedFile = {
  bucket: BucketName;
  path: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
};

/** Upload a file from a server action / route handler. Hashes for integrity. */
export async function uploadFile(input: UploadInput): Promise<UploadedFile> {
  const { bucket, pathPrefix, file } = input;
  if (file.size === 0) throw new Error("File kosong.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Ukuran file maksimal 10 MB.");
  if (file.type !== "application/pdf") throw new Error("Hanya file PDF yang diizinkan.");

  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");

  const safeOriginal = sanitize(file.name);
  const path = `${trimSlashes(pathPrefix)}/${Date.now()}-${randomUUID()}-${safeOriginal}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).upload(path, buf, {
    cacheControl: "private, max-age=0, must-revalidate",
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw error;

  return {
    bucket,
    path,
    fileName: safeOriginal,
    mimeType: "application/pdf",
    sizeBytes: file.size,
    sha256,
  };
}

/** Generate a short-lived signed URL for download/preview. */
export async function signedUrl(
  bucket: BucketName,
  path: string,
  expiresInSeconds = 300,
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw error ?? new Error("Tidak bisa membuat signed URL.");
  }
  return data.signedUrl;
}

/** Remove a stored object. Safe to call even if it no longer exists. */
export async function removeFile(bucket: BucketName, path: string): Promise<void> {
  const admin = createAdminClient();
  await admin.storage.from(bucket).remove([path]);
}

/** Download a stored object as a Buffer. Used for backup/bundling. */
export async function downloadFileBuffer(
  bucket: BucketName,
  path: string,
): Promise<Buffer> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).download(path);
  if (error || !data) {
    throw error ?? new Error(`Tidak bisa download ${bucket}/${path}.`);
  }
  return Buffer.from(await data.arrayBuffer());
}

function sanitize(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(-120);
}

function trimSlashes(s: string): string {
  return s.replace(/^\/+|\/+$/g, "");
}
