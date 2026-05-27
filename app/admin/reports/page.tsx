"use client";
import { useEffect, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatIDR } from "@/lib/utils";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const toast = useToast();
  const today = new Date();
  const last30 = new Date(today.getTime() - 30 * 86400000);
  const [from, setFrom] = useState(isoDate(last30));
  const [to, setTo] = useState(isoDate(today));
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const res = await admin.reportSummary(from, to);
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    setSummary(res.data.summary);
  };

  useEffect(() => {
    refresh();
  }, [from, to]);

  const exportRows = async (
    type: "applications" | "payments" | "deliveries"
  ) => {
    const res = await admin.reportRows(type, from, to);
    if (!res.ok) return toast.danger("Gagal", res.error);
    const rows = res.data.rows ?? [];
    if (rows.length === 0) return toast.warning("Tidak ada data di periode ini");
    const flat = rows.map((r: any) => Object.assign({}, ...Object.values(r)));
    const headers = Object.keys(flat[0] ?? {});
    const csv =
      headers.join(",") +
      "\n" +
      flat
        .map((row: any) =>
          headers
            .map((h) => {
              const v = row[h];
              return typeof v === "string"
                ? `"${v.replace(/"/g, '""')}"`
                : v ?? "";
            })
            .join(",")
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `report-${type}-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Report ${type} diunduh (${rows.length} baris)`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Reports & Exports</h1>
        <p className="text-ink-muted mt-1">
          Laporan periodik untuk akuntansi, audit internal, dan OJK.
        </p>
      </div>

      <Card>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Dari</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <Label>Sampai</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="skeleton h-32" />
      ) : summary ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Applications"
            value={String(summary.applications)}
            Icon={FileBarChart}
            tone="primary"
          />
          <StatCard
            label="Approval Rate"
            value={`${summary.approvalRate}%`}
            Icon={FileBarChart}
            tone="success"
          />
          <StatCard
            label="Total Disbursed"
            value={formatIDR(summary.disbursed)}
            Icon={FileBarChart}
            tone="primary"
          />
          <StatCard
            label="Total Collected"
            value={formatIDR(summary.collected)}
            Icon={FileBarChart}
            tone="success"
          />
        </div>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardTitle>Applications Report</CardTitle>
          <p className="text-sm text-ink-muted mt-1">
            Detail semua pengajuan: customer, product, tenor, status, risk.
          </p>
          <Button
            block
            variant="secondary"
            className="mt-4"
            onClick={() => exportRows("applications")}
          >
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </Card>
        <Card>
          <CardTitle>Payments Report</CardTitle>
          <p className="text-sm text-ink-muted mt-1">
            Daftar pembayaran DP, cicilan, dan penalty per periode.
          </p>
          <Button
            block
            variant="secondary"
            className="mt-4"
            onClick={() => exportRows("payments")}
          >
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </Card>
        <Card>
          <CardTitle>Deliveries Report</CardTitle>
          <p className="text-sm text-ink-muted mt-1">
            Riwayat pengiriman lengkap dengan kurir dan status proof.
          </p>
          <Button
            block
            variant="secondary"
            className="mt-4"
            onClick={() => exportRows("deliveries")}
          >
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </Card>
      </div>

      {summary ? (
        <Card>
          <CardTitle>Summary Detail</CardTitle>
          <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
            <Row label="Approved" value={String(summary.approved)} />
            <Row label="Rejected" value={String(summary.rejected)} />
            <Row label="Disbursed" value={formatIDR(summary.disbursed)} />
            <Row label="Collected" value={formatIDR(summary.collected)} />
            <Row label="Outstanding Overdue" value={formatIDR(summary.overdue)} />
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between p-3 rounded-2xl bg-slate-50">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
