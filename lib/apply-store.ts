"use client";
// Minimal client-side store to share apply flow state between pages.
// Persisted in sessionStorage so refresh doesn't lose progress.

const KEY = "manggala_apply_v1";

export type ApplyState = {
  productUrl?: string;
  product?: {
    title: string;
    imageUrl: string;
    price: number;
    category: string;
    storeName?: string;
    marketplace: string;
    storeRating?: number;
    resaleScore?: number;
    highRisk?: boolean;
  };
  simulations?: any[];
  tenor?: 3 | 6 | 12;
  applicationId?: string;
  riskGrade?: "A" | "B" | "C" | "D";
  riskScore?: number;
  status?: string;
  details?: {
    income?: number;
    occupation?: string;
    city?: string;
    address?: string;
    ktpNumber?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  };
};

export function getApply(): ApplyState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function setApply(patch: Partial<ApplyState>) {
  if (typeof window === "undefined") return;
  const next = { ...getApply(), ...patch };
  sessionStorage.setItem(KEY, JSON.stringify(next));
}

export function clearApply() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
