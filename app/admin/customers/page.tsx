"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShieldCheck, Sparkles, Users as UsersIcon } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatIDR, cn } from "@/lib/utils";

const trustOpts = ["", "1", "2", "3"];
const statusOpts = ["", "active", "suspended", "blacklisted"];

export default function CustomersPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [trust, setTrust] = useState("");
  const [status, setStatus] = useState("");

  const refresh = async () => {
    setLoading(true);
    const res = await admin.customers(q || undefined, status || undefined, trust || undefined);
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal memuat", res.error);
    setItems(res.data.items);
  };

  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [q, trust, status]);

  const total = items.length;
  const totalOutstanding = items.reduce((s, i) => s + Number(i.outstanding ?? 0), 0);
  const blacklisted = items.filter((i) => i.user.status === "blacklisted").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Customers</h1>
        <p className="text-ink-muted mt-1">
          Cari pelanggan, lihat profil + history pinjaman, edit limit/trust manual.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total Customers" value={String(total)} Icon={UsersIcon} tone="primary" />
        <StatCard label="Total Outstanding" value={formatIDR(totalOutstanding)} Icon={Sparkles} tone="primary" />
        <StatCard label="Blacklisted" value={String(blacklisted)} Icon={ShieldCheck} tone="danger" />
      </div>

      <Card>
        <div className="grid md:grid-cols-[1fr_180px_180px] gap-3">
          <div>
            <Label>Cari</Label>
            <div className="relative">
              <Search className="h-5 w-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nama, email, HP, KTP…"
                className="pl-11"
              />
            </div>
          </div>
          <div>
            <Label>Trust Level</Label>
            <select
              value={trust}
              onChange={(e) => setTrust(e.target.value)}
              className="input-base appearance-none"
            >
              {trustOpts.map((v) => (
                <option key={v} value={v}>
                  {v ? `Level ${v}` : "Semua"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-base appearance-none"
            >
              {statusOpts.map((v) => (
                <option key={v} value={v}>
                  {v || "Semua"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <CardTitle>{loading ? "Loading…" : `${items.length} customer`}</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-ink-muted">
              <tr>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Trust / Limit</th>
                <th className="px-6 py-3 font-medium">Apps</th>
                <th className="px-6 py-3 font-medium">Outstanding</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-ink-muted">
                    Tidak ada customer
                  </td>
                </tr>
              ) : null}
              {items.map((row) => {
                const u = row.user;
                const overdueDays = Number(row.overdueDays ?? 0);
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary text-white grid place-items-center text-xs font-bold">
                          {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{u.name}</p>
                          <p className="text-xs text-ink-muted">{u.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge tone="primary">L{u.trustLevel}</Badge>
                      <p className="text-xs text-ink-muted mt-1">
                        {formatIDR(u.limit)}
                      </p>
                    </td>
                    <td className="px-6 py-3 font-semibold">
                      {Number(row.apps ?? 0)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-semibold text-ink">
                        {formatIDR(Number(row.outstanding ?? 0))}
                      </span>
                      {overdueDays > 0 ? (
                        <p className="text-xs text-danger font-semibold mt-0.5">
                          Overdue {overdueDays} hari
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-3">
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
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/admin/customers/${u.id}`}>
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
    </div>
  );
}
