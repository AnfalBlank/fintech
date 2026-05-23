import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Circle,
  CreditCard,
  PackageCheck,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatIDR, formatDate } from "@/lib/utils";
import { myInstallments } from "@/lib/mock-data";

export default function InstallmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ins = myInstallments.find((i) => i.id === params.id);
  if (!ins) return notFound();

  const progress = Math.round((ins.paid / ins.total) * 100);
  const months = Array.from({ length: ins.tenor }, (_, i) => i + 1);

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
            src={ins.product.image}
            alt={ins.product.title}
            className="h-20 w-20 rounded-2xl object-cover bg-slate-100"
          />
          <div className="flex-1 min-w-0">
            <Badge
              tone={ins.status === "completed" ? "success" : "primary"}
              className="mb-2"
            >
              {ins.status === "completed" ? "Lunas" : "Aktif"}
            </Badge>
            <p className="text-section font-bold text-ink">
              {ins.product.title}
            </p>
            <p className="text-sm text-ink-muted mt-0.5">
              ID: {ins.id} · Tenor {ins.tenor} bulan
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Progress
            value={progress}
            tone={ins.status === "completed" ? "success" : "primary"}
          />
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-ink-muted">
              {formatIDR(ins.paid)} / {formatIDR(ins.total)}
            </span>
            <span className="font-semibold text-ink">{progress}%</span>
          </div>
        </div>

        {ins.status !== "completed" ? (
          <div className="mt-6 rounded-2xl bg-primary-50 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-primary font-medium">
                Cicilan Berikutnya
              </p>
              <p className="text-xl font-bold text-ink mt-1">
                {formatIDR(ins.monthly)}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                Jatuh tempo {formatDate(ins.nextDueDate)}
              </p>
            </div>
            <Link href="/payments">
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
          {months.map((m) => {
            const paid = m <= ins.paidMonths;
            return (
              <li
                key={m}
                className="flex items-center justify-between p-3 rounded-2xl border border-border"
              >
                <div className="flex items-center gap-3">
                  {paid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald" />
                  ) : (
                    <Circle className="h-5 w-5 text-ink-muted" />
                  )}
                  <div>
                    <p className="font-semibold text-ink">Cicilan ke-{m}</p>
                    <p className="text-xs text-ink-muted">
                      {paid ? "Sudah dibayar" : "Belum jatuh tempo"}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-ink">
                  {formatIDR(ins.monthly)}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardTitle>Pengiriman</CardTitle>
        <div className="mt-4 flex items-center gap-4 p-4 rounded-2xl bg-emerald/5 border border-emerald/20">
          <div className="h-11 w-11 rounded-2xl bg-emerald/10 grid place-items-center text-emerald">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-ink">Verified Delivered</p>
            <p className="text-sm text-ink-muted">
              Diterima 8 Mar 2026 · Foto, GPS & tanda tangan terverifikasi
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
