// Additional mock data for Warehouse, Purchase Orders, Roles, Courier app.

export type PurchaseOrder = {
  id: string;
  applicationId: string;
  product: string;
  marketplace: string;
  price: number;
  status: "to_purchase" | "purchased" | "shipped_to_warehouse" | "received";
  invoiceNo?: string;
  imei?: string;
  buyer: string;
  createdAt: string;
};

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-2026-441",
    applicationId: "APP-2026-00230",
    product: "AC Daikin 1 PK Inverter",
    marketplace: "Tokopedia",
    price: 5499000,
    status: "purchased",
    invoiceNo: "INV-TKP-99281",
    buyer: "Admin Procurement A",
    createdAt: "2026-05-22T09:00:00",
  },
  {
    id: "PO-2026-440",
    applicationId: "APP-2026-00227",
    product: "MacBook Air M2 8/256",
    marketplace: "Tokopedia",
    price: 14999000,
    status: "received",
    invoiceNo: "INV-TKP-99102",
    imei: "C02XL0J1JG5J",
    buyer: "Admin Procurement B",
    createdAt: "2026-05-21T11:45:00",
  },
  {
    id: "PO-2026-442",
    applicationId: "APP-2026-00231",
    product: "iPhone 15 Pro 256GB",
    marketplace: "Tokopedia",
    price: 18999000,
    status: "to_purchase",
    buyer: "—",
    createdAt: "2026-05-22T13:10:00",
  },
];

export type WarehouseItem = {
  id: string;
  poId: string;
  product: string;
  arrivedAt: string;
  qcStatus: "pending" | "passed" | "failed";
  serialNumber?: string;
  photos: number;
  checkedBy?: string;
};

export const warehouseItems: WarehouseItem[] = [
  {
    id: "WH-998",
    poId: "PO-2026-441",
    product: "AC Daikin 1 PK Inverter",
    arrivedAt: "2026-05-23T08:30:00",
    qcStatus: "pending",
    photos: 0,
  },
  {
    id: "WH-997",
    poId: "PO-2026-440",
    product: "MacBook Air M2 8/256",
    arrivedAt: "2026-05-22T16:00:00",
    qcStatus: "passed",
    serialNumber: "C02XL0J1JG5J",
    photos: 4,
    checkedBy: "Bayu (QC)",
  },
];

export type RoleUser = {
  id: string;
  name: string;
  email: string;
  role:
    | "Super Admin"
    | "Finance Admin"
    | "Collection Team"
    | "Delivery Team"
    | "Surveyor";
  status: "active" | "suspended";
  lastLogin: string;
};

export const roleUsers: RoleUser[] = [
  {
    id: "U-001",
    name: "Andini Pratama",
    email: "andini@manggala.id",
    role: "Finance Admin",
    status: "active",
    lastLogin: "2026-05-23T07:00:00",
  },
  {
    id: "U-002",
    name: "Bagus Hartono",
    email: "bagus@manggala.id",
    role: "Super Admin",
    status: "active",
    lastLogin: "2026-05-23T06:45:00",
  },
  {
    id: "U-003",
    name: "Cahyo Nugroho",
    email: "cahyo@manggala.id",
    role: "Collection Team",
    status: "active",
    lastLogin: "2026-05-22T19:30:00",
  },
  {
    id: "U-004",
    name: "Adi Saputra",
    email: "adi@manggala.id",
    role: "Delivery Team",
    status: "active",
    lastLogin: "2026-05-23T08:10:00",
  },
  {
    id: "U-005",
    name: "Eka Suryani",
    email: "eka@manggala.id",
    role: "Surveyor",
    status: "suspended",
    lastLogin: "2026-05-20T13:22:00",
  },
];

export const rolePermissions = {
  "Super Admin": [
    "approval",
    "finance",
    "collection",
    "delivery",
    "fraud",
    "assets",
    "warehouse",
    "users",
  ],
  "Finance Admin": ["approval", "finance"],
  "Collection Team": ["collection"],
  "Delivery Team": ["delivery", "warehouse"],
  Surveyor: ["fraud", "approval"],
} as const;

export type CourierTask = {
  id: string;
  customer: string;
  phone: string;
  address: string;
  product: string;
  scheduled: string;
  status: "pending" | "picked_up" | "in_transit" | "completed";
  amount?: number;
};

export const courierTasks: CourierTask[] = [
  {
    id: "DLV-991",
    customer: "Sari Wulandari",
    phone: "+62 813-2204-1922",
    address: "Jl. Anggrek No. 22, Bekasi Selatan",
    product: "AC Daikin 1 PK Inverter",
    scheduled: "2026-05-23T14:00:00",
    status: "in_transit",
  },
  {
    id: "DLV-992",
    customer: "Bima Santoso",
    phone: "+62 851-7321-2210",
    address: "Komplek Pesona Permai E12, Bogor",
    product: "Mesin Cuci Sharp 8 Kg",
    scheduled: "2026-05-23T16:30:00",
    status: "pending",
  },
  {
    id: "DLV-993",
    customer: "Dini Astari",
    phone: "+62 812-7711-9988",
    address: "Apartemen Casa Grande Tower B, Lt 12",
    product: "iPad Air M2 11 inch",
    scheduled: "2026-05-23T18:00:00",
    status: "pending",
  },
];
