// Customer "Saya Sudah Bayar" — for manual transfer / QRIS static only.
//
// Marks payment as `pending` (already pending) but logs the claim with
// optional proof key for admin to verify in the dashboard. Does NOT mark
// as paid — that requires admin action via /api/payments/[id]/confirm.
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, parseJson, requireAuth } from "@/lib/api";
import { audit, notify } from "@/lib/services";
import type { NextRequest } from "next/server";

const Body = z.object({
  proofKey: z.string().optional(), // R2 object key from /api/uploads/presign
  note: z.string().max(500).optional(),
});

export const POST = await requireAuth(["customer"] as const)(async (
  req: NextRequest,
  { params, session }
) => {
  const id = params?.id;
  if (!id) return fail("ID required", 400);
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);

  const p = (
    await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.id, id))
      .limit(1)
  )[0];
  if (!p) return fail("Payment tidak ditemukan", 404);
  if (p.userId !== session.userId) return fail("Forbidden", 403);
  if (p.status === "paid") return ok({ alreadyPaid: true });

  // Notify finance admins via in-app feed.
  const admins = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.role, "finance_admin"));
  for (const a of admins) {
    await notify({
      userId: a.id,
      type: "system",
      tone: "info",
      title: "Klaim pembayaran perlu diverifikasi",
      body: `${p.referenceNo} · ${p.amount.toLocaleString("id-ID")} IDR`,
      link: `/admin/applications/${p.applicationId}`,
    });
  }

  await audit(session.userId, "payment.claim", "payments", id, {
    proofKey: parsed.data.proofKey,
    note: parsed.data.note,
  });

  return ok({
    claimed: true,
    message: "Klaim diterima. Admin akan verifikasi dalam 2 jam kerja.",
  });
});
