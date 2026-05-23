"use client";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  Bell,
  CheckCircle2,
  Mail,
  MessageSquare,
  PhoneCall,
  UserX,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { collections as initial } from "@/lib/mock-data";
import { formatIDR, cn } from "@/lib/utils";

const filters = ["all", "0-30", "30-60", "60-90"] as const;

export default function CollectionPage() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [selected, setSelected] = useState<typeof items>([]);
  const [bulkOpen, setBulkOpen] = useState<"wa" | "email" | null>(null);
  const [message, setMessage] = useState(
    "Halo, ini reminder cicilan Anda yang sudah jatuh tempo. Mohon segera lakukan pembayaran. Terima kasih."
  );
  const [blacklistTarget, setBlacklistTarget] = useState<string | null>(null);

  const list = useMemo(
    () => (filter === "all" ? items : items.filter((c) => c.aging === filter)),
    [items, filter]
  );

  const allSelected =
    list.length > 0 && list.every((l) => selected.find((s) => s.id === l.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((s) => s.filter((x) => !list.find((l) => l.id === x.id)));
    } else {
      setSelected((s) => Array.from(new Set([...s, ...list])));
    }
  };

  const toggleOne = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setSelected((s) =>
      s.find((x) => x.id === id)
        ? s.filter((x) => x.id !== id)
        : [...s, item]
    );
  };

  const sendBulk = () => {
    const channel = bulkOpen === "wa" ? "WhatsApp" : "Email";
    toast.success(
      `${channel} terkirim`,
      `${selected.length} reminder ${channel} berhasil dikirim`
    );
    setItems((s) =>
      s.map((c) =>
        selected.find((x) => x.id === c.id)
          ? { ...c, lastReminder: new Date().toISOString().slice(0, 10) }
          : c
      )
    );
    setSelected([]);
    setBulkOpen(null);
  };

  const blacklist = (id: string) => {
    setItems((s) =>
      s.map((c) => (c.id === id ? { ...c, status: "blacklisted" } : c))
    );
    toast.danger(
      "User di-blacklist",
      `${id} dimasukkan ke blacklist. Tidak dapat ajukan cicilan lagi.`
    );
    setBlacklistTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Collection Dashboard</h1>
        <p className="text-ink-muted mt-1">
          Monitor overdue, kirim reminder, dan eskalasi ke tim collection.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Overdue"
          value={formatIDR(112_000_000)}
          delta="-2.4%"
          trend="down"
          Icon={AlertCircle}
          tone="danger"
        />
        <StatCard
          label="Due Today"
          value={formatIDR(28_500_000)}
          Icon={Bell}
          tone="warning"
        />
        <StatCard
          label="Collection Rate"
          value="94.2%"
          delta="+2.1%"
          trend="up"
          Icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Recovered (MTD)"
          value={formatIDR(78_300_000)}
          delta="+18%"
          trend="up"
          Icon={ArrowDownRight}
          tone="primary"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Overdue List</CardTitle>
            <p className="text-sm text-ink-muted mt-0.5">
              {selected.length > 0
                ? `${selected.length} dipilih`
                : `${list.length} overdue${filter !== "all" ? ` di aging ${filter}` : ""}`}
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

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-8 px-3 rounded-xl text-xs font-semibold transition",
                filter === f
                  ? "bg-primary text-white"
                  : "bg-white border border-border text-ink-muted hover:bg-slate-50"
              )}
            >
              {f === "all" ? "Semua" : `${f} hari`}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-slate-50">
              <tr className="text-left text-ink-muted">
                <th className="px-4 py-3 font-medium rounded-l-xl w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Aging</th>
                <th className="px-4 py-3 font-medium">Days Overdue</th>
                <th className="px-4 py-3 font-medium">Last Reminder</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium rounded-r-xl text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((c) => {
                const checked = !!selected.find((s) => s.id === c.id);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(c.id)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{c.user}</p>
                      <p className="text-xs text-ink-muted">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {formatIDR(c.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          c.aging === "0-30"
                            ? "warning"
                            : c.aging === "30-60"
                              ? "danger"
                              : "danger"
                        }
                      >
                        {c.aging} hari
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-danger">
                        {c.overdueDays} hari
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {c.lastReminder}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          c.status === "in_progress"
                            ? "primary"
                            : c.status === "escalated"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {c.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            toast.info("Memanggil…", `Telp ${c.phone}`)
                          }
                          className="h-8 w-8 grid place-items-center rounded-xl border border-border hover:bg-slate-100"
                          aria-label="Telepon"
                        >
                          <PhoneCall className="h-4 w-4 text-ink-muted" />
                        </button>
                        <button
                          onClick={() =>
                            toast.success(
                              "WA terkirim",
                              `Reminder dikirim ke ${c.user}`
                            )
                          }
                          className="h-8 w-8 grid place-items-center rounded-xl border border-border hover:bg-slate-100"
                          aria-label="WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4 text-ink-muted" />
                        </button>
                        <button
                          onClick={() =>
                            toast.success(
                              "Email terkirim",
                              `Reminder email ke ${c.user}`
                            )
                          }
                          className="h-8 w-8 grid place-items-center rounded-xl border border-border hover:bg-slate-100"
                          aria-label="Email"
                        >
                          <Mail className="h-4 w-4 text-ink-muted" />
                        </button>
                        <button
                          onClick={() => setBlacklistTarget(c.id)}
                          className="h-8 w-8 grid place-items-center rounded-xl border border-border hover:bg-danger/10 text-danger"
                          aria-label="Blacklist"
                        >
                          <UserX className="h-4 w-4" />
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
          placeholder="Tulis pesan reminder…"
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setBulkOpen(null)}>
            Batal
          </Button>
          <Button onClick={sendBulk}>Kirim ke {selected.length} user</Button>
        </div>
      </Modal>

      <Modal
        open={blacklistTarget !== null}
        onClose={() => setBlacklistTarget(null)}
        title="Konfirmasi blacklist user"
        description="User akan dilarang ajukan cicilan baru. Aksi ini dapat dibatalkan oleh Super Admin."
      >
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={() => setBlacklistTarget(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={() => blacklistTarget && blacklist(blacklistTarget)}
          >
            <UserX className="h-4 w-4" /> Blacklist
          </Button>
        </div>
      </Modal>
    </div>
  );
}
