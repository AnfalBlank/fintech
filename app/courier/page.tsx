"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { courier as courierApi, auth } from "@/lib/client";
import { formatDate } from "@/lib/utils";

export default function CourierHomePage() {
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([courierApi.tasks(), auth.me()]).then(([t, m]) => {
      setLoading(false);
      if (t.ok) setItems(t.data.items);
      if (m.ok) setUser(m.data.user);
    });
  }, []);

  const pending = items.filter((i) => i.d.status !== "delivered");
  const completed = items.filter((i) => i.d.status === "delivered");

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-32" />
        <div className="skeleton h-20" />
        <div className="skeleton h-20" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-primary-700 via-primary to-sky text-white p-5 shadow-float">
          <p className="text-xs opacity-90">
            Halo, {user?.name?.split(" ")[0] ?? "Kurir"}
          </p>
          <p className="text-2xl font-bold mt-1">Belum ada tugas</p>
          <p className="text-sm opacity-80 mt-1">
            Anda akan menerima notifikasi saat ada pengiriman baru.
          </p>
        </Card>
        <Card>
          <p className="text-sm text-ink-muted text-center py-4">
            Tarik ulang halaman ini secara berkala atau pastikan notifikasi
            aktif.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-br from-primary-700 via-primary to-sky text-white p-5 shadow-float">
        <p className="text-xs opacity-90">
          Selamat datang, {user?.name?.split(" ")[0] ?? "Kurir"}
        </p>
        <p className="text-2xl font-bold mt-1">{pending.length} pengiriman</p>
        <p className="text-sm opacity-80">menunggu hari ini</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Mini label="Total" value={String(items.length)} />
          <Mini label="Selesai" value={String(completed.length)} />
          <Mini label="Pending" value={String(pending.length)} />
        </div>
      </Card>

      <div>
        <h2 className="text-cardtitle font-bold text-ink mb-3">Rute Hari Ini</h2>
        <ul className="space-y-3">
          {items.length === 0 ? (
            <li className="text-center text-sm text-ink-muted py-8">
              Belum ada tugas pengiriman.
            </li>
          ) : null}
          {items.map((row, idx) => {
            const t = row.d;
            return (
              <li key={t.id}>
                <Link href={`/courier/delivery/${t.id}`} className="block">
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-2xl bg-primary text-white grid place-items-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-ink text-sm">
                            {t.customerName}
                          </p>
                          <Badge
                            tone={
                              t.status === "delivered"
                                ? "success"
                                : t.status === "in_transit"
                                  ? "primary"
                                  : "muted"
                            }
                          >
                            {t.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-muted line-clamp-2 mt-1">
                          {t.address}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-ink-muted">
                          <span>{t.id}</span>
                          <span>{formatDate(new Date(t.scheduledAt))}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-muted self-center" />
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-2.5">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] opacity-80">{label}</p>
    </div>
  );
}
