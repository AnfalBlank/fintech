import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";

// PRD §24 — Core tables: users, applications, products, installments, payments,
// deliveries, delivery_proofs, risk_scores, fraud_logs, assets, devices,
// blacklists, notifications.

// ============== USERS ==============
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").notNull().unique(),
    passwordHash: text("password_hash"), // null while OTP-only
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    phoneVerified: integer("phone_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    role: text("role", {
      enum: [
        "customer",
        "courier",
        "super_admin",
        "finance_admin",
        "collection_team",
        "delivery_team",
        "surveyor",
      ],
    })
      .notNull()
      .default("customer"),
    trustLevel: integer("trust_level").notNull().default(1),
    limit: integer("limit").notNull().default(3_000_000),
    income: integer("income"), // monthly income IDR
    occupation: text("occupation"),
    address: text("address"),
    city: text("city"),
    ktpNumber: text("ktp_number"),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    consentTnc: integer("consent_tnc", { mode: "boolean" })
      .notNull()
      .default(false),
    consentData: integer("consent_data", { mode: "boolean" })
      .notNull()
      .default(false),
    consentSignature: integer("consent_signature", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status", {
      enum: ["active", "suspended", "blacklisted"],
    })
      .notNull()
      .default("active"),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    emailIdx: index("users_email_idx").on(t.email),
    phoneIdx: index("users_phone_idx").on(t.phone),
    roleIdx: index("users_role_idx").on(t.role),
  })
);

// ============== DEVICES ==============
export const devices = sqliteTable(
  "devices",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    fingerprint: text("fingerprint").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    name: text("name"), // e.g. "iPhone 14 Pro"
    trustScore: integer("trust_score").notNull().default(50),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    fpIdx: index("devices_fp_idx").on(t.fingerprint),
    userIdx: index("devices_user_idx").on(t.userId),
  })
);

// ============== PRODUCTS ==============
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  marketplace: text("marketplace", {
    enum: ["tokopedia", "shopee", "tiktok_shop", "lazada"],
  }).notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  price: integer("price").notNull(),
  category: text("category").notNull(),
  storeName: text("store_name"),
  storeRating: real("store_rating"),
  resaleScore: integer("resale_score"),
  highRisk: integer("high_risk", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============== APPLICATIONS ==============
export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    tenor: integer("tenor").notNull(), // months: 3, 6, 12
    marginPct: real("margin_pct").notNull(),
    total: integer("total").notNull(),
    dpRequired: integer("dp_required", { mode: "boolean" }).notNull(),
    dpAmount: integer("dp_amount").notNull().default(0),
    dpPct: real("dp_pct").notNull().default(0),
    monthly: integer("monthly").notNull(),
    financed: integer("financed").notNull(),
    riskScore: integer("risk_score"),
    riskGrade: text("risk_grade", { enum: ["A", "B", "C", "D"] }),
    status: text("status", {
      enum: [
        "pending",
        "manual_review",
        "approved",
        "rejected",
        "dp_pending",
        "purchasing",
        "warehouse",
        "delivering",
        "delivered",
        "active",
        "completed",
      ],
    })
      .notNull()
      .default("pending"),
    rejectReason: text("reject_reason"),
    reviewedBy: text("reviewed_by").references(() => users.id),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    submittedAt: integer("submitted_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    userIdx: index("applications_user_idx").on(t.userId),
    statusIdx: index("applications_status_idx").on(t.status),
  })
);

// ============== RISK SCORES ==============
export const riskScores = sqliteTable("risk_scores", {
  id: text("id").primaryKey(),
  applicationId: text("application_id")
    .notNull()
    .references(() => applications.id),
  income: integer("income"),
  occupation: integer("occupation"),
  category: integer("category"),
  dp: integer("dp"),
  location: integer("location"),
  deviceTrust: integer("device_trust"),
  total: integer("total").notNull(),
  grade: text("grade", { enum: ["A", "B", "C", "D"] }).notNull(),
  computedAt: integer("computed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============== INSTALLMENTS ==============
export const installments = sqliteTable(
  "installments",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    sequence: integer("sequence").notNull(), // 1..tenor
    amount: integer("amount").notNull(),
    dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    status: text("status", {
      enum: ["upcoming", "due", "paid", "overdue", "waived"],
    })
      .notNull()
      .default("upcoming"),
    penaltyAmount: integer("penalty_amount").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    appIdx: index("installments_app_idx").on(t.applicationId),
    userIdx: index("installments_user_idx").on(t.userId),
    statusIdx: index("installments_status_idx").on(t.status),
  })
);

// ============== PAYMENTS ==============
export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id),
    installmentId: text("installment_id").references(() => installments.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type", { enum: ["dp", "installment", "penalty"] }).notNull(),
    method: text("method", {
      enum: ["va", "qris", "ewallet", "transfer"],
    }).notNull(),
    channel: text("channel"), // BCA, BNI, GoPay, etc.
    amount: integer("amount").notNull(),
    referenceNo: text("reference_no").notNull().unique(),
    status: text("status", {
      enum: ["pending", "paid", "failed", "expired"],
    })
      .notNull()
      .default("pending"),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    appIdx: index("payments_app_idx").on(t.applicationId),
    statusIdx: index("payments_status_idx").on(t.status),
  })
);

