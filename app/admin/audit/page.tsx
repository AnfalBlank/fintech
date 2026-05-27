"use client";
import { useEffect, useState } from "react";
import { History, Search } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatDate, cn } from "@/lib/utils";

const ACTIONS = [
  "",
  "user.login",
  "user.register",
  "application",
  "payment",
  "qc",
  "delivery",
  "fraud",
  "broadcast",
  "settings",
  "customer",
  "refund",
];

export default function AuditPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");

  const refresh = async () => {
    setLoading(true);
    const res = await admin.audit(q || undefined, action || undefined);
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    setItems(res.data.items);
  };

  useEffect(() => {
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
  }, [q, action]);

  const exportCsv = () => {
    const rows = items
      .map((row) => {
        const l = row.log;
        const actor = row.actor?.name ?? l.actorId ?? "system";
        const meta = l.metadata?.replace(/[\r\n]+/g, " ") ?? "";
        return `"${l.id}","${l.createdAt}","${actor}","${l.action}","${l.entity ?? ""}","${l.entityId ?? ""}","${meta}","${l.ipAddress ?? ""}"`;
      })
      .join("\n");
    const blob = new Blob(
      [`id,createdAt,actor,action,entity,entityId,metadata,ip\n${rows}`],
      { type: "text/csv" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Audit log diunduh");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Audit Log</h1>
        <p className="text-ink-muted mt-1">
          Trail lengkap aksi sensitif untuk compliance & forensic.
        </p>
      </div>

      <Card>
        <div className="grid md:grid-cols-[1fr_240px_auto] gap-3">
          <div>
            <Label>Cari</Label>
            <div className="relative">
              <Search className="h-5 w-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Action, entity ID, actor name…"
                className="pl-11"
              />
            </div>
          </div>
          <div>
            <Label>Action</Label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="input-base appearance-none"
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a || "Semua"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={exportCsv} block>
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <CardTitle>{loading ? "Loading…" : `${items.length} entries`}</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-ink-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Actor</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Entity</th>
                <th className="px-6 py-3 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-muted">
                    Belum ada log
                  </td>
                </tr>
              ) : null}
              {items.map((row) => {
                const l = row.log;
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-xs text-ink-muted">
                      {formatDate(new Date(l.createdAt))}
                      <br />
                      {new Date(l.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-ink text-sm">
                        {row.actor?.name ?? "system"}
                      </p>
                      {row.actor?.role ? (
                        <Badge tone="muted">{row.actor.role}</Badge>
                      ) : null}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs">{l.action}</td>
                    <td className="px-6 py-3 text-xs text-ink-muted">
                      {l.entity}
                      <br />
                      <span className="font-mono">{l.entityId ?? "—"}</span>
                    </td>
                    <td className="px-6 py-3 text-xs text-ink-muted max-w-[300px] truncate">
                      {l.metadata ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
