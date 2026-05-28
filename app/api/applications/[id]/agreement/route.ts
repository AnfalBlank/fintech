// PDF perjanjian cicilan digital — generated lazily on download.
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { fail, requireAuth } from "@/lib/api";
import { renderAgreement } from "@/lib/pdf/agreement";
import { isAdmin } from "@/lib/auth";
import { audit } from "@/lib/services";
import type { NextRequest } from "next/server";

export const GET = await requireAuth()(async (
  _req: NextRequest,
  { params, session }
) => {
  const id = params?.id;
  if (!id) return fail("ID required", 400);

  const app = (
    await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.id, id))
      .limit(1)
  )[0];
  if (!app) return fail("Application tidak ditemukan", 404);
  if (!isAdmin(session.role) && app.userId !== session.userId) {
    return fail("Forbidden", 403);
  }

  // Only allowed once application is at least approved.
  if (
    !["approved", "dp_pending", "purchasing", "warehouse", "delivering", "active", "completed"].includes(
      app.status
    )
  ) {
    return fail("Perjanjian tersedia setelah pengajuan disetujui", 400);
  }

  const [user, product, installments] = await Promise.all([
    db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, app.userId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, app.productId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select()
      .from(schema.installments)
      .where(eq(schema.installments.applicationId, app.id))
      .orderBy(schema.installments.sequence),
  ]);

  if (!user || !product) return fail("Data lengkap tidak ditemukan", 404);

  // Generate placeholder schedule if none yet (pre-delivery).
  const schedule =
    installments.length > 0
      ? installments.map((i) => ({
          sequence: i.sequence,
          amount: i.amount,
          dueDate: i.dueDate,
        }))
      : Array.from({ length: app.tenor }, (_, idx) => {
          const d = new Date();
          d.setMonth(d.getMonth() + idx + 1);
          return {
            sequence: idx + 1,
            amount: app.monthly,
            dueDate: d,
          };
        });

  const buffer = await renderAgreement({
    agreementNo: `AGR-${app.id}`,
    signedAt: app.reviewedAt ?? app.submittedAt,
    customer: {
      name: user.name,
      phone: user.phone,
      email: user.email,
      address: user.address ?? undefined,
      ktpNumber: user.ktpNumber ?? undefined,
    },
    application: {
      id: app.id,
      tenor: app.tenor,
      total: app.total,
      dpAmount: app.dpAmount,
      monthly: app.monthly,
      marginPct: app.marginPct,
      financed: app.financed,
    },
    product: {
      title: product.title,
      marketplace: product.marketplace,
      price: product.price,
    },
    schedule,
  });

  await audit(session.userId, "agreement.download", "applications", id);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="perjanjian-${app.id}.pdf"`,
      "cache-control": "private, no-cache",
    },
  });
});
