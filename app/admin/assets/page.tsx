"use client";
import { useState } from "react";
import { Boxes, Download, Eye, PackageCheck, Truck, Warehouse } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { assets, type Asset } from "@/lib/mock-data";
import { formatIDR, cn } from "@/lib/utils";

const filters = ["all", "in_warehouse", "in_delivery", "delivered", "repossessed"] as const;

export default function AssetsPage() {
  const toast = useToast();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [target, setTarget] = useState<Asset | null>(null);

  const list = assets.filter((a) => filter === "all" || a.status === filter);

  const exportRegistry = () => {
    const csv =
      "id,product,imei,status,resaleEstimate\n" +
      assets
        .map((a) => `${a.id},"${a.product}",${a.imei},${a.status},${a.resaleEstimate}`)
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `assets-registry.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Registry diunduh", `${assets.length} aset`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-page font-bold text-ink">Asset Tracking</h1>
          <p className="text-ink-muted mt-1">
            IMEI, serial number, status fisik, dan estimasi resale value.
          </p>
        </div>
        <Button variant="secondary" onClick={exportRegistry}>
          <Download className="h-4 w-4" /> Export Registry
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="In Warehouse" value="42" Icon={Warehouse} tone="primary" />
        <StatCard label="In Delivery" value="14" Icon={Truck} tone="warning" />
        <StatCard label="Delivered" value="328" Icon={PackageCheck} tone="success" />
        <StatCard
          label="Resale Estimate"
          value={formatIDR(1_240_000_000)}
          Icon={Boxes}
          tone="primary"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between flex-wrap gap-3">
          <CardTitle>Asset Registry</CardTitle>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-9 px-3 rounded-xl text-xs font-semibold transition",
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-ink-muted hover:bg-slate-50"
                )}
              >
                {f === "all"
                  ? "Semua"
                  : f.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-ink-muted">
                <th className="px-6 py-3 font-medium">Asset ID</th>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">IMEI / Serial</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Resale Estimate</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-ink-muted">
                    Tidak ada asset di filter ini.
                  </td>
                </tr>
              ) : null}
              {list.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-xs">{a.id}</td>
                  <td className="px-6 py-3 font-semibold text-ink">{a.product}</td>
                  <td className="px-6 py-3 font-mono text-xs text-ink-muted">
                    {a.imei}
                  </td>
                  <td className="px-6 py-3">
                    <AssetBadge status={a.status} />
                  </td>
                  <td className="px-6 py-3 font-semibold text-ink">
                    {formatIDR(a.resaleEstimate)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setTarget(a)}
                    >
                      <Eye className="h-4 w-4" /> Detail
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title={target?.product ?? ""}
        description={`Asset ${target?.id}`}
      >
        {target ? (
          <div className="space-y-3">
            <Row label="Asset ID" value={target.id} mono />
            <Row label="IMEI / Serial" value={target.imei} mono />
            <Row label="Status" value={target.status.replace("_", " ")} />
            <Row label="Resale Estimate" value={formatIDR(target.resaleEstimate)} />
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-ink-muted">
              <p className="font-semibold text-ink mb-1">Status Timeline</p>
              <ol className="space-y-1">
                <li>✓ PO recorded — 21 Mei 2026</li>
                <li>✓ Received di warehouse — 22 Mei 2026</li>
                <li>✓ QC passed — 22 Mei 2026</li>
                <li>{target.status === "delivered" ? "✓" : "○"} Delivered</li>
              </ol>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function AssetBadge({ status }: { status: string }) {
  const map: Record<string, { tone: any; label: string }> = {
    in_warehouse: { tone: "primary", label: "In Warehouse" },
    in_delivery: { tone: "warning", label: "In Delivery" },
    delivered: { tone: "success", label: "Delivered" },
    repossessed: { tone: "danger", label: "Repossessed" },
  };
  const m = map[status] ?? { tone: "muted", label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-border last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className={cn("font-medium text-ink", mono && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}
