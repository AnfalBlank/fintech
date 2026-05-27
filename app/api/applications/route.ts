import { db, schema } from "@/db";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import {
  ADMIN_ROLES_LIST,
  fail,
  ok,
  parseJson,
  requireAuth,
} from "@/lib/api";
import { applicationId, newId } from "@/lib/ids";
import { simulate, computeRisk, isHighRisk } from "@/lib/financing";
import { scrapeProduct } from "@/lib/scrape";
import { audit, notify } from "@/lib/services";
import type { NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";

const Body = z.object({
  productUrl: z.string().url(),
  tenor: z.union([z.literal(3), z.literal(6), z.literal(12)]),
  // optional override (e.g. user opts to pay DP voluntarily)
  voluntaryDp: z.boolean().optional(),
  occupation: z.string().optional(),
  income: z.number().int().positive().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  ktpNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  consentSignature: z.boolean().optional(),
});

// POST /api/applications — Create new application (PRD §11 Step 2-7)
export const POST = await requireAuth(["customer"] as const)(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400, parsed.details);
  const data = parsed.data;

  const product = await scrapeProduct(data.productUrl).catch((e) => {
    return null as null;
  });
  if (!product) return fail("Tidak bisa scrape produk", 400);

  // Get user
  const user = (
    await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1)
  )[0];
  if (!user) return fail("User tidak ditemukan", 404);

  // Apply user-supplied details
  const userPatch: Record<string, unknown> = {};
  if (data.occupation) userPatch.occupation = data.occupation;
  if (data.income) userPatch.income = data.income;
  if (data.city) userPatch.city = data.city;
  if (data.address) userPatch.address = data.address;
  if (data.ktpNumber) userPatch.ktpNumber = data.ktpNumber;
  if (data.emergencyContactName)
    userPatch.emergencyContactName = data.emergencyContactName;
  if (data.emergencyContactPhone)
    userPatch.emergencyContactPhone = data.emergencyContactPhone;
  if (data.consentSignature !== undefined)
    userPatch.consentSignature = data.consentSignature;
  if (Object.keys(userPatch).length) {
    await db
      .update(schema.users)
      .set(userPatch)
      .where(eq(schema.users.id, user.id));
    Object.assign(user, userPatch);
  }

  // Trust level based limits (PRD §8)
  const limit =
    user.trustLevel === 3 ? 25_000_000 : user.trustLevel === 2 ? 10_000_000 : 5_000_000;
  if (product.price > limit) {
    return fail(`Limit Anda Rp ${limit.toLocaleString("id-ID")}`, 400);
  }

  const sim = simulate(product.price, data.tenor, {
    newUser: user.trustLevel === 1,
    highRisk: product.highRisk,
  });

  const risk = computeRisk({
    income: user.income ?? data.income,
    occupation: user.occupation ?? data.occupation,
    category: product.category,
    highRisk: product.highRisk,
    hasDp: sim.dpRequired,
    city: user.city ?? data.city,
    deviceTrust: 70,
  });

  // Persist product
  const productRow = {
    id: newId("PRD"),
    url: product.url,
    marketplace: product.marketplace,
    title: product.title,
    imageUrl: product.imageUrl,
    price: product.price,
    category: product.category,
    storeName: product.storeName,
    storeRating: product.storeRating,
    resaleScore: product.resaleScore,
    highRisk: product.highRisk,
  };
  await db.insert(schema.products).values(productRow);

  // Determine status
  let status: "pending" | "manual_review" | "rejected" | "approved" = "pending";
  if (risk.grade === "D") status = "rejected";
  else if (risk.grade === "A" && product.price <= 3_000_000)
    status = "approved";
  else if (risk.grade === "C" || product.highRisk) status = "manual_review";
  else status = "pending";

  const appId = applicationId();
  await db.insert(schema.applications).values({
    id: appId,
    userId: user.id,
    productId: productRow.id,
    tenor: data.tenor,
    marginPct: sim.marginPct,
    total: sim.total,
    dpRequired: sim.dpRequired,
    dpAmount: sim.dpAmount,
    dpPct: sim.dpPct,
    monthly: sim.monthly,
    financed: sim.financed,
    riskScore: risk.total,
    riskGrade: risk.grade,
    status,
  });

  await db.insert(schema.riskScores).values({
    id: newId("RSK"),
    applicationId: appId,
    income: risk.income,
    occupation: risk.occupation,
    category: risk.category,
    dp: risk.dp,
    location: risk.location,
    deviceTrust: risk.deviceTrust,
    total: risk.total,
    grade: risk.grade,
  });

  await audit(user.id, "application.create", "applications", appId, {
    risk: risk.grade,
    status,
  });

  await notify({
    userId: user.id,
    type: "approval_update",
    tone:
      status === "approved"
        ? "success"
        : status === "rejected"
          ? "danger"
          : "info",
    title:
      status === "approved"
        ? "Pengajuan auto-approved"
        : status === "rejected"
          ? "Pengajuan ditolak"
          : "Pengajuan diterima, menunggu review",
    body: `${appId} • ${product.title}`,
    link: `/installments`,
  });

  return ok({
    applicationId: appId,
    status,
    risk,
    simulation: sim,
    product: productRow,
  });
});

// GET /api/applications — List user's applications (or all for admin)
export const GET = await requireAuth()(async (req: NextRequest, { session }) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const adminMode = isAdmin(session.role);

  let q = db
    .select({
      app: schema.applications,
      product: schema.products,
      user: {
        id: schema.users.id,
        name: schema.users.name,
        phone: schema.users.phone,
        city: schema.users.city,
        trustLevel: schema.users.trustLevel,
      },
    })
    .from(schema.applications)
    .leftJoin(
      schema.products,
      eq(schema.applications.productId, schema.products.id)
    )
    .leftJoin(schema.users, eq(schema.applications.userId, schema.users.id))
    .orderBy(desc(schema.applications.submittedAt))
    .$dynamic();

  if (!adminMode) {
    q = q.where(eq(schema.applications.userId, session.userId));
  } else if (status) {
    q = q.where(eq(schema.applications.status, status as any));
  }

  const rows = await q.limit(200);
  return ok({ items: rows });
});
