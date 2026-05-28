// Returns a short-lived GET URL for an object stored in R2.
// Used by admin doc viewer + customer to re-display uploaded KTP/selfie.
import { z } from "zod";
import {
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { isAdmin } from "@/lib/auth";
import { isConfigured, presignDownload } from "@/lib/storage";
import type { NextRequest } from "next/server";

const Body = z.object({
  key: z.string().min(1),
});

export const POST = await requireAuth()(async (
  req: NextRequest,
  { session }
) => {
  if (!isConfigured()) return fail("Storage belum dikonfigurasi", 503);
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { key } = parsed.data;

  // Object key format: <category>/<ownerId>/<file-id>.<ext>
  const parts = key.split("/");
  if (parts.length < 3) return fail("Invalid key", 400);
  const ownerId = parts[1];
  if (!isAdmin(session.role) && ownerId !== session.userId) {
    return fail("Forbidden", 403);
  }

  const url = await presignDownload(key, 600);
  if (!url) return fail("Gagal generate URL", 500);
  return ok({ url, expiresInSec: 600 });
});
