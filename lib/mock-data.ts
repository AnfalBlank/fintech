// Mock data for the platform — all hardcoded for MVP frontend prototype.

export type Application = {
  id: string;
  user: { name: string; phone: string; trustLevel: 1 | 2 | 3; city: string };
  product: {
    title: string;
    image: string;
    price: number;
    marketplace: "Tokopedia" | "Shopee" | "TikTok Shop" | "Lazada";
    category: string;
    rating: number;
  };
  tenor: 3 | 6 | 12;
  dp: number;
  monthly: number;
  total: number;
  margin: number;
  riskScore: number;
  riskGrade: "A" | "B" | "C" | "D";
  status:
    | "pending"
    | "manual_review"
    | "approved"
    | "rejected"
    | "delivered"
    | "active";
  submittedAt: string;
};

export type Installment = {
  id: string;
  product: { title: string; image: string };
  monthly: number;
  paid: number;
  total: number;
  tenor: number;
  paidMonths: number;
  nextDueDate: string;
  status: "active" | "overdue" | "completed";
};

export type Delivery = {
  id: string;
  applicationId: string;
  user: { name: string; phone: string; address: string };
  product: { title: string; image: string };
  courier: string;
  status: "assigned" | "in_transit" | "delivered" | "issue";
  scheduled: string;
  proof?: { photoCount: number; gps: string; signature: boolean };
};

export type FraudAlert = {
  id: string;
  reason: string;
  user: string;
  device: string;
  severity: "low" | "medium" | "high";
  detectedAt: string;
};

export type Asset = {
  id: string;
  product: string;
  imei: string;
  status: "in_warehouse" | "in_delivery" | "delivered" | "repossessed";
  resaleEstimate: number;
};

export const sampleProduct = {
  title: "iPhone 15 Pro 256GB Natural Titanium",
  image:
    "https://images.unsplash.com/photo-1592286927505-1def25115558?q=80&w=600&auto=format",
  price: 18999000,
  marketplace: "Tokopedia" as const,
  category: "Smartphone",
  rating: 4.9,
  store: "iBox Official Store",
  resaleScore: 92,
};

export const sampleProducts = [
  {
    title: "MacBook Air M2 8GB/256GB",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format",
    price: 14999000,
    marketplace: "Tokopedia",
    category: "Laptop",
  },
  {
    title: "Samsung Galaxy S24 Ultra 256GB",
    image:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format",
    price: 19999000,
    marketplace: "Shopee",
    category: "Smartphone",
  },
  {
    title: "AC Daikin 1 PK Inverter",
    image:
      "https://images.unsplash.com/photo-1631545806609-c1eb0c8e5e84?q=80&w=600&auto=format",
    price: 5499000,
    marketplace: "Tokopedia",
    category: "Home Appliance",
  },
];

export const applications: Application[] = [
  {
    id: "APP-2026-00231",
    user: {
      name: "Rafi Aditya",
      phone: "+62 812-9931-2210",
      trustLevel: 2,
      city: "Jakarta Selatan",
    },
    product: {
      title: "iPhone 15 Pro 256GB",
      image:
        "https://images.unsplash.com/photo-1592286927505-1def25115558?q=80&w=300&auto=format",
      price: 18999000,
      marketplace: "Tokopedia",
      category: "Smartphone",
      rating: 4.9,
    },
    tenor: 6,
    dp: 3799800,
    monthly: 3500000,
    total: 24700000,
    margin: 30,
    riskScore: 78,
    riskGrade: "B",
    status: "manual_review",
    submittedAt: "2026-05-22T08:42:00",
  },
  {
    id: "APP-2026-00230",
    user: {
      name: "Sari Wulandari",
      phone: "+62 813-2204-1922",
      trustLevel: 1,
      city: "Bekasi",
    },
    product: {
      title: "AC Daikin 1 PK Inverter",
      image:
        "https://images.unsplash.com/photo-1631545806609-c1eb0c8e5e84?q=80&w=300&auto=format",
      price: 5499000,
      marketplace: "Tokopedia",
      category: "Home Appliance",
      rating: 4.8,
    },
    tenor: 3,
    dp: 549900,
    monthly: 2150000,
    total: 6450000,
    margin: 30,
    riskScore: 88,
    riskGrade: "A",
    status: "approved",
    submittedAt: "2026-05-22T07:15:00",
  },
  {
    id: "APP-2026-00229",
    user: {
      name: "Bagas Pramudya",
      phone: "+62 821-1100-9876",
      trustLevel: 1,
      city: "Bandung",
    },
    product: {
      title: "Mesin Kopi Komersial",
      image:
        "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=300&auto=format",
      price: 12500000,
      marketplace: "Shopee",
      category: "Peralatan Usaha",
      rating: 4.7,
    },
    tenor: 12,
    dp: 3750000,
    monthly: 1100000,
    total: 16500000,
    margin: 32,
    riskScore: 64,
    riskGrade: "C",
    status: "pending",
    submittedAt: "2026-05-22T10:30:00",
  },
  {
    id: "APP-2026-00228",
    user: {
      name: "Dimas Wirawan",
      phone: "+62 856-7821-3340",
      trustLevel: 1,
      city: "Depok",
    },
    product: {
      title: "Sneakers Air Jordan 1 Hype",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=300&auto=format",
      price: 4500000,
      marketplace: "TikTok Shop",
      category: "Sneakers Hype",
      rating: 4.6,
    },
    tenor: 6,
    dp: 0,
    monthly: 0,
    total: 0,
    margin: 0,
    riskScore: 32,
    riskGrade: "D",
    status: "rejected",
    submittedAt: "2026-05-22T05:18:00",
  },
  {
    id: "APP-2026-00227",
    user: {
      name: "Kurnia Pratiwi",
      phone: "+62 822-4421-1101",
      trustLevel: 3,
      city: "Tangerang",
    },
    product: {
      title: "MacBook Air M2 8/256",
      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=300&auto=format",
      price: 14999000,
      marketplace: "Tokopedia",
      category: "Laptop",
      rating: 4.9,
    },
    tenor: 6,
    dp: 1499900,
    monthly: 2750000,
    total: 19500000,
    margin: 28,
    riskScore: 92,
    riskGrade: "A",
    status: "active",
    submittedAt: "2026-05-21T13:21:00",
  },
];

