import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { fail, ok, parseJson, requireAuth } from "@/lib/api";
import { newReference, paymentId } from "@/lib/ids";
import { audit, notify } from "@/lib/services";
import { loadSettings } from "@/lib/settings";
import type { NextRequest } from "next/server";

const Body = z.object({
  applicationId: z.string(),
  installmentId: z.string().optional(),
  type: z.enum(["dp", "installment", "penalty"]),
  method: z.enum(["va", "qris", "ewallet", "transfer"]),
  channel: z.string().optional(), // BCA / GoPay / etc.
  amount: z.number().int().positive(),
});

// POST /api/payments — create payment intent (PRD §11 Step 8 + cicilan)
export const POST = await requireAuth(["customer"] as const)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  const {
    applicationId: appId,
    installmentId,
    type,
    method,
    channel,
    amount,
  } = parsed.data;

  const app = (
    await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.id, appId))
      .limit(1)
  )[0];
  if (!app) return fail("Application tidak ditemukan", 404);
  if (app.userId !== session.userId) return fail("Forbidden", 403);

  const settings = await loadSettings();

  // Validate method against configured paymentMode.
  if (settings.paymentMode === "manual" && method !== "transfer" && method !== "qris") {
    return fail(
      "Saat ini hanya transfer bank atau QRIS yang tersedia. Hubungi admin.",
      400
    );
  }
  if (
    settings.paymentMode === "midtrans" &&
    !["va", "qris", "ewallet"].includes(method)
  ) {
    return fail("Metode pembayaran tidak didukung", 400);
  }

  const id = paymentId();
  const ref = newReference("MGL");
  const expiresAt = new Date(
    Date.now() + settings.paymentExpireHours * 60 * 60 * 1000
  );

  await db.insert(schema.payments).values({
    id,
    applicationId: appId,
    installmentId: installmentId ?? null,
    userId: session.userId,
    type,
    method,
    channel: channel ?? null,
    amount,
    referenceNo: ref,
    status: "pending",
    expiresAt,
  });

  await audit(session.userId, "payment.create", "payments", id, {
    type,
    method,
    amount,
    mode: settings.paymentMode,
  });

  // Build payload tailored to selected method.
  let payload: Record<string, unknown> = { referenceNo: ref };

  if (method === "transfer") {
    payload = {
      mode: "manual_transfer",
      referenceNo: ref,
      bankAccounts: settings.bankAccounts,
      instructions:
        "Transfer ke salah satu rekening di atas. Setelah transfer, klik 'Saya Sudah Bayar' dan upload bukti.",
      noteForBeneficiary: ref,
      amount,
    };
  } else if (method === "qris") {
    payload = {
      mode: "qris_static",
      referenceNo: ref,
      imageUrl: settings.qrisStaticImageUrl,
      merchantName: settings.qrisMerchantName,
      merchantId: settings.qrisMerchantId,
      amount,
    };
  } else if (method === "va") {
    // Midtrans-driven (still mock until real key+webhook hooked up).
    payload = {
      mode: "midtrans_va",
      referenceNo: ref,
      bank: channel ?? "BCA",
      vaNumber: "8800-" + ref.slice(-12).match(/.{1,4}/g)!.join("-"),
      accountName: "PT. Manggala Utama Indonesia",
      productionMode: settings.midtransProduction,
    };
  } else if (method === "ewallet") {
    payload = {
      mode: "midtrans_ewallet",
      referenceNo: ref,
      provider: channel ?? "GoPay",
      deepLink: `${(channel ?? "gopay").toLowerCase()}://pay/${ref}`,
      productionMode: settings.midtransProduction,
    };
  }

  return ok({
    paymentId: id,
    referenceNo: ref,
    expiresAt,
    payload,
    paymentMode: settings.paymentMode,
  });
});

// GET /api/payments?applicationId=...
export const GET = await requireAuth()(async (req: NextRequest, { session }) => {
  const url = new URL(req.url);
  const appId = url.searchParams.get("applicationId");
  let q = db.select().from(schema.payments).$dynamic();
  if (appId) q = q.where(eq(schema.payments.applicationId, appId));
  else q = q.where(eq(schema.payments.userId, session.userId));
  const items = await q;
  return ok({ items });
});
