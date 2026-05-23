"use client";
import { useMemo, useState } from "react";
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
import { deliveries as initial } from "@/lib/mock-data";
import type { Delivery } from "@/lib/mock-data";
import { formatDate, cn } from "@/lib/utils";

const couriers = [
  "Adi Saputra",
  "Yusuf Hidayat",
  "Reza Maulana",
  "Bayu Pratama",
  "Eko Wirawan",
];

const filters = ["all", "assigned", "in_transit", "delivered", "issue"] as const;

export default function DeliveryPage() {
  const toast = useToast();
  const [items, setItems] = useState<Delivery[]>(initial);
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [proofTarget, setProofTarget] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string>(couriers[0]);

  const list = useMemo(
    () =>
      filter === "all" ? items : items.filter((d) => d.status === filter),
    [items, filter]
  );

  const assignCourier = () => {
    if (!assignTarget) return;
    setItems((s) =>
      s.map((d) =>
        d.id === assignTarget
          ? { ...d, courier: chosen, status: "assigned" }
          : d
      )
    );
    toast.success("Kurir di-assign", `${chosen} ditugaskan untuk ${assignTarget}`);
    setAssignTarget(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Delivery Dashboard</h1>
        <p className="text-ink-muted mt-1">
          Tracking kurir, status pengiriman, dan verifikasi proof of delivery.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Deliveries"
          value={String(items.filter((d) => d.status !== "delivered").length)}
          Icon={Truck}
          tone="primary"
        />
        <StatCard
          label="Delivered Today"
          value={String(items.filter((d) => d.status === "delivered").length)}
          delta="+3"
          trend="up"
          Icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Avg SLA"
          value="18h 42m"
          delta="-1h 12m"
          trend="up"
          Icon={Truck}
          tone="primary"
        />
        <StatCard
          label="Verified Proofs"
          value="100%"
          Icon={PackageCheck}
          tone="success"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle>Delivery List</CardTitle>
            <p className="text-sm text-ink-muted mt-0.5">{list.length} pengiriman</p>
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
                  : f === "in_transit"
                    ? "In Transit"
                    : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <ul className="divide-y divide-border">
          {list.length === 0 ? (
            <li className="p-8 text-center text-sm text-ink-muted">
              Tidak ada pengiriman pada filter ini.
            </li>
          ) : null}
          {list.map((d) => (
            <li key={d.id} className="p-6">
              <div className="flex items-start gap-4 flex-wrap">
                <img
                  src={d.product.image}
                  alt={d.product.title}
                  className="h-16 w-16 rounded-2xl object-cover bg-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 justify-between flex-wrap">
                    <div>
                      <p className="font-mono text-xs text-ink-muted">{d.id}</p>
                      <p className="font-semibold text-ink">
                        {d.product.title}
                      </p>
                    </div>
                    <DeliveryBadge status={d.status} />
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-y-1.5 gap-x-6 text-sm text-ink-muted">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" />
                      {d.user.address}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-primary" />
                      {d.user.name} · {d.user.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-primary" />
                      Kurir: {d.courier}
                    </span>
                    <span>Schedule: {formatDate(d.scheduled)}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    {d.proof ? (
                      <button
                        onClick={() => setProofTarget(d.id)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald/5 border border-emerald/20 px-3 py-2 hover:bg-emerald/10"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald" />
                        <span className="text-sm font-semibold text-ink">
                          Lihat Proof
                        </span>
                        <span className="text-xs text-ink-muted">
                          · {d.proof.photoCount} foto · GPS · TTD
                        </span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-xs text-warning font-semibold">
                        <Camera className="h-3.5 w-3.5" /> Menunggu proof of delivery
                      </span>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setAssignTarget(d.id)}
                    >
                      <UserCircle2 className="h-4 w-4" />
                      Reassign
                    </Button>

                    {d.status !== "delivered" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setItems((s) =>
                            s.map((x) =>
                              x.id === d.id
                                ? {
                                    ...x,
                                    status:
                                      x.status === "assigned"
                                        ? "in_transit"
                                        : "delivered",
                                    proof:
                                      x.status === "in_transit"
                                        ? {
                                            photoCount: 3,
                                            gps: "-6.2,106.8",
                                            signature: true,
                                          }
                                        : x.proof,
                                  }
                                : x
                            )
                          );
                          toast.success(
                            "Status diperbarui",
                            `${d.id} ${
                              d.status === "assigned"
                                ? "→ in transit"
                                : "→ delivered"
                            }`
                          );
                        }}
                      >
                        Update Status
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={assignTarget !== null}
        onClose={() => setAssignTarget(null)}
        title="Assign Courier"
        description={`Pilih kurir untuk pengiriman ${assignTarget ?? ""}`}
      >
        <div className="space-y-2">
          {couriers.map((c) => (
            <label
              key={c}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl border cursor-pointer",
                chosen === c
                  ? "border-primary bg-primary-50/50"
                  : "border-border hover:bg-slate-50"
              )}
            >
              <input
                type="radio"
                checked={chosen === c}
                onChange={() => setChosen(c)}
                className="accent-primary"
              />
              <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center">
                <UserCircle2 className="h-5 w-5 text-ink-muted" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink text-sm">{c}</p>
                <p className="text-xs text-ink-muted">
                  Beban: {Math.floor(Math.random() * 4) + 1} pengiriman aktif
                </p>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setAssignTarget(null)}>
            Batal
          </Button>
          <Button onClick={assignCourier}>Assign</Button>
        </div>
      </Modal>

      <Modal
        open={proofTarget !== null}
        onClose={() => setProofTarget(null)}
        title="Proof of Delivery"
        description={`Bukti pengiriman ${proofTarget ?? ""}`}
        size="lg"
      >
        <div className="grid sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square bg-slate-100 rounded-2xl grid place-items-center"
            >
              <Camera className="h-8 w-8 text-ink-muted" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-ink-muted">GPS</p>
            <p className="font-mono text-ink font-semibold">-6.1781, 106.6298</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-ink-muted">Tanda Tangan</p>
            <p className="font-semibold text-emerald flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Verified
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DeliveryBadge({ status }: { status: string }) {
  const map: Record<string, { tone: any; label: string }> = {
    assigned: { tone: "muted", label: "Assigned" },
    in_transit: { tone: "primary", label: "In Transit" },
    delivered: { tone: "success", label: "Delivered" },
    issue: { tone: "danger", label: "Issue" },
  };
  const m = map[status] ?? { tone: "muted", label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
