// PDF invoice / receipt for a single payment.
// Customer can download their own; admins can download anyone's.
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { fail, requireAuth } from "@/lib/api";
import { renderInvoice } from "@/lib/pdf/invoice";
import { isAdmin } from "@/lib/auth";
import { audit } from "@/lib/services";
import type { NextRequest } from "next/server";

export const GET = await requireAuth()(async (
  _req: NextRequest,
  { params, session }
) => {
  const id = params?.id;
  if (!id) return fail("ID required", 400);

  const payment = (
    await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.id, id))
      .limit(1)
  )[0];
  if (!payment) return fail("Payment tidak ditemukan", 404);
  if (payment.status !== "paid") return fail("Payment belum lunas", 400);
  if (!isAdmin(session.role) && payment.userId !== session.userId) {
    return fail("Forbidden", 403);
  }

  const [user, app, product, installment] = await Promise.all([
    db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, payment.userId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.id, payment.applicationId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select()
      .from(schema.products)
      .where(
        eq(
          schema.products.id,
          (
            await db
              .select({ pid: schema.applications.productId })
              .from(schema.applications)
              .where(eq(schema.applications.id, payment.applicationId))
              .limit(1)
          )[0]?.pid ?? ""
        )
      )
      .limit(1)
      .then((rows) => rows[0]),
    payment.installmentId
      ? db
          .select()
          .from(schema.installments)
          .where(eq(schema.installments.id, payment.installmentId))
          .limit(1)
          .then((rows) => rows[0])
      : Promise.resolve(undefined),
  ]);

  if (!user || !app || !product) return fail("Data lengkap tidak ditemukan", 404);

  const buffer = await renderInvoice({
    type: payment.type === "dp" ? "dp" : "installment",
    invoiceNo: payment.referenceNo,
    paidAt: payment.paidAt ?? new Date(),
    customer: {
      name: user.name,
      phone: user.phone,
      email: user.email,
      address: user.address ?? undefined,
    },
    product: {
      title: product.title,
      marketplace: product.marketplace,
    },
    application: {
      id: app.id,
      tenor: app.tenor,
      total: app.total,
      dpAmount: app.dpAmount,
      monthly: app.monthly,
    },
    amountPaid: payment.amount,
    paymentMethod: payment.method,
    channel: payment.channel ?? undefined,
    referenceNo: payment.referenceNo,
    installmentSeq: installment?.sequence,
  });

  await audit(session.userId, "payment.invoice.download", "payments", id);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="invoice-${payment.referenceNo}.pdf"`,
      "cache-control": "private, no-cache",
    },
  });
});
