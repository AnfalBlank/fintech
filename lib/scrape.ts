// Mock product scraper for PRD §11 Step 3.
// Real implementation would call marketplace API or scraping service.

import { isHighRisk } from "./financing";

export type ScrapedProduct = {
  url: string;
  marketplace: "tokopedia" | "shopee" | "tiktok_shop" | "lazada";
  title: string;
  imageUrl: string;
  price: number;
  category: string;
  storeName: string;
  storeRating: number;
  resaleScore: number;
  highRisk: boolean;
};

const MARKETPLACE_PATTERNS: { test: RegExp; mp: ScrapedProduct["marketplace"] }[] = [
  { test: /tokopedia\.com|tokopedia\.link/i, mp: "tokopedia" },
  { test: /shopee\.co\.id|shopee\.com/i, mp: "shopee" },
  { test: /tiktok\.com|tiktokshop/i, mp: "tiktok_shop" },
  { test: /lazada\.co\.id|lazada\.com/i, mp: "lazada" },
];

export function detectMarketplace(
  url: string
): ScrapedProduct["marketplace"] | null {
  for (const p of MARKETPLACE_PATTERNS) if (p.test.test(url)) return p.mp;
  return null;
}

// Catalog of mock products keyed by hash of URL.
const CATALOG: Omit<ScrapedProduct, "url" | "marketplace">[] = [
  {
    title: "Printer Epson L3210 All-in-One",
    imageUrl:
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=600&auto=format",
    price: 2_499_000,
    category: "Printer",
    storeName: "Epson Indonesia",
    storeRating: 4.9,
    resaleScore: 75,
    highRisk: false,
  },
  {
    title: "iPhone 15 Pro 256GB Natural Titanium",
    imageUrl:
      "https://images.unsplash.com/photo-1592286927505-1def25115558?q=80&w=600&auto=format",
    price: 18999000,
    category: "Smartphone",
    storeName: "iBox Official Store",
    storeRating: 4.9,
    resaleScore: 92,
    highRisk: false,
  },
  {
    title: "MacBook Air M2 8GB/256GB",
    imageUrl:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format",
    price: 14999000,
    category: "Laptop",
    storeName: "Apple Authorized Reseller",
    storeRating: 4.8,
    resaleScore: 88,
    highRisk: false,
  },
  {
    title: "Samsung Galaxy S24 Ultra 256GB",
    imageUrl:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format",
    price: 19999000,
    category: "Smartphone",
    storeName: "Samsung Official",
    storeRating: 4.9,
    resaleScore: 86,
    highRisk: false,
  },
  {
    title: "AC Daikin 1 PK Inverter",
    imageUrl:
      "https://images.unsplash.com/photo-1631545806609-c1eb0c8e5e84?q=80&w=600&auto=format",
    price: 5499000,
    category: "Home Appliance / AC",
    storeName: "Daikin Official",
    storeRating: 4.8,
    resaleScore: 70,
    highRisk: false,
  },
  {
    title: "Mesin Kopi Komersial 2 Group",
    imageUrl:
      "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=600&auto=format",
    price: 12500000,
    category: "Peralatan Usaha / Mesin Kopi",
    storeName: "BaristaPro Indonesia",
    storeRating: 4.7,
    resaleScore: 65,
    highRisk: false,
  },
  {
    title: "Sneakers Hype Limited Edition",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format",
    price: 4500000,
    category: "Sneakers Hype",
    storeName: "Hype Beast Store",
    storeRating: 4.6,
    resaleScore: 50,
    highRisk: true,
  },
];

function hashUrl(url: string): number {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
  return h;
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct> {
  const mp = detectMarketplace(url);
  if (!mp) {
    throw new Error(
      "Marketplace tidak dikenali. Hanya Tokopedia, Shopee, TikTok Shop, atau Lazada."
    );
  }
  // Simulate network latency.
  await new Promise((r) => setTimeout(r, 600));
  const item = CATALOG[hashUrl(url) % CATALOG.length];
  const highRisk = item.highRisk || isHighRisk(item.category);
  return { ...item, url, marketplace: mp, highRisk };
}
