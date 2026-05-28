// Returns a pre-signed PUT URL the browser can use to upload directly to R2.
// Customer can request KTP/selfie/payslip/etc; admin can also request QC/proof.
import { z } from "zod";
import {
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { isAdmin } from "@/lib/auth";
import {
  isConfigured,
  objectKey,
  presignUpload,
  type UploadCategory,
} from "@/lib/storage";
import { audit } from "@/lib/services";
import type { NextRequest } from "next/server";

const Body = z.object({
  category: z.enum([
    "ktp",
    "selfie",
    "payslip",
    "bankstmt",
    "qc",
    "delivery_proof",
    "signature",
  ]),
  filename: z.string().min(1).max(120),
  contentType: z.string().min(3),
  ownerId: z.string().optional(), // admin can upload on behalf of another user
});

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

const MAX_BYTES_BY_TYPE: Record<string, number> = {
  default: 10 * 1024 * 1024, // 10MB
};

export const POST = await requireAuth()(async (
  req: NextRequest,
  { session }
) => {
  if (!isConfigured()) {
    return fail("Storage belum dikonfigurasi", 503);
  }
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { category, filename, contentType } = parsed.data;

  if (!ALLOWED_TYPES.includes(contentType)) {
    return fail("Tipe file tidak diizinkan", 400);
  }

  // Customer can only upload to their own folder for verification docs.
  let ownerId = session.userId;
  if (parsed.data.ownerId && parsed.data.ownerId !== session.userId) {
    if (!isAdmin(session.role)) {
      return fail("Forbidden", 403);
    }
    ownerId = parsed.data.ownerId;
  }

  // Restrict admin-only categories.
  const adminCategories: UploadCategory[] = ["qc", "delivery_proof"];
  if (
    adminCategories.includes(category) &&
    !isAdmin(session.role) &&
    session.role !== "courier"
  ) {
    return fail("Forbidden", 403);
  }

  const key = objectKey(category, ownerId, filename);
  const signed = await presignUpload(key, contentType, 300);
  if (!signed) return fail("Gagal generate signed URL", 500);

  await audit(session.userId, "upload.presign", "objects", key, {
    category,
    contentType,
  });

  return ok({
    key,
    uploadUrl: signed.url,
    expiresAt: signed.expiresAt,
    maxBytes: MAX_BYTES_BY_TYPE.default,
  });
});
