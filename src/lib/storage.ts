// Supabase Storage helpers (server-only). Uses the service role client so all
// reads/writes bypass storage RLS — we enforce access control ourselves in
// server actions / route handlers.
import { createHash, randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/server";

export const BUCKETS = {
  PERMOHONAN_DOKUMEN: "permohonan-dokumen",
  BERKAS_DTSEN: "berkas-dtsen",
  LAPORAN_PENDUKUNG: "laporan-pendukung",
  TEMPLATE_SURAT: "template-surat",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export const MIME_PDF = "application/pdf";
export const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const BUCKET_CONFIG: Record<
  BucketName,
  { fileSizeLimit: number; allowedMimeTypes: string[] }
> = {
  [BUCKETS.PERMOHONAN_DOKUMEN]: {
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [MIME_PDF],
  },
  [BUCKETS.BERKAS_DTSEN]: {
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [MIME_PDF],
  },
  [BUCKETS.LAPORAN_PENDUKUNG]: {
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: [MIME_PDF],
  },
  [BUCKETS.TEMPLATE_SURAT]: {
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: [MIME_PDF, MIME_DOCX],
  },
};

/** Ensure all required private storage buckets exist. Idempotent. */
export async function ensureBuckets(): Promise<void> {
  const admin = createAdminClient();
  const { data: existing, error: listErr } = await admin.storage.listBuckets();
  if (listErr) throw listErr;
  const have = new Set((existing ?? []).map((b) => b.name));

  for (const name of Object.values(BUCKETS)) {
    const cfg = BUCKET_CONFIG[name];
    if (have.has(name)) {
      // Keep config in sync if bucket already exists.
      const { error: updErr } = await admin.storage.updateBucket(name, {
        public: false,
        fileSizeLimit: cfg.fileSizeLimit,
        allowedMimeTypes: cfg.allowedMimeTypes,
      });
      if (updErr && !/not found/i.test(updErr.message)) throw updErr;
      continue;
    }
    const { error } = await admin.storage.createBucket(name, {
      public: false,
      fileSizeLimit: cfg.fileSizeLimit,
      allowedMimeTypes: cfg.allowedMimeTypes,
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
}

export type UploadInput = {
  bucket: BucketName;
  /** Logical sub-path (no leading slash). A UUID will be appended for uniqueness when path is omitted. */
  pathPrefix?: string;
  /** Eksplisit path lengkap (override pathPrefix). Akan replace file lama bila ada. */
  path?: string;
  file: File;
  /** Override allowed MIME types (default sesuai BUCKET_CONFIG). */
  allowedMimeTypes?: string[];
  /** Allow overwriting existing object at `path`. Default false. */
  upsert?: boolean;
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
  const { bucket, pathPrefix, path: explicitPath, file, allowedMimeTypes, upsert } = input;
  if (file.size === 0) throw new Error("File kosong.");

  const cfg = BUCKET_CONFIG[bucket];
  const allowed = allowedMimeTypes ?? cfg.allowedMimeTypes;
  const maxBytes = cfg.fileSizeLimit;

  if (file.size > maxBytes) {
    throw new Error(
      `Ukuran file maksimal ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    );
  }
  if (!allowed.includes(file.type)) {
    const human = allowed
      .map((m) =>
        m === MIME_PDF ? "PDF" : m === MIME_DOCX ? "DOCX" : m,
      )
      .join(" atau ");
    throw new Error(`Hanya file ${human} yang diizinkan.`);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");

  const safeOriginal = sanitize(file.name);
  const path =
    explicitPath ??
    `${trimSlashes(pathPrefix ?? "")}/${Date.now()}-${randomUUID()}-${safeOriginal}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).upload(path, buf, {
    cacheControl: "private, max-age=0, must-revalidate",
    contentType: file.type,
    upsert: upsert ?? false,
  });
  if (error) throw error;

  return {
    bucket,
    path,
    fileName: safeOriginal,
    mimeType: file.type,
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
