"use client";
import { useEffect, useState } from "react";
import { Download, ShieldAlert, Smartphone, UserX } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { StatCard } from "@/components/ui/stat-card";
import { admin } from "@/lib/client";
import { formatDate, cn } from "@/lib/utils";

export default function FraudPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);
  const [blockTarget, setBlockTarget] = useState<any | null>(null);

  const refresh = async () => {
    setLoading(true);
    const res = await admin.fraud();
    setLoading(false);
    if (res.ok) setItems(res.data.items);
  };
  useEffect(() => {
    refresh();
  }, []);

  const exportCsv = () => {
    const csv =
      "id,reason,severity,status,detectedAt\n" +
      items
        .map(
          (i) =>
            `${i.f.id},"${i.f.reason}",${i.f.severity},${i.f.status},${i.f.detectedAt}`
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fraud-alerts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Export berhasil");
  };

  const review = async () => {
    if (!reviewTarget) return;
    const res = await admin.resolveFraud(reviewTarget.f.id, "review");
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.info("Direview");
    setReviewTarget(null);
    refresh();
  };

  const block = async () => {
    if (!blockTarget) return;
    const res = await admin.resolveFraud(blockTarget.f.id, "block");
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.danger("User diblokir");
    setBlockTarget(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Fraud Detection</h1>
        <p className="text-ink-muted mt-1">
          Multiple accounts, fake KTP, suspicious behavior, device duplication.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Alerts"
          value={String(items.filter((i) => i.f.status === "open").length)}
          Icon={ShieldAlert}
          tone="danger"
        />
        <StatCard
          label="Blocked"
          value={String(items.filter((i) => i.f.status === "blocked").length)}
          Icon={UserX}
          tone="warning"
        />
        <StatCard
          label="Reviewed"
          value={String(items.filter((i) => i.f.status === "reviewed").length)}
          Icon={ShieldAlert}
          tone="primary"
        />
        <StatCard
          label="Total"
          value={String(items.length)}
          Icon={Smartphone}
          tone="primary"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <CardTitle>Recent Alerts</CardTitle>
          <Button variant="secondary" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
        {loading ? <div className="skeleton h-40 m-6" /> : null}
        <ul className="divide-y divide-border">
          {items.length === 0 && !loading ? (
            <li className="p-8 text-center text-sm text-ink-muted">
              Tidak ada fraud alert aktif.
            </li>
          ) : null}
          {items.map((row) => {
            const f = row.f;
            return (
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
                    {row.user?.name ?? "—"} · {f.status}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Detected {formatDate(new Date(f.detectedAt))}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={f.status !== "open"}
                    onClick={() => setReviewTarget(row)}
                  >
                    Review
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={f.status !== "open"}
                    onClick={() => setBlockTarget(row)}
                  >
                    Block
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Modal
        open={reviewTarget !== null}
        onClose={() => setReviewTarget(null)}
        title="Review Fraud Alert"
        description={reviewTarget?.f.reason}
      >
        <div className="flex justify-end gap-3 mt-4">
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
        description={`Akan memblokir ${blockTarget?.user?.name ?? "—"}.`}
      >
        <div className="flex justify-end gap-3 mt-4">
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
