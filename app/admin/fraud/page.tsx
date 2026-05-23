"use client";
import { useState } from "react";
import { Download, ShieldAlert, Smartphone, UserX } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { StatCard } from "@/components/ui/stat-card";
import { fraudAlerts as initial } from "@/lib/mock-data";
import type { FraudAlert } from "@/lib/mock-data";
import { formatDate, cn } from "@/lib/utils";

export default function FraudPage() {
  const toast = useToast();
  const [items, setItems] = useState<FraudAlert[]>(initial);
  const [reviewTarget, setReviewTarget] = useState<FraudAlert | null>(null);
  const [blockTarget, setBlockTarget] = useState<FraudAlert | null>(null);

  const exportCsv = () => {
    const header = "id,reason,user,device,severity,detectedAt\n";
    const rows = items
      .map(
        (f) =>
          `${f.id},"${f.reason}",${f.user},"${f.device}",${f.severity},${f.detectedAt}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraud-alerts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export berhasil", `${items.length} fraud alerts diunduh`);
  };

  const review = () => {
    if (!reviewTarget) return;
    setItems((s) => s.filter((x) => x.id !== reviewTarget.id));
    toast.info("Alert direview", `${reviewTarget.id} ditandai sebagai dibahas`);
    setReviewTarget(null);
  };

  const block = () => {
    if (!blockTarget) return;
    setItems((s) => s.filter((x) => x.id !== blockTarget.id));
    toast.danger(
      "User diblokir",
      `${blockTarget.user} ditambahkan ke blacklist`
    );
    setBlockTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Fraud Detection</h1>
        <p className="text-ink-muted mt-1">
          Multiple accounts, fake KTP, suspicious behavior, dan device duplication.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Alerts"
          value={String(items.length)}
          delta="+3"
          trend="up"
          Icon={ShieldAlert}
          tone="danger"
        />
        <StatCard
          label="Blocked Accounts"
          value="48"
          Icon={UserX}
          tone="warning"
        />
        <StatCard
          label="Duplicate Devices"
          value="12"
          Icon={Smartphone}
          tone="primary"
        />
        <StatCard
          label="Auto Rejected"
          value="92"
          delta="+11"
          trend="up"
          Icon={ShieldAlert}
          tone="primary"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardTitle>Fraud Heatmap</CardTitle>
          <p className="text-sm text-ink-muted mt-1">Aktivitas 14 hari</p>
          <div className="mt-5 grid grid-cols-14 gap-1">
            {Array.from({ length: 7 * 14 }).map((_, i) => {
              const intensity = (i * 7) % 5;
              const color = [
                "bg-slate-100",
                "bg-danger/20",
                "bg-danger/40",
                "bg-danger/60",
                "bg-danger/80",
              ][intensity];
              return <div key={i} className={cn("h-4 rounded", color)} />;
            })}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1 text-xs text-ink-muted">
            <span>Less</span>
            <span className="h-3 w-3 rounded bg-slate-100" />
            <span className="h-3 w-3 rounded bg-danger/30" />
            <span className="h-3 w-3 rounded bg-danger/60" />
            <span className="h-3 w-3 rounded bg-danger" />
            <span>More</span>
          </div>
        </Card>

        <Card>
          <CardTitle>Top Detection Reasons</CardTitle>
          <ul className="mt-4 space-y-3">
            {[
              { r: "Multiple accounts on device", v: 38 },
              { r: "Fake / edited KTP", v: 27 },
              { r: "Selfie liveness fail", v: 18 },
              { r: "Suspicious IP (VPN)", v: 12 },
              { r: "High velocity submissions", v: 5 },
            ].map((row) => (
              <li key={row.r}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-ink">{row.r}</span>
                  <span className="text-ink-muted">{row.v}</span>
                </div>
                <div className="h-1.5 mt-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-danger rounded-full"
                    style={{ width: `${row.v * 2}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle>Devices to Watch</CardTitle>
          <ul className="mt-4 space-y-3">
            {[
              { d: "Xiaomi 13", fp: "9a83…b2c1", c: 5 },
              { d: "iPhone 12", fp: "1c92…ff09", c: 4 },
              { d: "Samsung A52", fp: "4b71…ee21", c: 3 },
              { d: "Realme C25", fp: "8d92…aa21", c: 3 },
            ].map((d) => (
              <li
                key={d.fp}
                className="flex items-center justify-between p-3 rounded-2xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-warning/10 text-warning grid place-items-center">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{d.d}</p>
                    <p className="text-xs text-ink-muted font-mono">{d.fp}</p>
                  </div>
                </div>
                <Badge tone="danger">{d.c} akun</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <CardTitle>Recent Alerts</CardTitle>
          <Button variant="secondary" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {items.length === 0 ? (
            <li className="p-8 text-center text-sm text-ink-muted">
              Tidak ada fraud alert aktif.
            </li>
          ) : null}
          {items.map((f) => (
            <li
              key={f.id}
              className="p-5 flex items-start gap-4 hover:bg-slate-50"
            >
              <div className="h-11 w-11 rounded-2xl bg-danger/10 text-danger grid place-items-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 justify-between flex-wrap">
                  <p className="font-semibold text-ink">{f.reason}</p>
                  <Badge
                    tone={
                      f.severity === "high"
                        ? "danger"
                        : f.severity === "medium"
                          ? "warning"
                          : "info"
                    }
                  >
                    {f.severity}
                  </Badge>
                </div>
                <p className="text-sm text-ink-muted mt-1">
                  {f.user} · {f.device}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Detected {formatDate(f.detectedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setReviewTarget(f)}
                >
                  Review
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setBlockTarget(f)}
                >
                  Block
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={reviewTarget !== null}
        onClose={() => setReviewTarget(null)}
        title="Review Fraud Alert"
        description={reviewTarget?.reason}
      >
        <div className="space-y-3 text-sm">
          <Row label="Alert ID" value={reviewTarget?.id ?? ""} />
          <Row label="User" value={reviewTarget?.user ?? ""} />
          <Row label="Device" value={reviewTarget?.device ?? ""} />
          <Row label="Severity" value={reviewTarget?.severity ?? ""} />
          <Row
            label="Detected"
            value={
              reviewTarget ? formatDate(reviewTarget.detectedAt) : ""
            }
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setReviewTarget(null)}>
            Tutup
          </Button>
          <Button onClick={review}>Tandai Selesai Direview</Button>
        </div>
      </Modal>

      <Modal
        open={blockTarget !== null}
        onClose={() => setBlockTarget(null)}
        title="Block & Blacklist"
        description={`Akan memblokir ${blockTarget?.user}. User tidak dapat ajukan cicilan baru.`}
      >
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={() => setBlockTarget(null)}>
            Batal
          </Button>
          <Button variant="danger" onClick={block}>
            <UserX className="h-4 w-4" /> Block User
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
