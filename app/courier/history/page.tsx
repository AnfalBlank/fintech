"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { courier } from "@/lib/client";
import { formatDate } from "@/lib/utils";

export default function CourierHistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courier.history().then((res) => {
      setLoading(false);
      if (res.ok) setItems(res.data.items);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-16" />
        <div className="skeleton h-16" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-section font-bold text-ink">Riwayat Pengiriman</h1>
        <p className="text-sm text-ink-muted mt-1">
          {items.length} pengiriman selesai
        </p>
      </div>
      {items.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-ink-muted py-8">
            Belum ada pengiriman selesai.
          </p>
        </Card>
      ) : null}
      <ul className="space-y-3">
        {items.map((row) => (
          <li key={row.d.id}>
            <Link href={`/courier/delivery/${row.d.id}`}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald/10 text-emerald grid place-items-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink text-sm">
                        {row.d.customerName}
                      </p>
                      <Badge tone="success">Selesai</Badge>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {row.product?.title}
                    </p>
                    <p className="text-xs text-ink-muted mt-1">
                      {row.d.id} ·{" "}
                      {row.d.completedAt
                        ? formatDate(new Date(row.d.completedAt))
                        : "—"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
