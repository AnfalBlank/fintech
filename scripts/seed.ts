import { config } from "dotenv";
config({ path: ".env.local" });

// Lazy-load DB after env is set.
import bcrypt from "bcryptjs";
import {
  applicationId,
  assetId,
  deliveryId,
  fraudId,
  newId,
  notificationId,
  paymentId,
  userId,
} from "../lib/ids";
import { simulate, computeRisk } from "../lib/financing";

async function clear() {
  const { db, schema } = await import("../db");
  const tables = [
    schema.notifications,
    schema.auditLogs,
    schema.fraudLogs,
    schema.blacklists,
    schema.deliveryProofs,
    schema.deliveries,
    schema.payments,
    schema.installments,
    schema.riskScores,
    schema.assets,
    schema.applications,
    schema.products,
    schema.devices,
    schema.otps,
    schema.users,
  ];
  for (const t of tables) await db.delete(t);
}

async function main() {
  console.log("→ Clearing existing data");
  await clear();
  const { db, schema } = await import("../db");

  console.log("→ Seeding users");
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = [
    {
      id: userId(),
      name: "Andini Pratama",
      email: "andini@manggala.id",
      phone: "+628111000001",
      role: "finance_admin" as const,
    },
    {
      id: userId(),
      name: "Bagus Hartono",
      email: "bagus@manggala.id",
      phone: "+628111000002",
      role: "super_admin" as const,
    },
    {
      id: userId(),
      name: "Cahyo Nugroho",
      email: "cahyo@manggala.id",
      phone: "+628111000003",
      role: "collection_team" as const,
    },
    {
      id: userId(),
      name: "Adi Saputra",
      email: "adi@manggala.id",
      phone: "+628111000004",
      role: "courier" as const,
    },
    {
      id: userId(),
      name: "Eka Suryani",
      email: "eka@manggala.id",
      phone: "+628111000005",
      role: "surveyor" as const,
    },
    {
      id: userId(),
      name: "Yusuf Hidayat",
      email: "yusuf@manggala.id",
      phone: "+628111000006",
      role: "delivery_team" as const,
    },
  ];

  for (const u of users) {
    await db.insert(schema.users).values({
      ...u,
      passwordHash,
      consentTnc: true,
      consentData: true,
      emailVerified: true,
      phoneVerified: true,
      lastLoginAt: new Date(),
    });
  }

  // Customers
  const customers = [
    {
      id: userId(),
      name: "Rafi Aditya",
      email: "rafi@example.com",
      phone: "+628129931221",
      role: "customer" as const,
      trustLevel: 2,
      limit: 5_000_000,
      income: 12_000_000,
      occupation: "Karyawan Tetap",
      city: "Jakarta Selatan",
      address: "Jl. Kemang Selatan No. 12",
    },
    {
      id: userId(),
      name: "Sari Wulandari",
      email: "sari@example.com",
      phone: "+628132204192",
      role: "customer" as const,
      trustLevel: 1,
      limit: 3_000_000,
      income: 6_500_000,
      occupation: "Reseller Online",
      city: "Bekasi",
      address: "Jl. Anggrek No. 22",
    },
    {
      id: userId(),
      name: "Bagas Pramudya",
      email: "bagas@example.com",
      phone: "+628211100987",
      role: "customer" as const,
      trustLevel: 1,
      limit: 3_000_000,
      income: 4_500_000,
      occupation: "UMKM",
      city: "Bandung",
      address: "Jl. Setiabudi No. 88",
    },
    {
      id: userId(),
      name: "Kurnia Pratiwi",
      email: "kurnia@example.com",
      phone: "+628224421110",
      role: "customer" as const,
      trustLevel: 3,
      limit: 25_000_000,
      income: 18_000_000,
      occupation: "Karyawan Tetap",
      city: "Tangerang",
      address: "Jl. Cipondoh Indah B5",
    },
  ];

  for (const c of customers) {
    await db.insert(schema.users).values({
      ...c,
      passwordHash,
      consentTnc: true,
      consentData: true,
      emailVerified: true,
      phoneVerified: true,
    });
  }

  console.log("→ Seeding products + applications");

  const productSeeds = [
    {
      id: newId("PRD"),
      url: "https://tokopedia.com/sample/iphone-15-pro",
      marketplace: "tokopedia" as const,
      title: "iPhone 15 Pro 256GB",
      imageUrl:
        "https://images.unsplash.com/photo-1592286927505-1def25115558?q=80&w=600&auto=format",
      price: 18_999_000,
      category: "Smartphone",
      storeName: "iBox Official",
      storeRating: 4.9,
      resaleScore: 92,
      highRisk: false,
      customer: customers[0],
      tenor: 6 as const,
    },
    {
      id: newId("PRD"),
      url: "https://tokopedia.com/sample/ac-daikin",
      marketplace: "tokopedia" as const,
      title: "AC Daikin 1 PK Inverter",
      imageUrl:
        "https://images.unsplash.com/photo-1631545806609-c1eb0c8e5e84?q=80&w=600&auto=format",
      price: 5_499_000,
      category: "Home Appliance / AC",
      storeName: "Daikin Official",
      storeRating: 4.8,
      resaleScore: 70,
      highRisk: false,
      customer: customers[1],
      tenor: 3 as const,
    },
    {
      id: newId("PRD"),
      url: "https://shopee.co.id/sample/mesin-kopi",
      marketplace: "shopee" as const,
      title: "Mesin Kopi Komersial",
      imageUrl:
        "https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=600&auto=format",
      price: 12_500_000,
      category: "Peralatan Usaha / Mesin Kopi",
      storeName: "BaristaPro",
      storeRating: 4.7,
      resaleScore: 65,
      highRisk: false,
      customer: customers[2],
      tenor: 12 as const,
    },
    {
      id: newId("PRD"),
      url: "https://tokopedia.com/sample/macbook-air",
      marketplace: "tokopedia" as const,
      title: "MacBook Air M2 8/256",
      imageUrl:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format",
      price: 14_999_000,
      category: "Laptop",
      storeName: "Apple Authorized",
      storeRating: 4.9,
      resaleScore: 88,
      highRisk: false,
      customer: customers[3],
      tenor: 6 as const,
    },
  ];

  for (const p of productSeeds) {
    await db.insert(schema.products).values({
      id: p.id,
      url: p.url,
      marketplace: p.marketplace,
      title: p.title,
      imageUrl: p.imageUrl,
      price: p.price,
      category: p.category,
      storeName: p.storeName,
      storeRating: p.storeRating,
      resaleScore: p.resaleScore,
      highRisk: p.highRisk,
    });

    const sim = simulate(p.price, p.tenor, {
      newUser: p.customer.trustLevel === 1,
      highRisk: p.highRisk,
      trustLevel: p.customer.trustLevel as 1 | 2 | 3,
    });
    const risk = computeRisk({
      income: p.customer.income,
      occupation: p.customer.occupation,
      category: p.category,
      hasDp: sim.dpRequired,
      city: p.customer.city,
      deviceTrust: 75,
    });

    const appId = applicationId();
    const status =
      p.customer.name === "Sari Wulandari"
        ? "approved"
        : p.customer.name === "Kurnia Pratiwi"
          ? "active"
          : p.customer.name === "Bagas Pramudya"
            ? "manual_review"
            : "manual_review";

    await db.insert(schema.applications).values({
      id: appId,
      userId: p.customer.id,
      productId: p.id,
      tenor: p.tenor,
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

    if (status === "approved" || status === "active") {
      // Asset
      const aId = assetId();
      await db.insert(schema.assets).values({
        id: aId,
        applicationId: appId,
        productTitle: p.title,
        imeiOrSerial:
          p.title.includes("iPhone") || p.title.includes("MacBook")
            ? "C02XL0J1JG5J"
            : null,
        purchaseInvoiceNo: "INV-TKP-99102",
        purchasedAt: new Date(),
        qcStatus: "passed",
        qcAt: new Date(),
        qcPhotoCount: 4,
        resaleEstimate: Math.round(p.price * 0.85),
        status: status === "active" ? "delivered" : "in_warehouse",
      });

      if (status === "active") {
        // Delivery + proof
        const dId = deliveryId();
        await db.insert(schema.deliveries).values({
          id: dId,
          applicationId: appId,
          assetId: aId,
          courierId: users[3].id,
          customerName: p.customer.name,
          customerPhone: p.customer.phone,
          address: p.customer.address,
          scheduledAt: new Date(),
          status: "delivered",
          completedAt: new Date(),
        });
        await db.insert(schema.deliveryProofs).values({
          id: newId("PRF"),
          deliveryId: dId,
          photos: JSON.stringify(["photo1.jpg", "photo2.jpg", "photo3.jpg"]),
          gpsLat: -6.1781,
          gpsLng: 106.6298,
          gpsCapturedAt: new Date(),
          signatureDataUrl: "data:image/png;base64,iVBORw0KGgo=",
          qrVerified: true,
        });

        // Installment schedule (2 paid out of 6)
        for (let i = 0; i < p.tenor; i++) {
          const due = new Date();
          due.setMonth(due.getMonth() + (i - 1));
          await db.insert(schema.installments).values({
            id: newId("INS"),
            applicationId: appId,
            userId: p.customer.id,
            sequence: i + 1,
            amount: sim.monthly,
            dueDate: due,
            status: i < 2 ? "paid" : "upcoming",
            paidAt: i < 2 ? due : null,
          });
        }
      } else {
        // Pending delivery - assigned to courier
        await db.insert(schema.deliveries).values({
          id: deliveryId(),
          applicationId: appId,
          assetId: aId,
          courierId: users[3].id, // Adi Saputra
          customerName: p.customer.name,
          customerPhone: p.customer.phone,
          address: p.customer.address,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: "in_transit",
        });
      }
    }
  }

  console.log("→ Seeding fraud alerts");
  await db.insert(schema.fraudLogs).values([
    {
      id: fraudId(),
      reason: "Multiple accounts on same device",
      severity: "high",
      status: "open",
    },
    {
      id: fraudId(),
      reason: "Suspicious KTP — edited document",
      severity: "high",
      status: "open",
    },
    {
      id: fraudId(),
      reason: "Selfie liveness mismatch",
      severity: "medium",
      status: "open",
    },
  ]);

  console.log("→ Seeding notifications");
  await db.insert(schema.notifications).values([
    {
      id: notificationId(),
      userId: customers[0].id,
      type: "delivery_update",
      tone: "info",
      title: "Barang dalam perjalanan",
      body: "ETA hari ini 14:00",
    },
    {
      id: notificationId(),
      userId: customers[3].id,
      type: "payment_reminder",
      tone: "warning",
      title: "Cicilan ke-3 jatuh tempo",
      body: "Segera lakukan pembayaran",
      link: "/payments",
    },
  ]);

  console.log("✓ Seed complete");
  console.log("\nLogin credentials (password: password123):");
  console.log("  Customer: rafi@example.com / +628129931221");
  console.log("  Super admin: bagus@manggala.id");
  console.log("  Finance admin: andini@manggala.id");
  console.log("  Collection: cahyo@manggala.id");
  console.log("  Delivery: yusuf@manggala.id");
  console.log("  Surveyor: eka@manggala.id");
  console.log("  Courier: adi@manggala.id");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
