import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const completed = [
  {
    id: "DLV-988",
    customer: "Kurnia Pratiwi",
    product: "MacBook Air M2",
    date: "21 Mei 2026",
  },
  {
    id: "DLV-986",
    customer: "Yusuf Hidayat",
    product: "iPhone 14",
    date: "20 Mei 2026",
  },
  {
    id: "DLV-984",
    customer: "Mira Astari",
    product: "AC Sharp 1 PK",
    date: "19 Mei 2026",
  },
];

export default function CourierHistoryPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-section font-bold text-ink">Riwayat Pengiriman</h1>
        <p className="text-sm text-ink-muted mt-1">
          {completed.length} pengiriman selesai 30 hari terakhir
        </p>
      </div>
      <ul className="space-y-3">
        {completed.map((c) => (
          <li key={c.id}>
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald/10 text-emerald grid place-items-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-ink text-sm">
                      {c.customer}
                    </p>
                    <Badge tone="success">Selesai</Badge>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">{c.product}</p>
                  <p className="text-xs text-ink-muted mt-1">
                    {c.id} · {c.date}
                  </p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
