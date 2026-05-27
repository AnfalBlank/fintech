import { z } from "zod";
import { fail, ok, parseJson, requireAuth } from "@/lib/api";
import { scrapeProduct } from "@/lib/scrape";
import { simulate, computeRisk } from "@/lib/financing";
import type { NextRequest } from "next/server";

const Body = z.object({ url: z.string().url() });

export const POST = await requireAuth()(async (req: NextRequest) => {
  const parsed = await parseJson(req, Body);
  if (!parsed.ok) return fail(parsed.error, 400);
  try {
    const product = await scrapeProduct(parsed.data.url);
    const tenors = [3, 6, 12] as const;
    const simulations = tenors.map((t) =>
      simulate(product.price, t, { highRisk: product.highRisk })
    );
    return ok({ product, simulations });
  } catch (e) {
    return fail((e as Error).message, 400);
  }
});