export const myInstallments: Installment[] = [
  {
    id: "INS-001",
    product: {
      title: "MacBook Air M2 8/256",
      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=300&auto=format",
    },
    monthly: 2750000,
    paid: 5500000,
    total: 19500000,
    tenor: 6,
    paidMonths: 2,
    nextDueDate: "2026-06-12",
    status: "active",
  },
  {
    id: "INS-002",
    product: {
      title: "AC Daikin 1 PK Inverter",
      image:
        "https://images.unsplash.com/photo-1631545806609-c1eb0c8e5e84?q=80&w=300&auto=format",
    },
    monthly: 2150000,
    paid: 6450000,
    total: 6450000,
    tenor: 3,
    paidMonths: 3,
    nextDueDate: "2026-04-10",
    status: "completed",
  },
];

export const deliveries: Delivery[] = [
  {
    id: "DLV-991",
    applicationId: "APP-2026-00230",
    user: {
      name: "Sari Wulandari",
      phone: "+62 813-2204-1922",
      address: "Jl. Anggrek No. 22, Bekasi Selatan",
    },
    product: {
      title: "AC Daikin 1 PK Inverter",
      image:
        "https://images.unsplash.com/photo-1631545806609-c1eb0c8e5e84?q=80&w=300&auto=format",
    },
    courier: "Adi Saputra",
    status: "in_transit",
    scheduled: "2026-05-23T14:00:00",
  },
  {
    id: "DLV-990",
    applicationId: "APP-2026-00227",
    user: {
      name: "Kurnia Pratiwi",
      phone: "+62 822-4421-1101",
      address: "Jl. Cipondoh Indah Blok B5, Tangerang",
    },
    product: {
      title: "MacBook Air M2 8/256",
      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=300&auto=format",
    },
    courier: "Yusuf Hidayat",
    status: "delivered",
    scheduled: "2026-05-21T15:00:00",
    proof: { photoCount: 3, gps: "-6.1781,106.6298", signature: true },
  },
  {
    id: "DLV-989",
    applicationId: "APP-2026-00228",
    user: {
      name: "Bima Santoso",
      phone: "+62 851-7321-2210",
      address: "Komplek Pesona Permai E12, Bogor",
    },
    product: {
      title: "Mesin Cuci Sharp 8 Kg",
      image:
        "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=300&auto=format",
    },
    courier: "Reza Maulana",
    status: "assigned",
    scheduled: "2026-05-24T09:00:00",
  },
];

export const fraudAlerts: FraudAlert[] = [
  {
    id: "FRD-104",
    reason: "Multiple accounts on same device",
    user: "+62 812-1100-2233",
    device: "Xiaomi 13 — fp: 9a83…b2c1",
    severity: "high",
    detectedAt: "2026-05-22T11:00:00",
  },
  {
    id: "FRD-103",
    reason: "Suspicious KTP — edited document",
    user: "+62 821-2210-1190",
    device: "iPhone 12 — fp: 1c92…ff09",
    severity: "high",
    detectedAt: "2026-05-22T08:30:00",
  },
  {
    id: "FRD-102",
    reason: "Selfie liveness mismatch",
    user: "+62 819-1198-2233",
    device: "Samsung A52 — fp: 4b71…ee21",
    severity: "medium",
    detectedAt: "2026-05-21T20:14:00",
  },
];

export const assets: Asset[] = [
  {
    id: "AST-2210",
    product: "iPhone 15 Pro 256GB",
    imei: "352099001761481",
    status: "in_warehouse",
    resaleEstimate: 16500000,
  },
  {
    id: "AST-2209",
    product: "MacBook Air M2 8/256",
    imei: "C02XL0J1JG5J",
    status: "delivered",
    resaleEstimate: 12500000,
  },
  {
    id: "AST-2208",
    product: "AC Daikin 1 PK Inverter",
    imei: "DK-2024-09812",
    status: "in_delivery",
    resaleEstimate: 4200000,
  },
];

export const collections = [
  {
    id: "COL-1101",
    user: "Anwar Hidayat",
    phone: "+62 813-2200-1108",
    overdueDays: 12,
    amount: 1300000,
    aging: "0-30",
    lastReminder: "2026-05-20",
    status: "in_progress",
  },
  {
    id: "COL-1100",
    user: "Mira Kusuma",
    phone: "+62 822-9911-3320",
    overdueDays: 41,
    amount: 2750000,
    aging: "30-60",
    lastReminder: "2026-05-18",
    status: "escalated",
  },
  {
    id: "COL-1099",
    user: "Galang Pratama",
    phone: "+62 856-1100-7766",
    overdueDays: 75,
    amount: 4500000,
    aging: "60-90",
    lastReminder: "2026-05-15",
    status: "blacklist_review",
  },
];
