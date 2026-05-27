"use client";
import { useEffect, useState } from "react";
import { Mail, Megaphone, MessageSquare, Send } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatDate, cn } from "@/lib/utils";

const channels = [
  { id: "wa" as const, label: "WhatsApp", Icon: MessageSquare },
  { id: "email" as const, label: "Email", Icon: Mail },
  { id: "push" as const, label: "Push", Icon: Megaphone },
];

const segments = [
  { id: "all", label: "Semua Customer" },
  { id: "trust_1", label: "Trust Level 1" },
  { id: "trust_2", label: "Trust Level 2" },
  { id: "trust_3", label: "Trust Level 3" },
  { id: "active", label: "Cicilan Aktif" },
  { id: "overdue", label: "Overdue" },
  { id: "inactive", label: "Inactive (no app)" },
];

export default function BroadcastsPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({
    channel: "wa" as "wa" | "email" | "push",
    segment: "all",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const res = await admin.broadcasts();
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    setItems(res.data.items);
  };
  useEffect(() => {
    refresh();
  }, []);

  const send = async () => {
    if (form.message.length < 5) return toast.warning("Pesan minimal 5 karakter");
    setSending(true);
    const res = await admin.sendBroadcast(form);
    setSending(false);
    if (!res.ok) return toast.danger("Gagal kirim", res.error);
    toast.success(
      "Broadcast terkirim",
      `${res.data.recipientCount} penerima`
    );
    setComposeOpen(false);
    setForm({ ...form, subject: "", message: "" });
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-page font-bold text-ink">Broadcasts</h1>
          <p className="text-ink-muted mt-1">
            Kirim notifikasi massal ke segmen customer via WA, email, atau push.
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <Send className="h-4 w-4" /> Kirim Broadcast
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6">
          <CardTitle>Recent Broadcasts</CardTitle>
        </div>
        <ul className="divide-y divide-border">
          {items.length === 0 && !loading ? (
            <li className="p-8 text-center text-ink-muted">
              Belum ada broadcast.
            </li>
          ) : null}
          {items.map((row) => (
            <li key={row.b.id} className="p-5 flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-primary-50 text-primary grid place-items-center">
                {row.b.channel === "wa" ? (
                  <MessageSquare className="h-5 w-5" />
                ) : row.b.channel === "email" ? (
                  <Mail className="h-5 w-5" />
                ) : (
                  <Megaphone className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-semibold text-ink">
                    {row.b.subject ?? "(no subject)"}
                  </p>
                  <Badge tone="muted">{row.b.segment}</Badge>
                </div>
                <p className="text-sm text-ink-muted line-clamp-2 mt-1">
                  {row.b.message}
                </p>
                <p className="text-xs text-ink-muted mt-2">
                  {row.b.recipientCount} penerima ·{" "}
                  {row.sender?.name ?? "system"} ·{" "}
                  {formatDate(new Date(row.b.createdAt))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Kirim Broadcast"
        description="Notifikasi akan tampil di feed user + (opsional) WA/email."
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label>Channel</Label>
            <div className="grid grid-cols-3 gap-2">
              {channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setForm({ ...form, channel: c.id })}
                  className={cn(
                    "h-12 rounded-2xl border flex items-center justify-center gap-2 text-sm font-semibold",
                    form.channel === c.id
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-border text-ink-muted hover:bg-slate-50"
                  )}
                >
                  <c.Icon className="h-4 w-4" /> {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Segment</Label>
            <select
              value={form.segment}
              onChange={(e) => setForm({ ...form, segment: e.target.value })}
              className="input-base appearance-none"
            >
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {form.channel === "email" ? (
            <div>
              <Label>Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
          ) : null}
          <div>
            <Label>Pesan</Label>
            <textarea
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="input-base h-auto py-3"
              placeholder="Tulis pesan broadcast…"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setComposeOpen(false)}>
            Batal
          </Button>
          <Button onClick={send} disabled={sending}>
            <Send className="h-4 w-4" />
            {sending ? "Mengirim…" : "Kirim"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
