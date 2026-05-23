"use client";
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
import { useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatIDR, formatDate, cn } from "@/lib/utils";
import { applications, fraudAlerts } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast";

const ranges = ["7 Hari", "30 Hari", "90 Hari"] as const;
type Range = (typeof ranges)[number];

export default function AdminOverviewPage() {
  const [range, setRange] = useState<Range>("30 Hari");
  const toast = useToast();

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
          <Button
            variant="secondary"
            size="md"
            onClick={() =>
              toast.success(
                "Ekspor laporan",
                `Laporan ${range} sedang dibuat. Anda akan menerima email.`
              )
            }
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Outstanding"
          value={formatIDR(2_345_000_000)}
          delta="+12%"
          trend="up"
          Icon={Wallet}
          tone="primary"
        />
        <StatCard
          label="Total Profit"
          value={formatIDR(478_200_000)}
          delta="+8.2%"
          trend="up"
          Icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Active Users"
          value="1.284"
          delta="+5.1%"
          trend="up"
          Icon={Users}
          tone="primary"
        />
        <StatCard
          label="Overdue"
          value={formatIDR(112_000_000)}
          delta="-2.4%"
          trend="down"
          Icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Disbursement vs Repayment</CardTitle>
              <p className="text-sm text-ink-muted mt-0.5">
                Periode: {range}
              </p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Disbursement
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
                Repayment
              </span>
            </div>
          </div>
          <FakeChart />
        </Card>

        <Card>
          <CardTitle>Risk Distribution</CardTitle>
          <p className="text-sm text-ink-muted mt-0.5">
            Approval grade saat ini
          </p>
          <div className="mt-5 space-y-4">
            <RiskRow grade="A" label="Auto Approve" pct={42} tone="success" />
            <RiskRow grade="B" label="Semi Manual" pct={31} tone="primary" />
            <RiskRow grade="C" label="Supervisor" pct={18} tone="warning" />
            <RiskRow grade="D" label="Reject" pct={9} tone="danger" />
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm">
            <div className="h-9 w-9 rounded-2xl bg-emerald/10 text-emerald grid place-items-center">
              <Percent className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-ink">Approval Rate 73%</p>
              <p className="text-xs text-ink-muted">vs 68% bulan lalu</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending approvals */}
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
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-ink-muted">
                  <th className="px-6 py-3 font-medium">Application</th>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Risk</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.slice(0, 5).map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/admin/approvals?id=${a.id}`)
                    }
                  >
                    <td className="px-6 py-3">
                      <p className="font-mono text-xs text-ink-muted">
                        {a.id}
                      </p>
                      <p className="font-semibold text-ink truncate max-w-[180px]">
                        {a.product.title}
                      </p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-ink">{a.user.name}</p>
                      <p className="text-xs text-ink-muted">{a.user.city}</p>
                    </td>
                    <td className="px-6 py-3 font-semibold text-ink">
                      {formatIDR(a.total || a.product.price)}
                    </td>
                    <td className="px-6 py-3">
                      <RiskBadge grade={a.riskGrade} score={a.riskScore} />
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>Today</CardTitle>
              <Badge tone="info">23 Mei</Badge>
            </div>
            <ul className="mt-4 space-y-3">
              <Quick
                Icon={CheckCircle2}
                tone="success"
                label="Approved"
                value="12"
              />
              <Quick
                Icon={Clock}
                tone="warning"
                label="Pending Review"
                value="6"
              />
              <Quick Icon={Truck} tone="primary" label="Deliveries" value="8" />
              <Quick Icon={Boxes} tone="primary" label="QC Done" value="14" />
            </ul>
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
              {fraudAlerts.slice(0, 3).map((f) => (
                <li
                  key={f.id}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-danger/5 border border-danger/15"
                >
                  <div className="h-8 w-8 rounded-xl bg-danger/10 text-danger grid place-items-center">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {f.reason}
                    </p>
                    <p className="text-xs text-ink-muted truncate">
                      {f.user} · {formatDate(f.detectedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardTitle>Collection Rate</CardTitle>
          <p className="text-sm text-ink-muted mt-1">Target &gt; 90%</p>
          <p className="text-[40px] font-bold text-ink mt-3">94.2%</p>
          <Progress value={94.2} tone="success" className="mt-3" />
          <p className="text-xs text-emerald font-semibold mt-2">
            +2.1% vs bulan lalu
          </p>
        </Card>
        <Card>
          <CardTitle>Default Rate (NPL)</CardTitle>
          <p className="text-sm text-ink-muted mt-1">Target &lt; 5%</p>
          <p className="text-[40px] font-bold text-ink mt-3">3.4%</p>
          <Progress value={34} tone="warning" className="mt-3" />
          <p className="text-xs text-emerald font-semibold mt-2">
            -0.6% vs bulan lalu
          </p>
        </Card>
        <Card>
          <CardTitle>Delivery SLA</CardTitle>
          <p className="text-sm text-ink-muted mt-1">Target &lt; 24 jam</p>
          <p className="text-[40px] font-bold text-ink mt-3">18h 42m</p>
          <Progress value={78} tone="primary" className="mt-3" />
          <p className="text-xs text-emerald font-semibold mt-2">
            Lebih cepat 1h 12m
          </p>
        </Card>
      </div>
    </div>
  );
}

function FakeChart() {
  const dis = [40, 55, 65, 50, 70, 85, 80, 90, 78, 92, 100, 95];
  const rep = [30, 42, 60, 55, 65, 78, 75, 82, 80, 88, 92, 90];
  return (
    <div className="mt-5 h-56 flex items-end gap-2.5">
      {dis.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col gap-1 items-stretch">
          <div
            className="rounded-t-md bg-primary/90"
            style={{ height: `${v}%`, minHeight: 4 }}
          />
          <div
            className="rounded-b-md bg-emerald/80"
            style={{ height: `${rep[i] / 2}%`, minHeight: 4 }}
          />
        </div>
      ))}
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

function Quick({
  Icon,
  tone,
  label,
  value,
}: {
  Icon: any;
  tone: "success" | "warning" | "primary";
  label: string;
  value: string;
}) {
  const tones = {
    success: "bg-emerald/10 text-emerald",
    warning: "bg-warning/10 text-warning",
    primary: "bg-primary-50 text-primary",
  };
  return (
    <li className="flex items-center gap-3">
      <div
        className={cn("h-9 w-9 rounded-xl grid place-items-center", tones[tone])}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm flex-1">{label}</p>
      <p className="font-bold text-ink">{value}</p>
    </li>
  );
}

function RiskBadge({
  grade,
  score,
}: {
  grade: "A" | "B" | "C" | "D";
  score: number;
}) {
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
      <span className="text-sm font-semibold text-ink">{score}</span>
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
  };
  const m = map[status] ?? { tone: "muted", label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
