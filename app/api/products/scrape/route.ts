import { z } from "zod";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { fail, ok, parseJson, requireAuth } from "@/lib/api";
import { scrapeProduct } from "@/lib/scrape";
import {
  simulate,
  getMaxTenorForTrustLevel,
  type TrustLevel,
} from "@/lib/financing";
import type { NextRequest } from "next/server";

const Body = z.object({ url: z.string().url() });

export const POST = await requireAuth()(async (
  req: NextRequest,
  { session }
) => {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);

  // Look up trust level for accurate margin preview.
  const user = (
    await db
      .select({ trustLevel: schema.users.trustLevel })
      .from(schema.users)
      .where(eq(schema.users.id, session.userId))
      .limit(1)
  )[0];
  const trustLevel = (user?.trustLevel ?? 1) as TrustLevel;
  const maxTenor = getMaxTenorForTrustLevel(trustLevel);

  try {
    const product = await scrapeProduct(parsed.data.url);
    const tenors = [3, 6, 12] as const;
    const simulations = tenors.map((t) => ({
      ...simulate(product.price, t, {
        highRisk: product.highRisk,
        newUser: trustLevel === 1,
        trustLevel,
      }),
      allowed: t <= maxTenor,
    }));
    return ok({ product, simulations, trustLevel });
  } catch (e) {
    return fail((e as Error).message, 400);
  }
});
