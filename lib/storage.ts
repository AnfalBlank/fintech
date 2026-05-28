// Cloudflare R2 / S3-compatible storage helper.
//
// R2 endpoint format: https://<account>.r2.cloudflarestorage.com/<bucket>
// We split account id and bucket name from `R2_ENDPOINT`.
//
// Required env vars:
//   R2_ENDPOINT          full URL incl. bucket
//   R2_ACCESS_KEY_ID     R2 access key
//   R2_SECRET_ACCESS_KEY R2 secret
//   R2_PUBLIC_BASE_URL   (optional) public CDN domain for inline display
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const endpointFull = process.env.R2_ENDPOINT ?? "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
const publicBase = process.env.R2_PUBLIC_BASE_URL ?? "";

let endpoint = "";
let bucket = "";
if (endpointFull) {
  // Split off bucket from path part of endpoint URL.
  try {
    const u = new URL(endpointFull);
    bucket = u.pathname.replace(/^\//, "").trim();
    u.pathname = "";
    endpoint = u.toString().replace(/\/$/, "");
  } catch {
    // Malformed URL — leave empty so isConfigured() reports false.
  }
}

let client: S3Client | null = null;
function getClient(): S3Client | null {
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }
  return client;
}

export function isConfigured(): boolean {
  return !!getClient();
}

export type UploadCategory =
  | "ktp"
  | "selfie"
  | "payslip"
  | "bankstmt"
  | "qc"
  | "delivery_proof"
  | "signature"
  | "agreement"
  | "receipt"
  | "qris";

export function objectKey(
  category: UploadCategory,
  ownerId: string,
  filename: string
): string {
  const safe = filename.replace(/[^\w.\-]/g, "_");
  const ext = safe.includes(".") ? safe.split(".").pop() : "bin";
  const id = randomUUID();
  return `${category}/${ownerId}/${id}.${ext}`;
}

export async function presignUpload(
  key: string,
  contentType: string,
  expiresInSec = 300
): Promise<{ url: string; expiresAt: Date } | null> {
  const c = getClient();
  if (!c) return null;
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(c, cmd, { expiresIn: expiresInSec });
  return { url, expiresAt: new Date(Date.now() + expiresInSec * 1000) };
}

export async function presignDownload(
  key: string,
  expiresInSec = 600
): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(c, cmd, { expiresIn: expiresInSec });
}

export async function putObject(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string
): Promise<void> {
  const c = getClient();
  if (!c) throw new Error("R2 not configured");
  await c.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteObject(key: string): Promise<void> {
  const c = getClient();
  if (!c) throw new Error("R2 not configured");
  await c.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function objectExists(key: string): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    await c.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export function publicUrl(key: string): string | null {
  if (!publicBase) return null;
  return `${publicBase.replace(/\/$/, "")}/${key}`;
}
