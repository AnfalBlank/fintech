"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatIDR, formatDate } from "@/lib/utils";
import { Empty } from "@/components/ui/empty";
import { customer } from "@/lib/client";

type Item = {
  ins: any;
  app: any;
  product: any;
};

export default function InstallmentsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customer.installments().then((res) => {
      setLoading(false);
      if (res.ok) setItems(res.data.items);
    });
  }, []);

  // Group by application
  const byApp = items.reduce<Record<string, Item[]>>((acc, it) => {
    const id = it.app?.id ?? "—";
    (acc[id] ??= []).push(it);
    return acc;
  }, {});

  const apps = Object.values(byApp).map((group) => {
    const sorted = group.sort((a, b) => a.ins.sequence - b.ins.sequence);
    const paid = sorted.filter((g) => g.ins.status === "paid").length;
    const total = sorted.length;
    const overdue = sorted.some((g) => g.ins.status === "overdue");
    const completed = paid === total && total > 0;
    return {
      app: group[0].app,
      product: group[0].product,
      paidMonths: paid,
      tenor: total,
      paid: sorted
        .filter((g) => g.ins.status === "paid")
        .reduce((s, g) => s + g.ins.amount, 0),
      total: sorted.reduce((s, g) => s + g.ins.amount, 0),
      monthly: sorted[0].ins.amount,
      nextDue: sorted.find((g) => g.ins.status !== "paid")?.ins.dueDate,
      status: completed ? "completed" : overdue ? "overdue" : "active",
    };
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="skeleton h-40" />
          <div className="skeleton h-40" />
        </div>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <Card>
        <Empty
          Icon={Receipt}
          title="Belum ada cicilan"
          description="Mulai pengajuan pertama Anda hari ini."
          action={
            <Link href="/apply" className="btn-primary">
              Ajukan Cicilan
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Cicilan Saya</h1>
        <p className="text-ink-muted mt-1.5">
          Pantau progress dan riwayat pembayaran cicilan Anda.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {apps.map((row) => {
          const progress =
            row.total > 0 ? Math.round((row.paid / row.total) * 100) : 0;
          return (
            <Link
              key={row.app.id}
              href={`/installments/${row.app.id}`}
              className="block group"
            >
              <Card className="p-5 hover:shadow-float transition-shadow">
                <div className="flex gap-4">
                  <img
                    src={row.product?.imageUrl}
                    alt={row.product?.title}
                    className="h-16 w-16 rounded-2xl object-cover bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink truncate">
                        {row.product?.title}
                      </p>
                      <Badge
                        tone={
                          row.status === "completed"
                            ? "success"
                            : row.status === "overdue"
                              ? "danger"
                              : "primary"
                        }
                      >
                        {row.status === "completed"
                          ? "Lunas"
                          : row.status === "overdue"
                            ? "Overdue"
                            : "Aktif"}
                      </Badge>
                    </div>
                    <p className="text-sm text-ink-muted mt-0.5">
                      {row.paidMonths} dari {row.tenor} cicilan
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Progress
                    value={progress}
                    tone={row.status === "completed" ? "success" : "primary"}
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-ink-muted">
                      {formatIDR(row.paid)} / {formatIDR(row.total)}
                    </span>
                    <span className="font-semibold text-ink">{progress}%</span>
                  </div>
                </div>

                {row.status !== "completed" && row.nextDue ? (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-ink-muted">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      Jatuh tempo {formatDate(new Date(row.nextDue))}
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {formatIDR(row.monthly)}
                    </span>
                  </div>
                ) : null}

                <div className="mt-4 flex items-center justify-end text-sm text-primary font-semibold group-hover:gap-2 transition-all">
                  Detail <ChevronRight className="h-4 w-4" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
