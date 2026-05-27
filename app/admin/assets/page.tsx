"use client";
import { useEffect, useState } from "react";
import { Boxes, Download, Eye, PackageCheck, Truck, Warehouse } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatIDR, cn } from "@/lib/utils";

const filters = ["all", "to_purchase", "purchased", "in_warehouse", "in_delivery", "delivered"] as const;

export default function AssetsPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [target, setTarget] = useState<any | null>(null);

  const refresh = async () => {
    setLoading(true);
    const res = await admin.assets();
    setLoading(false);
    if (res.ok) setItems(res.data.items);
  };
  useEffect(() => {
    refresh();
  }, []);

  const list = items.filter((x) => filter === "all" || x.a.status === filter);

  const exportRegistry = () => {
    const csv =
      "id,product,imei,status,resaleEstimate\n" +
      items
        .map(
          (i) =>
            `${i.a.id},"${i.a.productTitle}",${i.a.imeiOrSerial ?? ""},${i.a.status},${i.a.resaleEstimate ?? 0}`
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "assets-registry.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Registry diunduh");
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
        <StatCard
          label="In Warehouse"
          value={String(items.filter((x) => x.a.status === "in_warehouse").length)}
          Icon={Warehouse}
          tone="primary"
        />
        <StatCard
          label="In Delivery"
          value={String(items.filter((x) => x.a.status === "in_delivery").length)}
          Icon={Truck}
          tone="warning"
        />
        <StatCard
          label="Delivered"
          value={String(items.filter((x) => x.a.status === "delivered").length)}
          Icon={PackageCheck}
          tone="success"
        />
        <StatCard
          label="Resale Estimate"
          value={formatIDR(
            items.reduce((s, x) => s + (x.a.resaleEstimate ?? 0), 0)
          )}
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
        {loading ? <div className="skeleton h-40 m-6" /> : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-ink-muted">
                <th className="px-6 py-3 font-medium">Asset ID</th>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">IMEI / Serial</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Resale</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-ink-muted">
                    Tidak ada asset
                  </td>
                </tr>
              ) : null}
              {list.map((row) => {
                const a = row.a;
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-xs">{a.id}</td>
                    <td className="px-6 py-3 font-semibold text-ink">
                      {a.productTitle}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-ink-muted">
                      {a.imeiOrSerial ?? "—"}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        tone={
                          a.status === "delivered"
                            ? "success"
                            : a.status === "in_warehouse"
                              ? "primary"
                              : a.status === "in_delivery"
                                ? "warning"
                                : "muted"
                        }
                      >
                        {a.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 font-semibold text-ink">
                      {formatIDR(a.resaleEstimate ?? 0)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setTarget(row)}
                      >
                        <Eye className="h-4 w-4" /> Detail
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title={target?.a.productTitle ?? ""}
        description={`Asset ${target?.a.id ?? ""}`}
      >
        {target ? (
          <div className="space-y-3 text-sm">
            <Row label="Asset ID" value={target.a.id} mono />
            <Row label="IMEI" value={target.a.imeiOrSerial ?? "—"} mono />
            <Row label="Status" value={target.a.status.replace("_", " ")} />
            <Row label="Invoice" value={target.a.purchaseInvoiceNo ?? "—"} />
            <Row label="QC" value={target.a.qcStatus} />
            <Row
              label="Resale Estimate"
              value={formatIDR(target.a.resaleEstimate ?? 0)}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
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
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className={cn("font-medium text-ink", mono && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}
