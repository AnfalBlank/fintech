// Browser-side API client. Cookies are forwarded automatically.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.ok === false) {
      return { ok: false, error: json?.error ?? `HTTP ${res.status}` };
    }
    return { ok: true, data: json.data as T };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const api = {
  get: <T>(p: string) => call<T>("GET", p),
  post: <T>(p: string, body?: unknown) => call<T>("POST", p, body),
  patch: <T>(p: string, body?: unknown) => call<T>("PATCH", p, body),
};

// ============= Auth =============
export const auth = {
  register: (body: {
    name: string;
    email: string;
    phone: string;
    consentTnc: boolean;
    consentData: boolean;
  }) => api.post<{ user: any; otp?: string }>("/api/auth/register", body),
  login: (identifier: string, password: string) =>
    api.post<{ user: any }>("/api/auth/login", { identifier, password }),
  otpRequest: (phone: string) =>
    api.post<{ sent: boolean; otp?: string }>("/api/auth/otp/request", {
      phone,
    }),
  otpVerify: (phone: string, code: string) =>
    api.post<{ user: any }>("/api/auth/otp/verify", { phone, code }),
  me: () => api.get<{ user: any }>("/api/auth/me"),
  logout: () => api.post<{ logout: boolean }>("/api/auth/logout"),
};

// ============= Customer =============
export const customer = {
  scrape: (url: string) =>
    api.post<{ product: any; simulations: any[] }>("/api/products/scrape", {
      url,
    }),
  apply: (body: any) => api.post<any>("/api/applications", body),
  myApplications: () => api.get<{ items: any[] }>("/api/applications"),
  application: (id: string) => api.get<any>(`/api/applications/${id}`),
  installments: () => api.get<{ items: any[] }>("/api/installments"),
  createPayment: (body: {
    applicationId: string;
    installmentId?: string;
    type: "dp" | "installment" | "penalty";
    method: "va" | "qris" | "ewallet";
    channel?: string;
    amount: number;
  }) => api.post<any>("/api/payments", body),
  confirmPayment: (id: string) =>
    api.post<{ confirmed: boolean }>(`/api/payments/${id}/confirm`),
  notifications: () => api.get<{ items: any[] }>("/api/notifications"),
  markNotificationsRead: (ids?: string[]) =>
    api.patch<{ updated: boolean }>("/api/notifications", { ids }),
};

// ============= Admin =============
export const admin = {
  overview: () => api.get<any>("/api/admin/overview"),
  finance: () => api.get<any>("/api/admin/finance"),
  applications: (status?: string) =>
    api.get<{ items: any[] }>(
      `/api/applications${status ? `?status=${status}` : ""}`
    ),
  decide: (id: string, action: "approve" | "reject" | "hold", reason?: string) =>
    api.post<any>(`/api/applications/${id}/decide`, { action, reason }),
  warehousePO: () => api.get<{ items: any[] }>("/api/admin/warehouse/po"),
  recordPurchase: (assetId: string, invoiceNo: string) =>
    api.post<any>("/api/admin/warehouse/po", { assetId, invoiceNo }),
  qc: (
    assetId: string,
    result: "passed" | "failed",
    serialNumber?: string,
    photoCount = 4
  ) =>
    api.post<any>("/api/admin/warehouse/qc", {
      assetId,
      result,
      serialNumber,
      photoCount,
    }),
  deliveries: () => api.get<{ items: any[] }>("/api/admin/deliveries"),
  assignDelivery: (deliveryId: string, courierId: string) =>
    api.post<any>("/api/admin/deliveries", { deliveryId, courierId }),
  collection: () => api.get<{ items: any[] }>("/api/admin/collection"),
  sendReminder: (
    installmentIds: string[],
    channel: "wa" | "email" | "push",
    message?: string
  ) =>
    api.post<any>("/api/admin/collection", {
      installmentIds,
      channel,
      message,
    }),
  fraud: () => api.get<{ items: any[] }>("/api/admin/fraud"),
  resolveFraud: (
    fraudId: string,
    action: "review" | "block" | "false_positive",
    notes?: string
  ) =>
    api.post<any>("/api/admin/fraud", { fraudId, action, notes }),
  assets: (status?: string) =>
    api.get<{ items: any[] }>(
      `/api/admin/assets${status ? `?status=${status}` : ""}`
    ),
  users: () => api.get<{ items: any[] }>("/api/admin/users"),
  createUser: (body: any) => api.post<any>("/api/admin/users", body),
  updateUser: (body: { userId: string; role?: string; status?: string }) =>
    api.patch<any>("/api/admin/users", body),
};

// ============= Courier =============
export const courier = {
  tasks: () => api.get<{ items: any[] }>("/api/courier/tasks"),
  history: () => api.get<{ items: any[] }>("/api/courier/history"),
  stats: () =>
    api.get<{
      total: number;
      delivered: number;
      pending: number;
      onTimePct: number;
    }>("/api/courier/stats"),
  submitProof: (
    deliveryId: string,
    body: {
      photos: string[];
      gpsLat: number;
      gpsLng: number;
      signatureDataUrl: string;
      qrVerified: boolean;
    }
  ) => api.post<any>(`/api/courier/deliveries/${deliveryId}/proof`, body),
};
