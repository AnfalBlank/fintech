"use client";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Download,
  PieChart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatIDR, cn } from "@/lib/utils";

const ranges = ["Bulan Ini", "3 Bulan", "YTD"] as const;
type Range = (typeof ranges)[number];

export default function FinancePage() {
  const toast = useToast();
  const [range, setRange] = useState<Range>("Bulan Ini");

  const exportReport = () => {
    const blob = new Blob(
      [
        "metric,value\n" +
          "modal_keluar,890000000\n" +
          "outstanding,2345000000\n" +
          "profit,478200000\n" +
          "npl,3.4\n",
      ],
      { type: "text/csv" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `finance-${range.replace(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Laporan diunduh", `finance-${range}.csv`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-page font-bold text-ink">Finance Dashboard</h1>
          <p className="text-ink-muted mt-1">
            Kondisi modal, outstanding, dan profit margin platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "h-10 px-4 text-sm rounded-2xl font-semibold transition",
                range === r
                  ? "bg-primary text-white"
                  : "bg-white border border-border text-ink-muted hover:bg-slate-50"
              )}
            >
              {r}
            </button>
          ))}
          <Button variant="secondary" onClick={exportReport}>
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Modal Keluar (MTD)"
          value={formatIDR(890_000_000)}
          delta="+15%"
          trend="up"
          Icon={Banknote}
          tone="primary"
        />
        <StatCard
          label="Outstanding"
          value={formatIDR(2_345_000_000)}
          delta="+8.4%"
          trend="up"
          Icon={Wallet}
          tone="primary"
        />
        <StatCard
          label="Profit (MTD)"
          value={formatIDR(478_200_000)}
          delta="+12.1%"
          trend="up"
          Icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="NPL Ratio"
          value="3.4%"
          delta="-0.6%"
          trend="down"
          Icon={TrendingDown}
          tone="warning"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cashflow Bulanan</CardTitle>
              <p className="text-sm text-ink-muted mt-0.5">
                Disbursement, repayment, profit
              </p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Disbursement
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald" /> Repayment
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Profit
              </span>
            </div>
          </div>
          <FakeLineChart />
        </Card>

        <Card>
          <CardTitle>Outstanding by Tenor</CardTitle>
          <div className="mt-5 space-y-3">
            <Bar label="3 bulan" pct={45} value={formatIDR(1_055_000_000)} tone="primary" />
            <Bar label="6 bulan" pct={35} value={formatIDR(820_000_000)} tone="success" />
            <Bar label="12 bulan" pct={20} value={formatIDR(470_000_000)} tone="warning" />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Top Categories</CardTitle>
          <ul className="mt-4 divide-y divide-border">
            {[
              { c: "Smartphone", v: 845_000_000, p: 36 },
              { c: "Laptop", v: 612_000_000, p: 26 },
              { c: "Home Appliance", v: 445_000_000, p: 19 },
              { c: "Peralatan Usaha", v: 285_000_000, p: 12 },
              { c: "Lainnya", v: 158_000_000, p: 7 },
            ].map((row) => (
              <li
                key={row.c}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary-50 text-primary grid place-items-center">
                    <PieChart className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{row.c}</p>
                    <p className="text-xs text-ink-muted">{row.p}% portfolio</p>
                  </div>
                </div>
                <p className="font-semibold text-ink">{formatIDR(row.v)}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Aging Outstanding</CardTitle>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Aging label="Current" value={formatIDR(2_103_000_000)} pct={89.7} tone="success" />
            <Aging label="0-30 hari" value={formatIDR(155_000_000)} pct={6.6} tone="primary" />
            <Aging label="30-60 hari" value={formatIDR(58_000_000)} pct={2.5} tone="warning" />
            <Aging label="60-90 hari" value={formatIDR(29_000_000)} pct={1.2} tone="danger" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function FakeLineChart() {
  const points = (vals: number[], color: string) => {
    const max = 100;
    const stepX = 100 / (vals.length - 1);
    const path = vals
      .map((v, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${100 - (v / max) * 90}`)
      .join(" ");
    return <path d={path} stroke={color} strokeWidth="2" fill="none" />;
  };
  return (
    <div className="mt-4 relative h-64 rounded-2xl bg-gradient-to-b from-primary-50/50 to-white border border-border p-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        {points([20, 35, 55, 50, 65, 80, 75, 88, 82, 92, 95, 100], "#2563EB")}
        {points([15, 28, 48, 42, 55, 68, 65, 75, 70, 80, 82, 88], "#10B981")}
        {points([8, 15, 22, 22, 28, 32, 30, 36, 34, 40, 42, 48], "#F59E0B")}
      </svg>
      <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[10px] text-ink-muted font-medium">
        {["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"].map(
          (m) => (
            <span key={m}>{m}</span>
          )
        )}
      </div>
    </div>
  );
}

function Bar({
  label,
  pct,
  value,
  tone,
}: {
  label: string;
  pct: number;
  value: string;
  tone: "primary" | "success" | "warning";
}) {
  const tones = {
    primary: "bg-primary",
    success: "bg-emerald",
    warning: "bg-warning",
  };
  return (
    <div>
      <div className="flex justify-between mb-1.5 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-ink-muted">{value}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${tones[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Aging({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: string;
  pct: number;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const tones = {
    primary: "bg-primary-50 text-primary",
    success: "bg-emerald/10 text-emerald",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  };
  return (
    <div className="rounded-2xl border border-border p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="font-bold text-ink text-lg mt-1">{value}</p>
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mt-2 ${tones[tone]}`}
      >
        {pct}%
      </span>
    </div>
  );
}
