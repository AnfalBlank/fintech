"use client";
import { useEffect, useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";

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
};

export default function SettingsPage() {
  const toast = useToast();
  const [data, setData] = useState<Settings | null>(null);
  const [defaults, setDefaults] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    const res = await admin.saveSettings(data);
    setSaving(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success("Settings tersimpan");
  };

  const reset = () => {
    if (defaults) setData({ ...defaults });
    toast.info("Direset ke default — klik Simpan untuk menerapkan");
  };

  if (loading || !data) return <div className="skeleton h-96" />;

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
