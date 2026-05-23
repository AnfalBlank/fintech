"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Camera,
  ChevronRight,
  MapPin,
  Navigation,
  Phone,
  QrCode,
  Truck,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { courierTasks as initial, type CourierTask } from "@/lib/mock-data-extra";
import { formatDate } from "@/lib/utils";

export default function CourierHomePage() {
  const [tasks] = useState<CourierTask[]>(initial);

  const pending = tasks.filter((t) => t.status !== "completed");
  const completed = tasks.filter((t) => t.status === "completed");

  return (
    <div className="space-y-5">
      {/* Hero */}
      <Card className="bg-gradient-to-br from-primary-700 via-primary to-sky text-white p-5 shadow-float">
        <p className="text-xs opacity-90">Selamat pagi, Adi</p>
        <p className="text-2xl font-bold mt-1">{pending.length} pengiriman</p>
        <p className="text-sm opacity-80">menunggu penyelesaian hari ini</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Mini label="Total" value={String(tasks.length)} />
          <Mini label="Selesai" value={String(completed.length)} />
          <Mini label="Pending" value={String(pending.length)} />
        </div>
      </Card>

      {/* Route list */}
      <div>
        <h2 className="text-cardtitle font-bold text-ink mb-3">
          Rute Hari Ini
        </h2>
        <ul className="space-y-3">
          {tasks.map((t, idx) => (
            <li key={t.id}>
              <Link
                href={`/courier/delivery/${t.id}`}
                className="block group"
              >
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-primary text-white grid place-items-center text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-ink text-sm">
                          {t.customer}
                        </p>
                        <CourierStatusBadge status={t.status} />
                      </div>
                      <p className="text-xs text-ink-muted line-clamp-2 mt-1">
                        {t.address}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-ink-muted">
                        <span>{t.id}</span>
                        <span>{formatDate(t.scheduled)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-muted self-center" />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
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

function CourierStatusBadge({ status }: { status: CourierTask["status"] }) {
  const map = {
    pending: { tone: "muted" as const, label: "Pending" },
    picked_up: { tone: "info" as const, label: "Picked Up" },
    in_transit: { tone: "primary" as const, label: "In Transit" },
    completed: { tone: "success" as const, label: "Selesai" },
  };
  const m = map[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
