"use client";
import { useState } from "react";
import {
  Camera,
  CheckCircle2,
  Package,
  PackageCheck,
  Plus,
  ShoppingCart,
  Warehouse,
  XCircle,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import {
  purchaseOrders as initialPo,
  warehouseItems as initialWh,
  type PurchaseOrder,
  type WarehouseItem,
} from "@/lib/mock-data-extra";
import { formatIDR, formatDate, cn } from "@/lib/utils";

export default function WarehousePage() {
  const toast = useToast();
  const [pos, setPos] = useState<PurchaseOrder[]>(initialPo);
  const [items, setItems] = useState<WarehouseItem[]>(initialWh);
  const [tab, setTab] = useState<"po" | "qc">("po");
  const [poTarget, setPoTarget] = useState<PurchaseOrder | null>(null);
  const [qcTarget, setQcTarget] = useState<WarehouseItem | null>(null);
  const [serial, setSerial] = useState("");
  const [invoice, setInvoice] = useState("");

  const recordPurchase = () => {
    if (!poTarget) return;
    setPos((s) =>
      s.map((p) =>
        p.id === poTarget.id
          ? { ...p, status: "purchased", invoiceNo: invoice || "INV-AUTO" }
          : p
      )
    );
    toast.success("PO tercatat", `Invoice ${invoice} disimpan untuk ${poTarget.id}`);
    setPoTarget(null);
    setInvoice("");
  };

  const performQc = (status: "passed" | "failed") => {
    if (!qcTarget) return;
    setItems((s) =>
      s.map((w) =>
        w.id === qcTarget.id
          ? {
              ...w,
              qcStatus: status,
              serialNumber: serial || w.serialNumber,
              photos: 4,
              checkedBy: "Andini Pratama",
            }
          : w
      )
    );
    toast.success(
      status === "passed" ? "QC Lolos" : "QC Gagal",
      `${qcTarget.id} ditandai ${status}`
    );
    setQcTarget(null);
    setSerial("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Warehouse & QC</h1>
        <p className="text-ink-muted mt-1">
          Pencatatan pembelian, penerimaan barang, dan quality control sesuai
          PRD §11 Step 9 & 10.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="To Purchase"
          value={String(pos.filter((p) => p.status === "to_purchase").length)}
          Icon={ShoppingCart}
          tone="warning"
        />
        <StatCard
          label="In Warehouse"
          value={String(items.length)}
          Icon={Warehouse}
          tone="primary"
        />
        <StatCard
          label="QC Pending"
          value={String(items.filter((i) => i.qcStatus === "pending").length)}
          Icon={Package}
          tone="warning"
        />
        <StatCard
          label="QC Passed"
          value={String(items.filter((i) => i.qcStatus === "passed").length)}
          Icon={PackageCheck}
          tone="success"
        />
      </div>

      <div className="flex gap-2 border-b border-border">
        <TabBtn active={tab === "po"} onClick={() => setTab("po")}>
          Purchase Orders
        </TabBtn>
        <TabBtn active={tab === "qc"} onClick={() => setTab("qc")}>
          Warehouse / QC
        </TabBtn>
      </div>

      {tab === "po" ? (
        <Card className="p-0 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <CardTitle>Purchase Orders</CardTitle>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                toast.info("Coming soon", "PO manual akan terhubung ke approval")
              }
            >
              <Plus className="h-4 w-4" /> PO Manual
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-ink-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">PO ID</th>
                  <th className="px-6 py-3 font-medium">Application</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Buyer</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-6 py-3 font-mono text-xs text-ink-muted">
                      {p.applicationId}
                    </td>
                    <td className="px-6 py-3 font-semibold text-ink">
                      {p.product}
                    </td>
                    <td className="px-6 py-3">{formatIDR(p.price)}</td>
                    <td className="px-6 py-3">
                      <PoBadge status={p.status} />
                    </td>
                    <td className="px-6 py-3 text-ink-muted">{p.buyer}</td>
                    <td className="px-6 py-3 text-right">
                      {p.status === "to_purchase" ? (
                        <Button size="sm" onClick={() => setPoTarget(p)}>
                          Record Purchase
                        </Button>
                      ) : (
                        <span className="text-xs text-ink-muted">
                          {p.invoiceNo}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="p-6">
            <CardTitle>Warehouse / QC</CardTitle>
            <p className="text-sm text-ink-muted mt-0.5">
              Foto dokumentasi, serial number, dan validasi kondisi barang.
            </p>
          </div>
          <ul className="divide-y divide-border">
            {items.map((w) => (
              <li
                key={w.id}
                className="p-5 flex items-start gap-4 hover:bg-slate-50"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary grid place-items-center">
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between flex-wrap gap-2">
                    <p className="font-semibold text-ink">{w.product}</p>
                    <QcBadge status={w.qcStatus} />
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {w.id} · PO {w.poId} · arrived {formatDate(w.arrivedAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-muted">
                    {w.serialNumber ? (
                      <span>Serial: <span className="font-mono">{w.serialNumber}</span></span>
                    ) : null}
                    <span>{w.photos} foto QC</span>
                    {w.checkedBy ? <span>Checked by {w.checkedBy}</span> : null}
                  </div>
                </div>
                {w.qcStatus === "pending" ? (
                  <Button size="sm" onClick={() => setQcTarget(w)}>
                    <Camera className="h-4 w-4" /> Mulai QC
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={poTarget !== null}
        onClose={() => setPoTarget(null)}
        title="Record Purchase"
        description={`Catat invoice & buyer untuk ${poTarget?.id}`}
      >
        <div className="space-y-3">
          <Row label="Product" value={poTarget?.product ?? ""} />
          <Row label="Marketplace" value={poTarget?.marketplace ?? ""} />
          <Row
            label="Price"
            value={poTarget ? formatIDR(poTarget.price) : ""}
          />
          <div>
            <Label>Nomor Invoice</Label>
            <Input
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              placeholder="INV-TKP-..."
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setPoTarget(null)}>
            Batal
          </Button>
          <Button onClick={recordPurchase} disabled={!invoice.trim()}>
            Simpan PO
          </Button>
        </div>
      </Modal>

      <Modal
        open={qcTarget !== null}
        onClose={() => setQcTarget(null)}
        title="Quality Control"
        description={`QC barang ${qcTarget?.product}`}
        size="lg"
      >
        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          {[1, 2, 3].map((i) => (
            <button
              key={i}
              onClick={() => toast.info("Upload foto", `Foto ${i} disimpan`)}
              className="aspect-square rounded-2xl border-2 border-dashed border-border bg-slate-50 grid place-items-center hover:border-primary"
            >
              <div className="text-center">
                <Camera className="h-8 w-8 text-ink-muted mx-auto" />
                <p className="text-xs text-ink-muted mt-2">Foto {i}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <div>
            <Label>Serial Number / IMEI</Label>
            <Input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="Scan atau input manual"
            />
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-ink-muted space-y-1">
            <p>✓ Periksa kondisi fisik barang</p>
            <p>✓ Pastikan kelengkapan accessories</p>
            <p>✓ Validasi serial sesuai invoice</p>
            <p>✓ Foto dari 3 sudut berbeda</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="danger" onClick={() => performQc("failed")}>
            <XCircle className="h-4 w-4" /> Tandai Gagal
          </Button>
          <Button variant="success" onClick={() => performQc("passed")}>
            <CheckCircle2 className="h-4 w-4" /> Lolos QC
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px",
        active
          ? "border-primary text-primary"
          : "border-transparent text-ink-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function PoBadge({ status }: { status: PurchaseOrder["status"] }) {
  const map = {
    to_purchase: { tone: "warning" as const, label: "To Purchase" },
    purchased: { tone: "primary" as const, label: "Purchased" },
    shipped_to_warehouse: { tone: "info" as const, label: "Shipping" },
    received: { tone: "success" as const, label: "Received" },
  };
  const m = map[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

function QcBadge({ status }: { status: WarehouseItem["qcStatus"] }) {
  const map = {
    pending: { tone: "warning" as const, label: "Pending" },
    passed: { tone: "success" as const, label: "Passed" },
    failed: { tone: "danger" as const, label: "Failed" },
  };
  const m = map[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-border">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
