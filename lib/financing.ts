// Financing logic per PRD §6, §7, §8, §15, §16, §25. Shared by API and UI.

export type Tenor = 3 | 6 | 12;
export type TrustLevel = 1 | 2 | 3;

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

// PRD §6: 30–35% untuk tenor 3 bulan, scaling untuk tenor lebih panjang.
// PRD §8: Level 3 (Priority) → margin lebih rendah → diskon 3%.
export function getMarginPct(tenor: Tenor, trustLevel: TrustLevel = 1): number {
  let base = 0.3;
  if (tenor === 6) base = 0.33;
  if (tenor === 12) base = 0.38;
  if (trustLevel === 3) base = Math.max(0.25, base - 0.03);
  return base;
}

// PRD §8: limit per trust level.
//   Level 1 — Rp 3 juta (juga PRD §25 Initial User Limit)
//   Level 2 — Rp 5 juta
//   Level 3 — Rp 25 juta (PRD §8 "limit besar")
export function getLimitForTrustLevel(level: TrustLevel): number {
  if (level === 3) return 25_000_000;
  if (level === 2) return 5_000_000;
  return 3_000_000;
}

// PRD §8 Level 1: tenor max 3 bulan untuk new user.
export function getMaxTenorForTrustLevel(level: TrustLevel): Tenor {
  if (level === 1) return 3;
  if (level === 2) return 6;
  return 12;
}

// PRD §7
//   RULE 1 (No DP): harga ≤ 3jt + tenor ≤ 3 + bukan high risk + bukan new user
//                   (risk score bagus dicek separately via grade A/B di approval)
//   RULE 2 (Wajib DP): selain itu
export function getDpRule(
  price: number,
  tenor: Tenor,
  opts?: { newUser?: boolean; highRisk?: boolean }
): { required: boolean; pct: number } {
  const newUser = opts?.newUser ?? false;
  const highRisk = opts?.highRisk ?? false;

  // RULE 1: tanpa DP
  if (price <= 3_000_000 && tenor <= 3 && !newUser && !highRisk) {
    return { required: false, pct: 0 };
  }
  // RULE 2: DP wajib, struktur sesuai PRD §7
  let pct = 0.1; // default for ≤3jt special case (new user / high risk)
  if (price > 3_000_000 && price <= 5_000_000) pct = 0.1;
  if (price > 5_000_000 && price <= 10_000_000) pct = 0.2;
  if (price > 10_000_000) pct = 0.3;
  return { required: true, pct };
}

export function simulate(
  price: number,
  tenor: Tenor,
  opts?: { newUser?: boolean; highRisk?: boolean; trustLevel?: TrustLevel }
): Simulation {
  const marginPct = getMarginPct(tenor, opts?.trustLevel ?? 1);
  const total = Math.round(price * (1 + marginPct));
  const dp = getDpRule(price, tenor, opts);
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

// PRD §9 SAFE category
const SAFE_CATEGORIES = [
  // Elektronik produktif
  "smartphone",
  "laptop",
  "tablet",
  "printer",
  // Home appliance
  "ac",
  "kulkas",
  "mesin cuci",
  // Peralatan usaha
  "freezer",
  "mesin kopi",
  "mesin usaha",
  "alat kasir",
  // Common umbrella label from scraper
  "home appliance",
  "peralatan usaha",
];

// PRD §10 HIGH RISK
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

// PRD §25 Coverage Area MVP: Jabodetabek, Bandung, Bekasi
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

  // PRD §15 weights: 25/20/20/15/10/10
  const total = Math.round(
    income * 0.25 +
      occ * 0.2 +
      category * 0.2 +
      dp * 0.15 +
      location * 0.1 +
      deviceTrust * 0.1
  );

  // PRD §16: A ≥80, B 65–79, C 50–64, D <50
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

// PRD §25: maximum cicilan = 35% dari penghasilan bulanan
export function maxAffordableMonthly(income?: number | null): number | null {
  if (!income || income <= 0) return null;
  return Math.floor(income * 0.35);
}

export function isAffordable(monthly: number, income?: number | null): boolean {
  const max = maxAffordableMonthly(income);
  if (max == null) return true; // unknown income, skip check
  return monthly <= max;
}
