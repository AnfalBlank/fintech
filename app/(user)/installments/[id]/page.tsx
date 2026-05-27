"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Circle,
  CreditCard,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { customer } from "@/lib/client";
import { formatIDR, formatDate } from "@/lib/utils";

export default function InstallmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const toast = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    customer.application(params.id).then((res) => {
      setLoading(false);
      if (res.ok) setData(res.data);
    });
  };

  useEffect(refresh, [params.id]);

  if (loading) return <div className="skeleton h-96" />;
  if (!data) {
    return (
      <Card>
        <p className="text-center text-ink-muted">Tidak ditemukan</p>
      </Card>
    );
  }

  const { application, product, installments, deliveries } = data;
  const paid = installments
    .filter((i: any) => i.status === "paid")
    .reduce((s: number, i: any) => s + i.amount, 0);
  const totalAmt = installments.reduce(
    (s: number, i: any) => s + i.amount,
    0
  );
  const progress = totalAmt > 0 ? Math.round((paid / totalAmt) * 100) : 0;
  const nextIns = installments.find((i: any) => i.status !== "paid");
  const completed = installments.length > 0 && progress === 100;
  const delivered = deliveries.find((d: any) => d.status === "delivered");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/installments"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Cicilan Saya
      </Link>

      <Card>
        <div className="flex items-start gap-4">
          <img
            src={product?.imageUrl}
            alt={product?.title}
            className="h-20 w-20 rounded-2xl object-cover bg-slate-100"
          />
          <div className="flex-1 min-w-0">
            <Badge
              tone={completed ? "success" : "primary"}
              className="mb-2"
            >
              {completed ? "Lunas" : "Aktif"}
            </Badge>
            <p className="text-section font-bold text-ink">{product?.title}</p>
            <p className="text-sm text-ink-muted mt-0.5">
              ID: {application.id} · Tenor {application.tenor} bulan
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Progress
            value={progress}
            tone={completed ? "success" : "primary"}
          />
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-ink-muted">
              {formatIDR(paid)} / {formatIDR(totalAmt)}
            </span>
            <span className="font-semibold text-ink">{progress}%</span>
          </div>
        </div>

        {nextIns ? (
          <div className="mt-6 rounded-2xl bg-primary-50 p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-primary font-medium">
                Cicilan Berikutnya (#{nextIns.sequence})
              </p>
              <p className="text-xl font-bold text-ink mt-1">
                {formatIDR(nextIns.amount)}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                Jatuh tempo {formatDate(new Date(nextIns.dueDate))}
              </p>
            </div>
            <Link
              href={`/payments?applicationId=${application.id}&installmentId=${nextIns.id}`}
            >
              <Button>
                <CreditCard className="h-4 w-4" /> Bayar Sekarang
              </Button>
            </Link>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Jadwal Pembayaran</CardTitle>
        <ul className="mt-4 space-y-2.5">
          {installments.map((m: any) => (
            <li
              key={m.id}
              className="flex items-center justify-between p-3 rounded-2xl border border-border"
            >
              <div className="flex items-center gap-3">
                {m.status === "paid" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald" />
                ) : m.status === "overdue" ? (
                  <Circle className="h-5 w-5 text-danger" />
                ) : (
                  <Circle className="h-5 w-5 text-ink-muted" />
                )}
                <div>
                  <p className="font-semibold text-ink">
                    Cicilan ke-{m.sequence}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {m.status === "paid"
                      ? `Dibayar ${formatDate(new Date(m.paidAt))}`
                      : `Jatuh tempo ${formatDate(new Date(m.dueDate))}`}
                    {m.status === "overdue"
                      ? ` · OVERDUE${m.penaltyAmount ? " · penalti " + formatIDR(m.penaltyAmount) : ""}`
                      : ""}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-ink">
                {formatIDR(m.amount)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {delivered ? (
        <Card>
          <CardTitle>Pengiriman</CardTitle>
          <div className="mt-4 flex items-center gap-4 p-4 rounded-2xl bg-emerald/5 border border-emerald/20">
            <div className="h-11 w-11 rounded-2xl bg-emerald/10 grid place-items-center text-emerald">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-ink">Verified Delivered</p>
              <p className="text-sm text-ink-muted">
                Diterima {formatDate(new Date(delivered.completedAt))} · Foto, GPS &
                tanda tangan terverifikasi
              </p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
