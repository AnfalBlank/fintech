"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  Wallet,
  AlertTriangle,
  Percent,
  CheckCircle2,
  Clock,
  Boxes,
  Truck,
  Download,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { admin } from "@/lib/client";
import { useToast } from "@/components/ui/toast";
import { formatIDR, cn } from "@/lib/utils";

const ranges = ["7 Hari", "30 Hari", "90 Hari"] as const;
type Range = (typeof ranges)[number];

export default function AdminOverviewPage() {
  const toast = useToast();
  const [range, setRange] = useState<Range>("30 Hari");
  const [overview, setOverview] = useState<any | null>(null);
  const [finance, setFinance] = useState<any | null>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [fraud, setFraud] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      admin.overview(),
      admin.finance(),
      admin.applications(),
      admin.fraud(),
    ]).then(([ov, fi, ap, fr]) => {
      if (ov.ok) setOverview(ov.data);
      if (fi.ok) setFinance(fi.data.kpi);
      if (ap.ok) setApps(ap.data.items.slice(0, 5));
      if (fr.ok) setFraud(fr.data.items.slice(0, 3));
    });
  }, []);

  const exportReport = () => {
    if (!finance) return;
    const csv =
      "metric,value\n" +
      Object.entries(finance)
        .map(([k, v]) => `${k},${v}`)
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `manggala-report-${range}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Laporan diunduh");
  };

  // Risk distribution
  const total =
    (overview?.riskDistribution ?? []).reduce(
      (s: number, r: any) => s + (r.count ?? 0),
      0
    ) || 1;
  const dist = (g: string) => {
    const r = overview?.riskDistribution?.find((x: any) => x.grade === g);
    return Math.round(((r?.count ?? 0) / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-page font-bold text-ink">Overview</h1>
          <p className="text-ink-muted mt-1">
            Ringkasan operasional, finansial, dan risiko platform.
          </p>
        </div>
        <div className="flex gap-2">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "h-10 px-4 text-sm rounded-2xl font-semibold transition",
                r === range
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
          label="Outstanding"
          value={formatIDR(finance?.outstanding ?? 0)}
          Icon={Wallet}
          tone="primary"
        />
        <StatCard
          label="Total Profit (margin)"
          value={formatIDR(finance?.profit ?? 0)}
          Icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Active Users"
          value={String(finance?.activeUsers ?? 0)}
          Icon={Users}
          tone="primary"
        />
        <StatCard
          label="Overdue"
          value={formatIDR(finance?.overdue ?? 0)}
          Icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>KPI Operasional</CardTitle>
              <p className="text-sm text-ink-muted mt-0.5">
                Periode: {range}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <KpiBlock
              label="Pending Approval"
              value={String(overview?.pending ?? 0)}
              Icon={Clock}
              tone="warning"
            />
            <KpiBlock
              label="Approved Today"
              value={String(overview?.todayApproved ?? 0)}
              Icon={CheckCircle2}
              tone="success"
            />
            <KpiBlock
              label="Active Deliveries"
              value={String(overview?.activeDeliveries ?? 0)}
              Icon={Truck}
              tone="primary"
            />
            <KpiBlock
              label="QC Done"
              value={String(overview?.qcDone ?? 0)}
              Icon={Boxes}
              tone="primary"
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Risk Distribution</CardTitle>
          <p className="text-sm text-ink-muted mt-0.5">
            Approval grade saat ini
          </p>
          <div className="mt-5 space-y-4">
            <RiskRow grade="A" label="Auto Approve" pct={dist("A")} tone="success" />
            <RiskRow grade="B" label="Semi Manual" pct={dist("B")} tone="primary" />
            <RiskRow grade="C" label="Supervisor" pct={dist("C")} tone="warning" />
            <RiskRow grade="D" label="Reject" pct={dist("D")} tone="danger" />
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm">
            <div className="h-9 w-9 rounded-2xl bg-emerald/10 text-emerald grid place-items-center">
              <Percent className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-ink">
                Collection Rate {finance?.collectionRate ?? 0}%
              </p>
              <p className="text-xs text-ink-muted">
                NPL {finance?.nplRatio ?? 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <CardTitle>Pending Approvals</CardTitle>
              <p className="text-sm text-ink-muted mt-0.5">
                Antri direview oleh tim approval.
              </p>
            </div>
            <Link
              href="/admin/approvals"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Buka semua →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-ink-muted">
                  <th className="px-6 py-3 font-medium">Application</th>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Risk</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apps.map((row) => (
                  <tr
                    key={row.app.id}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-6 py-3">
                      <p className="font-mono text-xs text-ink-muted">
                        {row.app.id}
                      </p>
                      <p className="font-semibold text-ink truncate max-w-[180px]">
                        {row.product?.title}
                      </p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-ink">{row.user?.name}</p>
                      <p className="text-xs text-ink-muted">
                        {row.user?.city}
                      </p>
                    </td>
                    <td className="px-6 py-3 font-semibold text-ink">
                      {formatIDR(row.app.total)}
                    </td>
                    <td className="px-6 py-3">
                      <RiskBadge
                        grade={row.app.riskGrade}
                        score={row.app.riskScore}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={row.app.status} />
                    </td>
                  </tr>
                ))}
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-ink-muted">
                      Belum ada pengajuan
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Fraud Alerts</CardTitle>
            <Link
              href="/admin/fraud"
              className="text-xs text-primary font-semibold hover:underline"
            >
              Lihat semua
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {fraud.map((row: any) => (
              <li
                key={row.f.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-danger/5 border border-danger/15"
              >
                <div className="h-8 w-8 rounded-xl bg-danger/10 text-danger grid place-items-center">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {row.f.reason}
                  </p>
                  <p className="text-xs text-ink-muted truncate">
                    {row.user?.name ?? "—"} · {row.f.severity}
                  </p>
                </div>
              </li>
            ))}
            {fraud.length === 0 ? (
              <li className="text-xs text-ink-muted text-center py-4">
                Tidak ada fraud aktif
              </li>
            ) : null}
          </ul>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardTitle>Collection Rate</CardTitle>
          <p className="text-sm text-ink-muted mt-1">Target &gt; 90%</p>
          <p className="text-[40px] font-bold text-ink mt-3">
            {finance?.collectionRate ?? 0}%
          </p>
          <Progress
            value={finance?.collectionRate ?? 0}
            tone={(finance?.collectionRate ?? 0) >= 90 ? "success" : "warning"}
            className="mt-3"
          />
        </Card>
        <Card>
          <CardTitle>Default Rate (NPL)</CardTitle>
          <p className="text-sm text-ink-muted mt-1">Target &lt; 5%</p>
          <p className="text-[40px] font-bold text-ink mt-3">
            {finance?.nplRatio ?? 0}%
          </p>
          <Progress
            value={Math.min(100, (finance?.nplRatio ?? 0) * 10)}
            tone={(finance?.nplRatio ?? 0) <= 5 ? "success" : "warning"}
            className="mt-3"
          />
        </Card>
        <Card>
          <CardTitle>Approved (cumulative)</CardTitle>
          <p className="text-sm text-ink-muted mt-1">Total disbursed</p>
          <p className="text-[40px] font-bold text-ink mt-3">
            {formatIDR(finance?.profit ?? 0)}
          </p>
          <Progress value={70} tone="primary" className="mt-3" />
        </Card>
      </div>
    </div>
  );
}

function KpiBlock({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  Icon: any;
  tone: "success" | "warning" | "primary";
}) {
  const tones = {
    success: "bg-emerald/10 text-emerald",
    warning: "bg-warning/10 text-warning",
    primary: "bg-primary-50 text-primary",
  };
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className={cn("h-9 w-9 rounded-xl grid place-items-center", tones[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold text-ink mt-3">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

function RiskRow({
  grade,
  label,
  pct,
  tone,
}: {
  grade: string;
  label: string;
  pct: number;
  tone: "success" | "primary" | "warning" | "danger";
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-7 w-7 rounded-lg grid place-items-center text-xs font-bold",
              tone === "success" && "bg-emerald/10 text-emerald",
              tone === "primary" && "bg-primary-50 text-primary",
              tone === "warning" && "bg-warning/10 text-warning",
              tone === "danger" && "bg-danger/10 text-danger"
            )}
          >
            {grade}
          </span>
          <span className="text-sm font-medium text-ink">{label}</span>
        </div>
        <span className="text-sm font-semibold">{pct}%</span>
      </div>
      <Progress value={pct} tone={tone} />
    </div>
  );
}

function RiskBadge({
  grade,
  score,
}: {
  grade: "A" | "B" | "C" | "D" | null;
  score?: number | null;
}) {
  if (!grade)
    return (
      <span className="text-xs text-ink-muted">—</span>
    );
  const tones = {
    A: "bg-emerald/10 text-emerald",
    B: "bg-primary-50 text-primary",
    C: "bg-warning/10 text-warning",
    D: "bg-danger/10 text-danger",
  };
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "h-7 w-7 grid place-items-center rounded-lg font-bold text-xs",
          tones[grade]
        )}
      >
        {grade}
      </span>
      <span className="text-sm font-semibold text-ink">{score ?? "-"}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: any; label: string }> = {
    pending: { tone: "warning", label: "Pending" },
    manual_review: { tone: "info", label: "Manual Review" },
    approved: { tone: "success", label: "Approved" },
    rejected: { tone: "danger", label: "Rejected" },
    delivered: { tone: "success", label: "Delivered" },
    active: { tone: "primary", label: "Active" },
    completed: { tone: "success", label: "Completed" },
    purchasing: { tone: "info", label: "Purchasing" },
    warehouse: { tone: "info", label: "Warehouse" },
    delivering: { tone: "primary", label: "Delivering" },
    dp_pending: { tone: "warning", label: "DP Pending" },
  };
  const m = map[status] ?? { tone: "muted", label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
