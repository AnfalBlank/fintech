"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { cn } from "@/lib/utils";

type BankAccount = {
  bank: string;
  accountNumber: string;
  accountName: string;
  notes?: string;
};

type Settings = {
  margin3m: number;
  margin6m: number;
  margin12m: number;
  marginL3Discount: number;
  limitL1: number;
  limitL2: number;
  limitL3: number;
  dpUnder5: number;
  dpUnder10: number;
  dpOver10: number;
  noDpThreshold: number;
  maxAffordablePct: number;
  otpTtlMinutes: number;
  paymentExpireHours: number;
  penaltyDailyPct: number;
  coverageCities: string[];
  allowedMarketplaces: string[];
  eSignAutoEnabled: boolean;
  eSignProviderLabel: string;
  paymentMode: "manual" | "midtrans" | "mixed";
  bankAccounts: BankAccount[];
  qrisStaticImageUrl: string;
  qrisMerchantName: string;
  qrisMerchantId: string;
  midtransServerKey: string;
  midtransClientKey: string;
  midtransProduction: boolean;
};

export default function SettingsPage() {
  const toast = useToast();
  const [data, setData] = useState<Settings | null>(null);
  const [defaults, setDefaults] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showServerKey, setShowServerKey] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const res = await admin.settings();
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    setData(res.data.settings);
    setDefaults(res.data.defaults);
  };

  useEffect(() => {
    refresh();
  }, []);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    // Don't send the masked server key back.
    const payload: any = { ...data };
    if (payload.midtransServerKey === "•••••") delete payload.midtransServerKey;
    const res = await admin.saveSettings(payload);
    setSaving(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success("Settings tersimpan");
    refresh();
  };

  const reset = () => {
    if (defaults) setData({ ...defaults });
    toast.info("Direset ke default — klik Simpan untuk menerapkan");
  };

  if (loading || !data) return <div className="skeleton h-96" />;

  // Helpers to mutate bank accounts
  const updateBank = (idx: number, patch: Partial<BankAccount>) => {
    const next = [...data.bankAccounts];
    next[idx] = { ...next[idx], ...patch };
    setData({ ...data, bankAccounts: next });
  };
  const addBank = () => {
    setData({
      ...data,
      bankAccounts: [
        ...data.bankAccounts,
        { bank: "BCA", accountNumber: "", accountName: "" },
      ],
    });
  };
  const removeBank = (idx: number) => {
    setData({
      ...data,
      bankAccounts: data.bankAccounts.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-page font-bold text-ink">Platform Settings</h1>
          <p className="text-ink-muted mt-1">
            Hanya Super Admin yang dapat mengubah. Setiap perubahan tercatat di
            audit log.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="h-4 w-4" /> Reset Default
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </div>

      {/* Payment & E-signature first since most operationally relevant */}
      <Card>
        <CardTitle>E-Signature</CardTitle>
        <p className="text-sm text-ink-muted mt-1">
          Kontrol bagaimana perjanjian cicilan ditandatangani. Default: manual
          (cetak + tanda tangan basah). Aktifkan toggle ini bila sudah
          terhubung ke PSrE provider seperti Privy / Vida / Tilaka.
        </p>
        <div className="mt-4 flex items-center justify-between p-4 rounded-2xl border border-border bg-slate-50">
          <div>
            <p className="font-semibold text-ink">
              {data.eSignAutoEnabled
                ? "E-signature OTOMATIS aktif"
                : "Tanda tangan MANUAL"}
            </p>
            <p className="text-xs text-ink-muted mt-0.5">
              {data.eSignAutoEnabled
                ? `Provider: ${data.eSignProviderLabel}`
                : "Customer wajib tanda tangan basah lalu upload kembali."}
            </p>
          </div>
          <Toggle
            on={data.eSignAutoEnabled}
            onChange={(v) => setData({ ...data, eSignAutoEnabled: v })}
          />
        </div>
        {data.eSignAutoEnabled ? (
          <div className="mt-3">
            <Label>Nama Provider E-Sign</Label>
            <Input
              value={data.eSignProviderLabel}
              onChange={(e) =>
                setData({ ...data, eSignProviderLabel: e.target.value })
              }
              placeholder="Privy, Vida, Tilaka, Peruri…"
            />
          </div>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Payment Mode</CardTitle>
        <p className="text-sm text-ink-muted mt-1">
          Pilih bagaimana customer melakukan pembayaran.
        </p>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <ModeCard
            active={data.paymentMode === "manual"}
            label="Manual"
            desc="Transfer bank + QRIS static. Konfirmasi manual oleh admin."
            onClick={() => setData({ ...data, paymentMode: "manual" })}
          />
          <ModeCard
            active={data.paymentMode === "midtrans"}
            label="Midtrans"
            desc="VA + QRIS dinamis + e-wallet via Midtrans, auto-confirm via webhook."
            onClick={() => setData({ ...data, paymentMode: "midtrans" })}
          />
          <ModeCard
            active={data.paymentMode === "mixed"}
            label="Mixed"
            desc="Customer bisa pilih: manual transfer, QRIS static, atau Midtrans."
            onClick={() => setData({ ...data, paymentMode: "mixed" })}
          />
        </div>
      </Card>

      {/* Bank accounts (manual / mixed) */}
      {data.paymentMode !== "midtrans" ? (
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Rekening Transfer</CardTitle>
            <Button variant="secondary" size="sm" onClick={addBank}>
              <Plus className="h-4 w-4" /> Tambah Rekening
            </Button>
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Rekening yang ditampilkan ke customer untuk transfer manual.
          </p>
          <div className="mt-4 space-y-3">
            {data.bankAccounts.length === 0 ? (
              <p className="text-sm text-ink-muted text-center p-6">
                Belum ada rekening. Tambahkan minimal 1 supaya customer bisa
                bayar via transfer.
              </p>
            ) : null}
            {data.bankAccounts.map((b, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-border grid sm:grid-cols-[120px_1fr_1fr_auto] gap-3"
              >
                <div>
                  <Label>Bank</Label>
                  <Input
                    value={b.bank}
                    onChange={(e) => updateBank(idx, { bank: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Nomor Rekening</Label>
                  <Input
                    value={b.accountNumber}
                    onChange={(e) =>
                      updateBank(idx, { accountNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Nama Pemilik</Label>
                  <Input
                    value={b.accountName}
                    onChange={(e) =>
                      updateBank(idx, { accountName: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="danger"
                    size="icon"
                    onClick={() => removeBank(idx)}
                    aria-label="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* QRIS Static (manual / mixed) */}
      {data.paymentMode !== "midtrans" ? (
        <Card>
          <CardTitle>QRIS Static</CardTitle>
          <p className="text-sm text-ink-muted mt-1">
            Upload QR code static dari provider QRIS (BCA, BRI, Bank Mandiri,
            atau aggregator). Customer akan scan QR + transfer manual sesuai
            nominal.
          </p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div>
              <Label>URL Gambar QR</Label>
              <Input
                value={data.qrisStaticImageUrl}
                onChange={(e) =>
                  setData({ ...data, qrisStaticImageUrl: e.target.value })
                }
                placeholder="https://cdn.example.com/qris.png"
              />
            </div>
            <div>
              <Label>Merchant Name</Label>
              <Input
                value={data.qrisMerchantName}
                onChange={(e) =>
                  setData({ ...data, qrisMerchantName: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Merchant ID (NMID)</Label>
              <Input
                value={data.qrisMerchantId}
                onChange={(e) =>
                  setData({ ...data, qrisMerchantId: e.target.value })
                }
                placeholder="ID..."
              />
            </div>
          </div>
          {data.qrisStaticImageUrl ? (
            <div className="mt-4 grid place-items-center">
              <img
                src={data.qrisStaticImageUrl}
                alt="QRIS preview"
                className="h-48 w-48 rounded-2xl border border-border object-contain bg-white"
              />
              <p className="text-xs text-ink-muted mt-2">Preview</p>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Midtrans (midtrans / mixed) */}
      {data.paymentMode !== "manual" ? (
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Midtrans</CardTitle>
            {data.midtransProduction ? (
              <Badge tone="danger">PRODUCTION</Badge>
            ) : (
              <Badge tone="warning">SANDBOX</Badge>
            )}
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Server Key disimpan terenkripsi. Dapatkan di dashboard Midtrans →
            Settings → Access Keys. Pastikan webhook ke{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">
              /api/webhooks/midtrans
            </code>{" "}
            sudah didaftarkan.
          </p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Client Key</Label>
              <Input
                value={data.midtransClientKey}
                onChange={(e) =>
                  setData({ ...data, midtransClientKey: e.target.value })
                }
                placeholder="SB-Mid-client-..."
              />
            </div>
            <div>
              <Label>Server Key</Label>
              <div className="relative">
                <Input
                  type={showServerKey ? "text" : "password"}
                  value={data.midtransServerKey}
                  onChange={(e) =>
                    setData({ ...data, midtransServerKey: e.target.value })
                  }
                  placeholder="SB-Mid-server-..."
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowServerKey((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
                  aria-label="Toggle visibility"
                >
                  {showServerKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Kosongkan untuk pertahankan key existing.
              </p>
            </div>
            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-2xl bg-slate-50">
              <div>
                <p className="font-semibold text-ink text-sm">
                  Production Mode
                </p>
                <p className="text-xs text-ink-muted">
                  Off untuk testing pakai sandbox.
                </p>
              </div>
              <Toggle
                on={data.midtransProduction}
                onChange={(v) => setData({ ...data, midtransProduction: v })}
              />
            </div>
          </div>
        </Card>
      ) : null}

      {/* Pricing rules (existing) */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle>Margin Structure (PRD §6)</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Pct label="Margin 3 bln" value={data.margin3m} onChange={(v) => setData({ ...data, margin3m: v })} />
            <Pct label="Margin 6 bln" value={data.margin6m} onChange={(v) => setData({ ...data, margin6m: v })} />
            <Pct label="Margin 12 bln" value={data.margin12m} onChange={(v) => setData({ ...data, margin12m: v })} />
            <Pct label="L3 Discount" value={data.marginL3Discount} onChange={(v) => setData({ ...data, marginL3Discount: v })} />
          </div>
        </Card>

        <Card>
          <CardTitle>Trust Level Limits (PRD §8)</CardTitle>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Money label="Level 1" value={data.limitL1} onChange={(v) => setData({ ...data, limitL1: v })} />
            <Money label="Level 2" value={data.limitL2} onChange={(v) => setData({ ...data, limitL2: v })} />
            <Money label="Level 3" value={data.limitL3} onChange={(v) => setData({ ...data, limitL3: v })} />
          </div>
        </Card>

        <Card>
          <CardTitle>DP Rules (PRD §7)</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Pct label="DP 3-5 jt" value={data.dpUnder5} onChange={(v) => setData({ ...data, dpUnder5: v })} />
            <Pct label="DP 5-10 jt" value={data.dpUnder10} onChange={(v) => setData({ ...data, dpUnder10: v })} />
            <Pct label="DP >10 jt" value={data.dpOver10} onChange={(v) => setData({ ...data, dpOver10: v })} />
            <Money label="No DP Threshold" value={data.noDpThreshold} onChange={(v) => setData({ ...data, noDpThreshold: v })} />
          </div>
        </Card>

        <Card>
          <CardTitle>Operational</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Pct label="Max cicilan / income" value={data.maxAffordablePct} onChange={(v) => setData({ ...data, maxAffordablePct: v })} />
            <Pct label="Penalty / hari" value={data.penaltyDailyPct} onChange={(v) => setData({ ...data, penaltyDailyPct: v })} />
            <Num label="OTP TTL (mnt)" value={data.otpTtlMinutes} onChange={(v) => setData({ ...data, otpTtlMinutes: v })} />
            <Num label="Payment expire (jam)" value={data.paymentExpireHours} onChange={(v) => setData({ ...data, paymentExpireHours: v })} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Coverage & Marketplace</CardTitle>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Coverage Cities (comma-separated)</Label>
              <Input
                value={data.coverageCities.join(", ")}
                onChange={(e) =>
                  setData({
                    ...data,
                    coverageCities: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </div>
            <div>
              <Label>Allowed Marketplaces</Label>
              <Input
                value={data.allowedMarketplaces.join(", ")}
                onChange={(e) =>
                  setData({
                    ...data,
                    allowedMarketplaces: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-7 w-12 rounded-full transition",
        on ? "bg-primary" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full bg-white transition shadow",
          on ? "left-5" : "left-0.5"
        )}
      />
    </button>
  );
}

function ModeCard({
  active,
  label,
  desc,
  onClick,
}: {
  active: boolean;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-3xl p-4 border-2 text-left transition",
        active
          ? "border-primary bg-primary-50/60 shadow-ring"
          : "border-border bg-white hover:border-primary-200"
      )}
    >
      <p
        className={cn(
          "font-bold",
          active ? "text-primary" : "text-ink"
        )}
      >
        {label}
      </p>
      <p className="text-xs text-ink-muted mt-1">{desc}</p>
    </button>
  );
}

function Pct({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="pr-10"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-muted">
          {(value * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

function Money({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
