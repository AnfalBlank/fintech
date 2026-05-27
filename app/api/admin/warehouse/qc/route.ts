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
import { audit, generateInstallmentSchedule, notify } from "@/lib/services";
import { deliveryId, newId } from "@/lib/ids";
import type { NextRequest } from "next/server";

// PRD §11 Step 10 — QC pass/fail.
const Body = z.object({
  assetId: z.string(),
  result: z.enum(["passed", "failed"]),
  serialNumber: z.string().optional(),
  photoCount: z.number().int().min(0).default(0),
});

export const POST = await requireAuth(APPROVAL_ROLES)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const { assetId, result, serialNumber, photoCount } = parsed.data;

  const a = (
    await db
      .select()
      .from(schema.assets)
      .where(eq(schema.assets.id, assetId))
      .limit(1)
  )[0];
  if (!a) return fail("Asset tidak ditemukan", 404);

  const now = new Date();
  await db
    .update(schema.assets)
    .set({
      qcStatus: result,
      qcCheckedBy: session.userId,
      qcAt: now,
      qcPhotoCount: photoCount,
      imeiOrSerial: serialNumber ?? a.imeiOrSerial,
      status: result === "passed" ? "in_warehouse" : a.status,
    })
    .where(eq(schema.assets.id, assetId));

  if (result === "passed") {
    // Auto create delivery placeholder
    const app = (
      await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, a.applicationId))
        .limit(1)
    )[0];
    if (app) {
      const user = (
        await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, app.userId))
          .limit(1)
      )[0];
      const dlv = deliveryId();
      await db.insert(schema.deliveries).values({
        id: dlv,
        applicationId: a.applicationId,
        assetId: a.id,
        customerName: user?.name ?? "Customer",
        customerPhone: user?.phone ?? "",
        address: user?.address ?? "—",
        scheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        status: "pending",
      });
      await db
        .update(schema.applications)
        .set({ status: "warehouse" })
        .where(eq(schema.applications.id, a.applicationId));
      await notify({
        userId: app.userId,
        type: "delivery_update",
        tone: "info",
        title: "QC selesai",
        body: "Barang sudah di gudang dan siap dikirim",
      });
    }
  }

  await audit(session.userId, "qc.complete", "assets", assetId, { result });
  return ok({ result });
});