// ============== ASSETS ==============
export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  applicationId: text("application_id")
    .notNull()
    .references(() => applications.id),
  productTitle: text("product_title").notNull(),
  imeiOrSerial: text("imei_or_serial"),
  purchaseInvoiceNo: text("purchase_invoice_no"),
  purchasedAt: integer("purchased_at", { mode: "timestamp" }),
  purchasedBy: text("purchased_by").references(() => users.id),
  qcStatus: text("qc_status", {
    enum: ["pending", "passed", "failed"],
  })
    .notNull()
    .default("pending"),
  qcCheckedBy: text("qc_checked_by").references(() => users.id),
  qcAt: integer("qc_at", { mode: "timestamp" }),
  qcPhotoCount: integer("qc_photo_count").notNull().default(0),
  resaleEstimate: integer("resale_estimate"),
  status: text("status", {
    enum: [
      "to_purchase",
      "purchased",
      "in_warehouse",
      "in_delivery",
      "delivered",
      "repossessed",
    ],
  })
    .notNull()
    .default("to_purchase"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============== DELIVERIES ==============
export const deliveries = sqliteTable(
  "deliveries",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id),
    assetId: text("asset_id").references(() => assets.id),
    courierId: text("courier_id").references(() => users.id),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    address: text("address").notNull(),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
    status: text("status", {
      enum: ["pending", "assigned", "picked_up", "in_transit", "delivered", "issue"],
    })
      .notNull()
      .default("pending"),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    courierIdx: index("deliveries_courier_idx").on(t.courierId),
    statusIdx: index("deliveries_status_idx").on(t.status),
  })
);

// ============== DELIVERY PROOFS ==============
export const deliveryProofs = sqliteTable("delivery_proofs", {
  id: text("id").primaryKey(),
  deliveryId: text("delivery_id")
    .notNull()
    .references(() => deliveries.id),
  photos: text("photos").notNull().default("[]"), // JSON array of urls/keys
  gpsLat: real("gps_lat"),
  gpsLng: real("gps_lng"),
  gpsCapturedAt: integer("gps_captured_at", { mode: "timestamp" }),
  signatureDataUrl: text("signature_data_url"),
  qrVerified: integer("qr_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============== FRAUD LOGS ==============
export const fraudLogs = sqliteTable(
  "fraud_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    deviceId: text("device_id").references(() => devices.id),
    reason: text("reason").notNull(),
    severity: text("severity", { enum: ["low", "medium", "high"] }).notNull(),
    status: text("status", {
      enum: ["open", "reviewed", "blocked", "false_positive"],
    })
      .notNull()
      .default("open"),
    detectedAt: integer("detected_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    resolvedBy: text("resolved_by").references(() => users.id),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  },
  (t) => ({
    userIdx: index("fraud_user_idx").on(t.userId),
    statusIdx: index("fraud_status_idx").on(t.status),
  })
);

// ============== BLACKLISTS ==============
export const blacklists = sqliteTable("blacklists", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  ktpNumber: text("ktp_number"),
  phone: text("phone"),
  deviceFingerprint: text("device_fingerprint"),
  reason: text("reason").notNull(),
  addedBy: text("added_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============== NOTIFICATIONS ==============
export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type", {
      enum: [
        "approval_update",
        "delivery_update",
        "payment_reminder",
        "payment_success",
        "fraud_alert",
        "system",
      ],
    }).notNull(),
    tone: text("tone", {
      enum: ["success", "info", "warning", "danger"],
    })
      .notNull()
      .default("info"),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: integer("read_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    userIdx: index("notifications_user_idx").on(t.userId),
  })
);

// ============== OTPs ==============
export const otps = sqliteTable("otps", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============== AUDIT LOGS (PRD §21) ==============
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => users.id),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    metadata: text("metadata"), // JSON
    ipAddress: text("ip_address"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    actorIdx: index("audit_actor_idx").on(t.actorId),
  })
);

// ============== APP SETTINGS (single-row config table) ==============
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON-encoded
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============== REFUNDS ==============
export const refunds = sqliteTable("refunds", {
  id: text("id").primaryKey(),
  applicationId: text("application_id")
    .notNull()
    .references(() => applications.id),
  paymentId: text("payment_id").references(() => payments.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  status: text("status", {
    enum: ["pending", "processed", "rejected"],
  })
    .notNull()
    .default("pending"),
  processedBy: text("processed_by").references(() => users.id),
  processedAt: integer("processed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============== BROADCASTS ==============
export const broadcasts = sqliteTable("broadcasts", {
  id: text("id").primaryKey(),
  channel: text("channel", { enum: ["wa", "email", "push"] }).notNull(),
  segment: text("segment").notNull(), // 'all' | 'trust_1' | 'overdue' | 'active' | 'inactive'
  subject: text("subject"),
  message: text("message").notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  sentBy: text("sent_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
