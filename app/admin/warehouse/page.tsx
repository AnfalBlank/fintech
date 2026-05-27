"use client";
import { useEffect, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Package,
  PackageCheck,
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
import { admin } from "@/lib/client";
import { formatIDR, formatDate, cn } from "@/lib/utils";

export default function WarehousePage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"po" | "qc">("po");
  const [poTarget, setPoTarget] = useState<any | null>(null);
  const [qcTarget, setQcTarget] = useState<any | null>(null);
  const [serial, setSerial] = useState("");
  const [invoice, setInvoice] = useState("");

  const refresh = async () => {
    setLoading(true);
    const res = await admin.warehousePO();
    setLoading(false);
    if (res.ok) setItems(res.data.items);
  };
  useEffect(() => {
    refresh();
  }, []);

  const recordPurchase = async () => {
    if (!poTarget) return;
    const res = await admin.recordPurchase(poTarget.asset.id, invoice);
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success("PO tercatat", `Invoice ${invoice}`);
    setPoTarget(null);
    setInvoice("");
    refresh();
  };

  const performQc = async (result: "passed" | "failed") => {
    if (!qcTarget) return;
    const res = await admin.qc(qcTarget.asset.id, result, serial || undefined, 4);
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success(result === "passed" ? "QC Lolos" : "QC Gagal");
    setQcTarget(null);
    setSerial("");
    refresh();
  };

  const poList = items.filter(
    (i) => i.asset.status === "to_purchase" || i.asset.status === "purchased"
  );
  const qcList = items.filter((i) => i.asset.status === "in_warehouse" || (i.asset.status === "purchased" && i.asset.qcStatus === "pending"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Warehouse & QC</h1>
        <p className="text-ink-muted mt-1">
          Pencatatan pembelian, penerimaan barang, dan QC sesuai PRD §11 Step 9
          & 10.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="To Purchase"
          value={String(items.filter((i) => i.asset.status === "to_purchase").length)}
          Icon={ShoppingCart}
          tone="warning"
        />
        <StatCard
          label="Purchased"
          value={String(items.filter((i) => i.asset.status === "purchased").length)}
          Icon={Package}
          tone="primary"
        />
        <StatCard
          label="QC Pending"
          value={String(items.filter((i) => i.asset.qcStatus === "pending").length)}
          Icon={Warehouse}
          tone="warning"
        />
        <StatCard
          label="QC Passed"
          value={String(items.filter((i) => i.asset.qcStatus === "passed").length)}
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

      {loading ? <div className="skeleton h-40" /> : null}

      {tab === "po" ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-ink-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Asset ID</th>
                  <th className="px-6 py-3 font-medium">Application</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {poList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-ink-muted">
                      Tidak ada PO aktif
                    </td>
                  </tr>
                ) : null}
                {poList.map((row) => (
                  <tr key={row.asset.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono text-xs">
                      {row.asset.id}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-ink-muted">
                      {row.app?.id}
                    </td>
                    <td className="px-6 py-3 font-semibold text-ink">
                      {row.product?.title}
                    </td>
                    <td className="px-6 py-3">
                      {formatIDR(row.product?.price ?? 0)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        tone={
                          row.asset.status === "purchased" ? "primary" : "warning"
                        }
                      >
                        {row.asset.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {row.asset.status === "to_purchase" ? (
                        <Button size="sm" onClick={() => setPoTarget(row)}>
                          Record Purchase
                        </Button>
                      ) : (
                        <span className="text-xs text-ink-muted">
                          {row.asset.purchaseInvoiceNo}
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
          </div>
          <ul className="divide-y divide-border">
            {qcList.length === 0 ? (
              <li className="p-8 text-center text-sm text-ink-muted">
                Tidak ada barang menunggu QC
              </li>
            ) : null}
            {qcList.map((row) => (
              <li
                key={row.asset.id}
                className="p-5 flex items-start gap-4 hover:bg-slate-50"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary grid place-items-center">
                  <Package className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between flex-wrap gap-2">
                    <p className="font-semibold text-ink">
                      {row.product?.title}
                    </p>
                    <Badge
                      tone={
                        row.asset.qcStatus === "passed"
                          ? "success"
                          : row.asset.qcStatus === "failed"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {row.asset.qcStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {row.asset.id} · {row.app?.id}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-muted">
                    {row.asset.imeiOrSerial ? (
                      <span>
                        Serial:{" "}
                        <span className="font-mono">
                          {row.asset.imeiOrSerial}
                        </span>
                      </span>
                    ) : null}
                    <span>{row.asset.qcPhotoCount} foto QC</span>
                  </div>
                </div>
                {row.asset.qcStatus === "pending" ? (
                  <Button size="sm" onClick={() => setQcTarget(row)}>
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
        description={`Catat invoice untuk ${poTarget?.asset.id}`}
      >
        <div className="space-y-3">
          <Row label="Product" value={poTarget?.product?.title ?? ""} />
          <Row
            label="Marketplace"
            value={poTarget?.product?.marketplace ?? ""}
          />
          <Row
            label="Price"
            value={poTarget ? formatIDR(poTarget.product?.price ?? 0) : ""}
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
          <Button
            onClick={recordPurchase}
            disabled={!invoice.trim() || invoice.length < 4}
          >
            Simpan PO
          </Button>
        </div>
      </Modal>

      <Modal
        open={qcTarget !== null}
        onClose={() => setQcTarget(null)}
        title="Quality Control"
        description={`QC barang ${qcTarget?.product?.title}`}
        size="lg"
      >
        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          {[1, 2, 3].map((i) => (
            <button
              key={i}
              onClick={() => toast.info("Foto disimpan", `Slot ${i}`)}
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
            <p>✓ Kelengkapan accessories</p>
            <p>✓ Validasi serial sesuai invoice</p>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-2 border-b border-border">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
