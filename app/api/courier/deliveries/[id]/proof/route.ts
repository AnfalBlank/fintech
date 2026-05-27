import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, parseJson, requireAuth } from "@/lib/api";
import { newId } from "@/lib/ids";
import { audit, notify } from "@/lib/services";
import type { NextRequest } from "next/server";

// PRD §12 — submit verified delivery proof: photos + GPS + signature + QR.
const Body = z.object({
  photos: z.array(z.string()).min(3),
  gpsLat: z.number(),
  gpsLng: z.number(),
  signatureDataUrl: z.string().min(10),
  qrVerified: z.boolean(),
});

export const POST = await requireAuth(["courier", "super_admin", "delivery_team"] as const)(
  async (req: NextRequest, { params, session }) => {
    const id = params?.id;
    if (!id) return fail("ID required", 400);
    const parsed = await parseJson(req, Body);
    if (!parsed.ok) return fail(parsed.error, 400);
    const { photos, gpsLat, gpsLng, signatureDataUrl, qrVerified } = parsed.data;
    if (!qrVerified) return fail("QR verification wajib", 400);

    const dlv = (
      await db
        .select()
        .from(schema.deliveries)
        .where(eq(schema.deliveries.id, id))
        .limit(1)
    )[0];
    if (!dlv) return fail("Delivery tidak ditemukan", 404);
    if (
      session.role === "courier" &&
      dlv.courierId !== session.userId
    ) {
      return fail("Forbidden", 403);
    }

    const now = new Date();
    await db.insert(schema.deliveryProofs).values({
      id: newId("PRF"),
      deliveryId: id,
      photos: JSON.stringify(photos),
      gpsLat,
      gpsLng,
      gpsCapturedAt: now,
      signatureDataUrl,
      qrVerified: true,
    });
    await db
      .update(schema.deliveries)
      .set({ status: "delivered", completedAt: now })
      .where(eq(schema.deliveries.id, id));

    if (dlv.assetId) {
      await db
        .update(schema.assets)
        .set({ status: "delivered" })
        .where(eq(schema.assets.id, dlv.assetId));
    }

    // Mark application active and start installment schedule
    await db
      .update(schema.applications)
      .set({ status: "active" })
      .where(eq(schema.applications.id, dlv.applicationId));

    const app = (
      await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, dlv.applicationId))
        .limit(1)
    )[0];
    if (app) {
      // Generate installment schedule if not already created
      const existing = await db
        .select({ id: schema.installments.id })
        .from(schema.installments)
        .where(eq(schema.installments.applicationId, app.id));
      if (existing.length === 0) {
        const { generateInstallmentSchedule } = await import("@/lib/services");
        await generateInstallmentSchedule(
          app.id,
          app.userId,
          app.monthly,
          app.tenor,
          now
        );
      }
      await notify({
        userId: app.userId,
        type: "delivery_update",
        tone: "success",
        title: "Barang diterima",
        body: "Cicilan pertama akan dimulai dalam 30 hari",
        link: `/installments/${app.id}`,
      });
    }

    await audit(session.userId, "delivery.proof", "deliveries", id);
    return ok({ delivered: true });
  }
);
