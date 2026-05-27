"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  Bell,
  CheckCircle2,
  Mail,
  MessageSquare,
  PhoneCall,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatIDR, formatDate, cn, daysBetween } from "@/lib/utils";

export default function CollectionPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState<"wa" | "email" | null>(null);
  const [message, setMessage] = useState(
    "Halo, ini reminder cicilan Anda yang sudah jatuh tempo. Mohon segera lakukan pembayaran."
  );

  const refresh = async () => {
    setLoading(true);
    const res = await admin.collection();
    setLoading(false);
    if (res.ok) setItems(res.data.items);
  };
  useEffect(() => {
    refresh();
  }, []);

  const totalOverdue = items.reduce(
    (s, i) => s + i.i.amount + (i.i.penaltyAmount ?? 0),
    0
  );
  const allSelected =
    items.length > 0 && items.every((i) => selected.includes(i.i.id));

  const sendBulk = async () => {
    const channel = bulkOpen === "wa" ? "wa" : "email";
    const res = await admin.sendReminder(selected, channel, message);
    if (!res.ok) return toast.danger("Gagal kirim", res.error);
    toast.success(
      `${channel === "wa" ? "WhatsApp" : "Email"} terkirim`,
      `${res.data.sent} reminder`
    );
    setSelected([]);
    setBulkOpen(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Collection Dashboard</h1>
        <p className="text-ink-muted mt-1">
          Monitor overdue, kirim reminder, dan eskalasi.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Overdue"
          value={formatIDR(totalOverdue)}
          Icon={AlertCircle}
          tone="danger"
        />
        <StatCard
          label="Overdue Count"
          value={String(items.length)}
          Icon={Bell}
          tone="warning"
        />
        <StatCard label="Recovered (MTD)" value="—" Icon={ArrowDownRight} tone="primary" />
        <StatCard label="Collection Rate" value="—" Icon={CheckCircle2} tone="success" />
      </div>

      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Overdue List</CardTitle>
            <p className="text-sm text-ink-muted mt-0.5">
              {selected.length > 0 ? `${selected.length} dipilih` : `${items.length} overdue`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={selected.length === 0}
              onClick={() => setBulkOpen("wa")}
            >
              <MessageSquare className="h-4 w-4" /> WA Massal
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={selected.length === 0}
              onClick={() => setBulkOpen("email")}
            >
              <Mail className="h-4 w-4" /> Email Reminder
            </Button>
          </div>
        </div>

        {loading ? <div className="skeleton h-32 mt-4" /> : null}

        <div className="mt-4 overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-ink-muted">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(
                        allSelected ? [] : items.map((i) => i.i.id)
                      )
                    }
                    className="h-4 w-4 rounded accent-primary"
                  />
                </th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Days Overdue</th>
                <th className="px-4 py-3">Penalty</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-ink-muted">
                    Tidak ada overdue
                  </td>
                </tr>
              ) : null}
              {items.map((row) => {
                const days = daysBetween(new Date(), new Date(row.i.dueDate));
                const checked = selected.includes(row.i.id);
                return (
                  <tr key={row.i.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelected((s) =>
                            checked
                              ? s.filter((x) => x !== row.i.id)
                              : [...s, row.i.id]
                          )
                        }
                        className="h-4 w-4 rounded accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{row.user?.name}</p>
                      <p className="text-xs text-ink-muted">
                        {row.user?.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {formatIDR(row.i.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-danger">
                        {days} hari
                      </span>
                    </td>
                    <td className="px-4 py-3 text-warning font-medium">
                      {formatIDR(row.i.penaltyAmount ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            toast.info("Memanggil…", row.user?.phone ?? "—")
                          }
                          className="h-8 w-8 grid place-items-center rounded-xl border border-border hover:bg-slate-100"
                        >
                          <PhoneCall className="h-4 w-4 text-ink-muted" />
                        </button>
                        <button
                          onClick={async () => {
                            const r = await admin.sendReminder(
                              [row.i.id],
                              "wa"
                            );
                            if (r.ok)
                              toast.success("WA terkirim", row.user?.name);
                            else toast.danger("Gagal", r.error);
                          }}
                          className="h-8 w-8 grid place-items-center rounded-xl border border-border hover:bg-slate-100"
                        >
                          <MessageSquare className="h-4 w-4 text-ink-muted" />
                        </button>
                        <button
                          onClick={async () => {
                            const r = await admin.sendReminder(
                              [row.i.id],
                              "email"
                            );
                            if (r.ok) toast.success("Email terkirim");
                            else toast.danger("Gagal", r.error);
                          }}
                          className="h-8 w-8 grid place-items-center rounded-xl border border-border hover:bg-slate-100"
                        >
                          <Mail className="h-4 w-4 text-ink-muted" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={bulkOpen !== null}
        onClose={() => setBulkOpen(null)}
        title={`Kirim reminder via ${bulkOpen === "wa" ? "WhatsApp" : "Email"}`}
        description={`Akan dikirim ke ${selected.length} user terpilih`}
      >
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input-base h-auto py-3"
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setBulkOpen(null)}>
            Batal
          </Button>
          <Button onClick={sendBulk}>Kirim ke {selected.length} user</Button>
        </div>
      </Modal>
    </div>
  );
}
