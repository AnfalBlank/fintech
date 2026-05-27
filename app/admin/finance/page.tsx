"use client";
import { useEffect, useState } from "react";
import {
  Banknote,
  Download,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatIDR } from "@/lib/utils";

export default function FinancePage() {
  const toast = useToast();
  const [kpi, setKpi] = useState<any | null>(null);

  useEffect(() => {
    admin.finance().then((r) => {
      if (r.ok) setKpi(r.data.kpi);
    });
  }, []);

  const exportReport = () => {
    if (!kpi) return;
    const csv =
      "metric,value\n" +
      Object.entries(kpi)
        .map(([k, v]) => `${k},${v}`)
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "finance.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Laporan diunduh");
  };

  if (!kpi) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-page font-bold text-ink">Finance Dashboard</h1>
          <p className="text-ink-muted mt-1">
            Kondisi modal, outstanding, dan profit margin.
          </p>
        </div>
        <Button variant="secondary" onClick={exportReport}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Outstanding"
          value={formatIDR(kpi.outstanding)}
          Icon={Wallet}
          tone="primary"
        />
        <StatCard
          label="Profit (margin total)"
          value={formatIDR(kpi.profit)}
          Icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Paid (cumulative)"
          value={formatIDR(kpi.paid)}
          Icon={Banknote}
          tone="primary"
        />
        <StatCard
          label="NPL Ratio"
          value={`${kpi.nplRatio}%`}
          Icon={TrendingDown}
          tone={kpi.nplRatio > 5 ? "danger" : "warning"}
        />
      </div>

      <Card>
        <CardTitle>KPI Detail</CardTitle>
        <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
          <Row label="Active Users" value={String(kpi.activeUsers)} />
          <Row
            label="Total Applications"
            value={String(kpi.totalApplications)}
          />
          <Row label="Collection Rate" value={`${kpi.collectionRate}%`} />
          <Row label="Overdue" value={formatIDR(kpi.overdue)} />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
