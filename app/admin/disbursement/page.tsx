"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, ChevronRight, Wallet } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatIDR, formatDate, cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "Semua" },
  { key: "approved", label: "Approved" },
  { key: "dp_pending", label: "DP Pending" },
  { key: "purchasing", label: "Purchasing" },
  { key: "warehouse", label: "Warehouse" },
] as const;

export default function DisbursementPage() {
  const toast = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [invoice, setInvoice] = useState("");

  const refresh = async () => {
    setLoading(true);
    const res = await admin.disbursement();
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    setData(res.data);
  };
  useEffect(() => {
    refresh();
  }, []);

  if (loading) return <div className="skeleton h-96" />;
  if (!data) return null;

  const items = data.items as any[];
  const list = filter === "all" ? items : items.filter((i) => i.app.status === filter);

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  const allChecked = list.length > 0 && list.every((i) => selected.includes(i.app.id));

  const submitBulk = async () => {
    const res = await admin.markDisbursed(selected, invoice || undefined);
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success(`${res.data.updated} aplikasi diupdate`);
    setSelected([]);
    setBulkOpen(false);
    setInvoice("");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Disbursement Queue</h1>
        <p className="text-ink-muted mt-1">
          Aplikasi yang menunggu modal di-keluarkan untuk pembelian barang.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending DP"
          value={formatIDR(data.kpi.pendingDp)}
          Icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Ready to Disburse"
          value={formatIDR(data.kpi.readyDisburse)}
          Icon={Banknote}
          tone="primary"
        />
        <StatCard
          label="Total Antri"
          value={String(items.length)}
          Icon={ChevronRight}
          tone="primary"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Queue</CardTitle>
            <p className="text-sm text-ink-muted mt-0.5">
              {selected.length > 0
                ? `${selected.length} dipilih`
                : `${list.length} aplikasi`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "h-9 px-3 rounded-xl text-xs font-semibold transition",
                  filter === f.key
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-ink-muted hover:bg-slate-50"
                )}
              >
                {f.label}
              </button>
            ))}
            <Button
              size="sm"
              disabled={selected.length === 0}
              onClick={() => setBulkOpen(true)}
            >
              <Banknote className="h-4 w-4" />
              Mark Disbursed ({selected.length})
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-ink-muted">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={() =>
                      setSelected(allChecked ? [] : list.map((i) => i.app.id))
                    }
                    className="h-4 w-4 rounded accent-primary"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Application</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">DP Paid</th>
                <th className="px-4 py-3 font-medium">Financed</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-muted">
                    Tidak ada antrian
                  </td>
                </tr>
              ) : null}
              {list.map((row) => {
                const a = row.app;
                const dpPaid = Number(row.dpPaidSum ?? 0);
                const checked = selected.includes(a.id);
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(a.id)}
                        className="h-4 w-4 rounded accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-ink-muted">{a.id}</p>
                      <p className="font-semibold text-ink truncate max-w-[200px]">
                        {row.product?.title}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {formatDate(new Date(a.submittedAt))}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{row.user?.name}</p>
                      <p className="text-xs text-ink-muted">{row.user?.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          a.status === "purchasing"
                            ? "primary"
                            : a.status === "warehouse"
                              ? "info"
                              : a.status === "dp_pending"
                                ? "warning"
                                : "muted"
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {dpPaid > 0 ? (
                        <span className="text-emerald font-semibold">
                          {formatIDR(dpPaid)}
                        </span>
                      ) : a.dpRequired ? (
                        <span className="text-warning text-xs">
                          Belum bayar
                        </span>
                      ) : (
                        <span className="text-ink-muted text-xs">No DP</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {formatIDR(a.financed)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/applications/${a.id}`}>
                        <Button variant="secondary" size="sm">
                          Detail
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Mark sebagai Disbursed"
        description={`${selected.length} aplikasi akan ditandai sudah dibelikan dan masuk warehouse.`}
      >
        <div>
          <Label>Nomor Invoice (opsional)</Label>
          <Input
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            placeholder="INV-..."
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setBulkOpen(false)}>
            Batal
          </Button>
          <Button onClick={submitBulk}>Konfirmasi</Button>
        </div>
      </Modal>
    </div>
  );
}
