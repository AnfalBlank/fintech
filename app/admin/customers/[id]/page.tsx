"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  MapPin,
  Phone,
  Receipt,
  ShieldOff,
  Smartphone,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatIDR, formatDate, cn } from "@/lib/utils";

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const toast = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [blkOpen, setBlkOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [form, setForm] = useState({
    trustLevel: 1 as 1 | 2 | 3,
    limit: 0,
  });

  const refresh = async () => {
    setLoading(true);
    const res = await admin.customer(params.id);
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    setData(res.data);
    setForm({
      trustLevel: res.data.user.trustLevel,
      limit: res.data.user.limit,
    });
  };
  useEffect(() => {
    refresh();
  }, [params.id]);

  if (loading) return <div className="skeleton h-96" />;
  if (!data) return <Card><p className="text-center text-ink-muted">Tidak ditemukan</p></Card>;

  const u = data.user;
  const apps = data.applications ?? [];
  const installments = data.installments ?? [];
  const payments = data.payments ?? [];
  const devices = data.devices ?? [];
  const fraud = data.fraud ?? [];
  const blacklist = data.blacklist ?? [];

  const saveLimit = async () => {
    const res = await admin.patchCustomer(u.id, {
      trustLevel: form.trustLevel,
      limit: form.limit,
    });
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success("Customer diperbarui");
    setEditOpen(false);
    refresh();
  };

  const blacklistUser = async () => {
    if (reason.length < 5) return toast.warning("Reason minimal 5 karakter");
    const res = await admin.patchCustomer(u.id, {
      status: "blacklisted",
      reason,
    });
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.danger("Customer di-blacklist");
    setBlkOpen(false);
    setReason("");
    refresh();
  };

  return (
    <div className="space-y-5">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Customers
      </Link>

      {/* Identity card */}
      <Card>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-16 w-16 rounded-3xl bg-primary text-white grid place-items-center text-2xl font-bold">
            {u.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-section font-bold text-ink">{u.name}</p>
            <p className="text-sm text-ink-muted">{u.email} · {u.phone}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="primary">
                <Sparkles className="h-3 w-3" /> Trust L{u.trustLevel}
              </Badge>
              <Badge
                tone={
                  u.status === "active"
                    ? "success"
                    : u.status === "suspended"
                      ? "warning"
                      : "danger"
                }
              >
                {u.status}
              </Badge>
              {u.emailVerified ? <Badge tone="success">Email Verified</Badge> : null}
              {u.phoneVerified ? <Badge tone="success">Phone Verified</Badge> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <UserCheck className="h-4 w-4" /> Edit Limit/Trust
            </Button>
            {u.status !== "blacklisted" ? (
              <Button variant="danger" onClick={() => setBlkOpen(true)}>
                <ShieldOff className="h-4 w-4" /> Blacklist
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Mini Icon={CreditCard} label="Limit" value={formatIDR(u.limit)} />
          <Mini Icon={Receipt} label="Applications" value={String(apps.length)} />
          <Mini
            Icon={Building2}
            label="Pekerjaan"
            value={u.occupation ?? "—"}
          />
          <Mini Icon={MapPin} label="Kota" value={u.city ?? "—"} />
        </div>
      </Card>

      {/* Applications */}
      <Card>
        <CardTitle>Applications ({apps.length})</CardTitle>
        {apps.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Belum ada pengajuan.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {apps.map((row: any) => (
              <li key={row.app.id}>
                <Link
                  href={`/admin/applications/${row.app.id}`}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {row.product?.imageUrl ? (
                      <img
                        src={row.product.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-xl object-cover bg-slate-100"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-ink-muted">
                        {row.app.id}
                      </p>
                      <p className="text-sm font-semibold text-ink truncate">
                        {row.product?.title}
                      </p>
                      <p className="text-xs text-ink-muted">
                        Tenor {row.app.tenor} bln · {formatIDR(row.app.total)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    tone={
                      row.app.status === "completed"
                        ? "success"
                        : row.app.status === "active"
                          ? "primary"
                          : row.app.status === "rejected"
                            ? "danger"
                            : "warning"
                    }
                  >
                    {row.app.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Payments + Devices */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle>Recent Payments</CardTitle>
          <ul className="mt-3 divide-y divide-border text-sm">
            {payments.slice(0, 8).map((p: any) => (
              <li key={p.id} className="flex justify-between py-2">
                <div>
                  <p className="font-semibold text-ink">{p.type.toUpperCase()}</p>
                  <p className="text-xs text-ink-muted">
                    {p.method} · {formatDate(new Date(p.createdAt))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatIDR(p.amount)}</p>
                  <Badge
                    tone={p.status === "paid" ? "success" : "warning"}
                  >
                    {p.status}
                  </Badge>
                </div>
              </li>
            ))}
            {payments.length === 0 ? (
              <li className="text-sm text-ink-muted py-3">
                Belum ada pembayaran
              </li>
            ) : null}
          </ul>
        </Card>

        <Card>
          <CardTitle>Devices ({devices.length})</CardTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {devices.map((d: any) => (
              <li
                key={d.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border"
              >
                <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center">
                  <Smartphone className="h-4 w-4 text-ink-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">
                    {d.name ?? "Unknown device"}
                  </p>
                  <p className="text-xs font-mono text-ink-muted truncate">
                    {d.fingerprint?.slice(0, 16)}…
                  </p>
                </div>
                <p className="text-xs text-ink-muted">
                  Trust {d.trustScore}
                </p>
              </li>
            ))}
            {devices.length === 0 ? (
              <li className="text-ink-muted">Belum ada device tercatat</li>
            ) : null}
          </ul>
        </Card>
      </div>

      {/* Fraud + Blacklist */}
      {(fraud.length > 0 || blacklist.length > 0) ? (
        <Card>
          <CardTitle>Risk Flags</CardTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {fraud.map((f: any) => (
              <li
                key={f.id}
                className="flex justify-between p-3 rounded-xl bg-danger/5 border border-danger/20"
              >
                <span>{f.reason}</span>
                <Badge tone={f.severity === "high" ? "danger" : "warning"}>
                  {f.severity}
                </Badge>
              </li>
            ))}
            {blacklist.map((b: any) => (
              <li
                key={b.id}
                className="flex justify-between p-3 rounded-xl bg-danger/10 border border-danger/30"
              >
                <span>Blacklisted: {b.reason}</span>
                <span className="text-xs text-ink-muted">
                  {formatDate(new Date(b.createdAt))}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Trust & Limit"
        description="Override manual untuk customer ini."
      >
        <div className="space-y-3">
          <div>
            <Label>Trust Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((l) => (
                <button
                  key={l}
                  onClick={() =>
                    setForm({ ...form, trustLevel: l as 1 | 2 | 3 })
                  }
                  className={cn(
                    "h-11 rounded-2xl border text-sm font-semibold",
                    form.trustLevel === l
                      ? "border-primary bg-primary-50 text-primary"
                      : "border-border text-ink-muted hover:bg-slate-50"
                  )}
                >
                  Level {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Limit (Rp)</Label>
            <Input
              type="number"
              value={form.limit}
              onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setEditOpen(false)}>
            Batal
          </Button>
          <Button onClick={saveLimit}>Simpan</Button>
        </div>
      </Modal>

      <Modal
        open={blkOpen}
        onClose={() => setBlkOpen(false)}
        title="Blacklist Customer"
        description="Customer tidak dapat membuat aplikasi baru."
      >
        <div>
          <Label>Alasan</Label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input-base h-auto py-3"
            placeholder="Alasan blacklist…"
          />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setBlkOpen(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={blacklistUser}>
            Blacklist
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Mini({
  Icon,
  label,
  value,
}: {
  Icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-ink-muted" />
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="font-semibold text-ink text-sm">{value}</p>
      </div>
    </div>
  );
}
