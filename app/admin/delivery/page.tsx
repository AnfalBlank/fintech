"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  MapPin,
  PackageCheck,
  Phone,
  Truck,
  UserCircle2,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatDate, cn } from "@/lib/utils";

const filters = ["all", "pending", "assigned", "in_transit", "delivered"] as const;

export default function DeliveryPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [assignTarget, setAssignTarget] = useState<any | null>(null);
  const [chosenCourier, setChosenCourier] = useState<string>("");

  const refresh = async () => {
    setLoading(true);
    const [d, u] = await Promise.all([admin.deliveries(), admin.users()]);
    setLoading(false);
    if (d.ok) setItems(d.data.items);
    if (u.ok) setCouriers(u.data.items.filter((x: any) => x.role === "courier"));
  };

  useEffect(() => {
    refresh();
  }, []);

  const list = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.d.status === filter)),
    [items, filter]
  );

  const assignCourier = async () => {
    if (!assignTarget || !chosenCourier) return;
    const res = await admin.assignDelivery(assignTarget.d.id, chosenCourier);
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success("Kurir di-assign");
    setAssignTarget(null);
    setChosenCourier("");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Delivery Dashboard</h1>
        <p className="text-ink-muted mt-1">
          Tracking kurir, status pengiriman, dan verifikasi proof.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active"
          value={String(items.filter((i) => i.d.status !== "delivered").length)}
          Icon={Truck}
          tone="primary"
        />
        <StatCard
          label="Delivered"
          value={String(items.filter((i) => i.d.status === "delivered").length)}
          Icon={CheckCircle2}
          tone="success"
        />
        <StatCard label="Avg SLA" value="—" Icon={Truck} tone="primary" />
        <StatCard
          label="Verified Proofs"
          value="—"
          Icon={PackageCheck}
          tone="success"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Delivery List</CardTitle>
            <p className="text-sm text-ink-muted mt-0.5">
              {list.length} pengiriman
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-9 px-3 rounded-xl text-xs font-semibold transition",
                  filter === f
                    ? "bg-primary text-white"
                    : "bg-white border border-border text-ink-muted hover:bg-slate-50"
                )}
              >
                {f === "all"
                  ? "Semua"
                  : f.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {loading ? <div className="skeleton h-40 m-6" /> : null}

        <ul className="divide-y divide-border">
          {list.length === 0 && !loading ? (
            <li className="p-8 text-center text-sm text-ink-muted">
              Tidak ada pengiriman
            </li>
          ) : null}
          {list.map((row) => {
            const d = row.d;
            return (
              <li key={d.id} className="p-6">
                <div className="flex items-start gap-4 flex-wrap">
                  <img
                    src={row.product?.imageUrl}
                    alt=""
                    className="h-16 w-16 rounded-2xl object-cover bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 justify-between flex-wrap">
                      <div>
                        <p className="font-mono text-xs text-ink-muted">
                          {d.id}
                        </p>
                        <p className="font-semibold text-ink">
                          {row.product?.title}
                        </p>
                      </div>
                      <Badge
                        tone={
                          d.status === "delivered"
                            ? "success"
                            : d.status === "in_transit"
                              ? "primary"
                              : "muted"
                        }
                      >
                        {d.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-3 grid sm:grid-cols-2 gap-y-1.5 gap-x-6 text-sm text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {d.address}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-primary" />
                        {d.customerName} · {d.customerPhone}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-primary" />
                        Kurir: {row.courier?.name ?? "Belum di-assign"}
                      </span>
                      <span>Schedule: {formatDate(new Date(d.scheduledAt))}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setAssignTarget(row)}
                      >
                        <UserCircle2 className="h-4 w-4" /> Assign Kurir
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Modal
        open={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        title="Assign Courier"
        description={`Pilih kurir untuk ${assignTarget?.d.id ?? ""}`}
      >
        <div className="space-y-2">
          {couriers.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Belum ada kurir terdaftar. Tambah di Users & Roles.
            </p>
          ) : null}
          {couriers.map((c) => (
            <label
              key={c.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer",
                chosenCourier === c.id
                  ? "border-primary bg-primary-50/50"
                  : "border-border hover:bg-slate-50"
              )}
            >
              <input
                type="radio"
                checked={chosenCourier === c.id}
                onChange={() => setChosenCourier(c.id)}
                className="accent-primary"
              />
              <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center">
                <UserCircle2 className="h-5 w-5 text-ink-muted" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink text-sm">{c.name}</p>
                <p className="text-xs text-ink-muted">{c.phone}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setAssignTarget(null)}>
            Batal
          </Button>
          <Button onClick={assignCourier} disabled={!chosenCourier}>
            Assign
          </Button>
        </div>
      </Modal>
    </div>
  );
}
