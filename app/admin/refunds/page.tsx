"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RotateCcw } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatIDR, formatDate } from "@/lib/utils";

export default function RefundsPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{
    id: string;
    action: "process" | "reject";
  } | null>(null);
  const [note, setNote] = useState("");
  const [form, setForm] = useState({
    applicationId: "",
    amount: 0,
    reason: "",
  });

  const refresh = async () => {
    setLoading(true);
    const res = await admin.refunds();
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    setItems(res.data.items);
  };
  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    if (!form.applicationId || form.amount <= 0 || form.reason.length < 5)
      return toast.warning("Lengkapi data refund");
    const res = await admin.createRefund(form);
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success("Refund tercatat");
    setCreateOpen(false);
    setForm({ applicationId: "", amount: 0, reason: "" });
    refresh();
  };

  const resolve = async () => {
    if (!actionTarget) return;
    const res = await admin.resolveRefund(
      actionTarget.id,
      actionTarget.action,
      note
    );
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success(
      actionTarget.action === "process" ? "Refund diproses" : "Refund ditolak"
    );
    setActionTarget(null);
    setNote("");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-page font-bold text-ink">Refunds</h1>
          <p className="text-ink-muted mt-1">
            Pengembalian DP atau pembatalan aplikasi sebelum delivered.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Buat Refund
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6">
          <CardTitle>{loading ? "Loading…" : `${items.length} refund`}</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-ink-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Refund ID</th>
                <th className="px-6 py-3 font-medium">Application</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Reason</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Tanggal</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-ink-muted">
                    Belum ada refund
                  </td>
                </tr>
              ) : null}
              {items.map((row) => (
                <tr key={row.r.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-xs">{row.r.id}</td>
                  <td className="px-6 py-3 font-mono text-xs">
                    <Link
                      href={`/admin/applications/${row.r.applicationId}`}
                      className="text-primary hover:underline"
                    >
                      {row.r.applicationId}
                    </Link>
                  </td>
                  <td className="px-6 py-3">{row.user?.name ?? "—"}</td>
                  <td className="px-6 py-3 font-semibold text-ink">
                    {formatIDR(row.r.amount)}
                  </td>
                  <td className="px-6 py-3 text-xs text-ink-muted max-w-[240px] truncate">
                    {row.r.reason}
                  </td>
                  <td className="px-6 py-3">
                    <Badge
                      tone={
                        row.r.status === "processed"
                          ? "success"
                          : row.r.status === "rejected"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {row.r.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-xs text-ink-muted">
                    {formatDate(new Date(row.r.createdAt))}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {row.r.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() =>
                            setActionTarget({ id: row.r.id, action: "process" })
                          }
                        >
                          Process
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            setActionTarget({ id: row.r.id, action: "reject" })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Buat Refund"
        description="Pengembalian dana untuk aplikasi yang dibatalkan."
      >
        <div className="space-y-3">
          <div>
            <Label>Application ID</Label>
            <Input
              value={form.applicationId}
              onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
              placeholder="APP-..."
              className="font-mono"
            />
          </div>
          <div>
            <Label>Jumlah Refund (Rp)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Alasan</Label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="input-base h-auto py-3"
              placeholder="Alasan refund…"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>
            Batal
          </Button>
          <Button onClick={create}>Simpan</Button>
        </div>
      </Modal>

      <Modal
        open={actionTarget !== null}
        onClose={() => {
          setActionTarget(null);
          setNote("");
        }}
        title={
          actionTarget?.action === "process"
            ? "Proses refund"
            : "Tolak refund"
        }
        description={
          actionTarget?.action === "process"
            ? "Refund akan ditandai diproses, aplikasi akan dibatalkan."
            : "Refund akan ditolak."
        }
      >
        <div>
          <Label>Catatan</Label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input-base h-auto py-3"
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setActionTarget(null);
              setNote("");
            }}
          >
            Batal
          </Button>
          <Button
            variant={actionTarget?.action === "process" ? "success" : "danger"}
            onClick={resolve}
          >
            Konfirmasi
          </Button>
        </div>
      </Modal>
    </div>
  );
}
