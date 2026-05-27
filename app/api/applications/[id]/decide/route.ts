import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  APPROVAL_ROLES,
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { audit, notify } from "@/lib/services";
import { assetId, newId } from "@/lib/ids";
import type { NextRequest } from "next/server";

const Body = z.object({
  action: z.enum(["approve", "reject", "hold"]),
  reason: z.string().optional(),
});

export const POST = await requireAuth(APPROVAL_ROLES)(async (
  req: NextRequest,
  { params, session }
) => {
  const id = params?.id;
  if (!id) return fail("ID required", 400);
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { action, reason } = parsed.data;

  const rows = await db
    .select()
    .from(schema.applications)
    .where(eq(schema.applications.id, id))
    .limit(1);
  if (!rows.length) return fail("Tidak ditemukan", 404);
  const app = rows[0];

  if (app.status === "approved" || app.status === "rejected") {
    return fail("Sudah diputuskan", 400);
  }

  const now = new Date();
  if (action === "approve") {
    const newStatus = app.dpRequired ? "dp_pending" : "purchasing";
    await db
      .update(schema.applications)
      .set({
        status: newStatus,
        reviewedBy: session.userId,
        reviewedAt: now,
      })
      .where(eq(schema.applications.id, id));
    // Create asset record
    const product = (
      await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, app.productId))
        .limit(1)
    )[0];
    await db.insert(schema.assets).values({
      id: assetId(),
      applicationId: id,
      productTitle: product?.title ?? "Unknown",
      status: "to_purchase",
    });
    await notify({
      userId: app.userId,
      type: "approval_update",
      tone: "success",
      title: "Pengajuan disetujui",
      body: app.dpRequired
        ? "Silakan bayar DP untuk lanjut pemrosesan"
        : "Tim kami akan segera membeli barangnya",
      link: app.dpRequired ? "/payments" : "/installments",
    });
  } else if (action === "reject") {
    if (!reason || reason.trim().length < 5)
      return fail("Alasan reject minimal 5 karakter", 400);
    await db
      .update(schema.applications)
      .set({
        status: "rejected",
        rejectReason: reason,
        reviewedBy: session.userId,
        reviewedAt: now,
      })
      .where(eq(schema.applications.id, id));
    await notify({
      userId: app.userId,
      type: "approval_update",
      tone: "danger",
      title: "Pengajuan ditolak",
      body: reason,
    });
  } else {
    await db
      .update(schema.applications)
      .set({ status: "manual_review" })
      .where(eq(schema.applications.id, id));
    await notify({
      userId: app.userId,
      type: "approval_update",
      tone: "info",
      title: "Pengajuan dalam review supervisor",
    });
  }

  await audit(session.userId, `application.${action}`, "applications", id, {
    reason,
  });

  return ok({ id, action });
});
