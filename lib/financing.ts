// Financing logic per PRD §6, §7, §8, §15, §16. Shared by API and UI.

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
  if (tenor === 3) return 0.3;
  if (tenor === 6) return 0.33;
  return 0.38;
}

export function getDpRule(
  price: number,
  opts?: { newUser?: boolean; highRisk?: boolean }
): { required: boolean; pct: number } {
  const newUser = opts?.newUser ?? false;
  const highRisk = opts?.highRisk ?? false;

  if (price <= 3_000_000 && !newUser && !highRisk) {
    return { required: false, pct: 0 };
  }
  let pct = 0.1;
  if (price > 5_000_000 && price <= 10_000_000) pct = 0.2;
  if (price > 10_000_000) pct = 0.3;
  if (price <= 3_000_000) pct = 0.1;
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

// PRD §15 — Risk components
export type RiskInputs = {
  income?: number; // monthly income IDR
  occupation?: string;
  category?: string;
  highRisk?: boolean;
  hasDp?: boolean;
  city?: string;
  deviceTrust?: number; // 0-100
};

const SAFE_CATEGORIES = [
  "smartphone",
  "laptop",
  "tablet",
  "printer",
  "ac",
  "kulkas",
  "mesin cuci",
  "freezer",
  "mesin kopi",
  "alat kasir",
];

const HIGH_RISK_CATEGORIES = [
  "luxury fashion",
  "sneakers hype",
  "gaming high-end",
  "jewelry",
  "collectibles",
  "crypto mining",
];

export function isHighRisk(category?: string): boolean {
  if (!category) return false;
  const c = category.toLowerCase();
  return HIGH_RISK_CATEGORIES.some((k) => c.includes(k));
}

export type RiskBreakdown = {
  income: number;
  occupation: number;
  category: number;
  dp: number;
  location: number;
  deviceTrust: number;
  total: number;
  grade: "A" | "B" | "C" | "D";
};

const COVERAGE_CITIES = [
  "jakarta",
  "depok",
  "tangerang",
  "bogor",
  "bekasi",
  "bandung",
];

export function computeRisk(input: RiskInputs): RiskBreakdown {
  // Component scores 0..100
  const income = (() => {
    const v = input.income ?? 0;
    if (v >= 10_000_000) return 95;
    if (v >= 7_000_000) return 85;
    if (v >= 5_000_000) return 75;
    if (v >= 3_000_000) return 60;
    if (v >= 1_500_000) return 45;
    return 25;
  })();

  const occ = (() => {
    const o = (input.occupation ?? "").toLowerCase();
    if (/karyawan tetap|pns|guru/.test(o)) return 90;
    if (/freelancer|reseller|umkm|driver/.test(o)) return 70;
    if (/pekerja lapangan|kontrak/.test(o)) return 60;
    if (/mahasiswa/.test(o)) return 45;
    return 50;
  })();

  const category = (() => {
    if (input.highRisk || isHighRisk(input.category)) return 25;
    const c = (input.category ?? "").toLowerCase();
    if (SAFE_CATEGORIES.some((k) => c.includes(k))) return 90;
    return 65;
  })();

  const dp = input.hasDp ? 90 : 50;

  const location = (() => {
    const c = (input.city ?? "").toLowerCase();
    return COVERAGE_CITIES.some((k) => c.includes(k)) ? 85 : 55;
  })();

  const deviceTrust = Math.max(0, Math.min(100, input.deviceTrust ?? 60));

  // PRD weights: 25/20/20/15/10/10
  const total = Math.round(
    income * 0.25 +
      occ * 0.2 +
      category * 0.2 +
      dp * 0.15 +
      location * 0.1 +
      deviceTrust * 0.1
  );

  const grade =
    total >= 80 ? "A" : total >= 65 ? "B" : total >= 50 ? "C" : "D";

  return {
    income,
    occupation: occ,
    category,
    dp,
    location,
    deviceTrust,
    total,
    grade,
  };
}

// PRD §25: max installment = 35% of monthly income
export function maxAffordableMonthly(income?: number): number {
  if (!income) return Number.MAX_SAFE_INTEGER;
  return Math.floor(income * 0.35);
}
