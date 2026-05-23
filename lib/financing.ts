// Financing logic per PRD section 6, 7, 8.

export type Tenor = 3 | 6 | 12;

export type Simulation = {
  productPrice: number;
  marginPct: number;
  total: number;
  dpRequired: boolean;
  dpAmount: number;
  dpPct: number;
  monthly: number;
  tenor: Tenor;
  financed: number;
};

export function getMarginPct(tenor: Tenor): number {
  // PRD §6: default margin 30–35% untuk tenor 3 bulan.
  // Use 30% for 3M, scale up for longer tenors.
  if (tenor === 3) return 0.3;
  if (tenor === 6) return 0.33;
  return 0.38;
}

export function getDpRule(price: number, opts?: { newUser?: boolean; highRisk?: boolean }): {
  required: boolean;
  pct: number;
} {
  // PRD §7
  // RULE 1 — NO DP: harga ≤ 3 juta + risk bagus + tenor ≤ 3
  // RULE 2 — WAJIB DP: harga > 3 juta OR high risk OR new user OR risk medium/high
  const newUser = opts?.newUser ?? false;
  const highRisk = opts?.highRisk ?? false;

  if (price <= 3_000_000 && !newUser && !highRisk) {
    return { required: false, pct: 0 };
  }

  // DP Structure
  let pct = 0.1;
  if (price > 5_000_000 && price <= 10_000_000) pct = 0.2;
  if (price > 10_000_000) pct = 0.3;
  if (price <= 3_000_000) pct = 0.1; // for new user / high risk on small price

  return { required: true, pct };
}

export function simulate(
  price: number,
  tenor: Tenor,
  opts?: { newUser?: boolean; highRisk?: boolean }
): Simulation {
  const marginPct = getMarginPct(tenor);
  const total = Math.round(price * (1 + marginPct));
  const dp = getDpRule(price, opts);
  const dpAmount = dp.required ? Math.round(price * dp.pct) : 0;
  const financed = Math.max(0, total - dpAmount);
  const monthly = Math.round(financed / tenor);
  return {
    productPrice: price,
    marginPct,
    total,
    dpRequired: dp.required,
    dpAmount,
    dpPct: dp.pct,
    monthly,
    tenor,
    financed,
  };
}
