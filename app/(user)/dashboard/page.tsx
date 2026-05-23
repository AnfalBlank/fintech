import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  PackageCheck,
  Plus,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatIDR, formatDate } from "@/lib/utils";
import { myInstallments } from "@/lib/mock-data";

export default function DashboardPage() {
  const active = myInstallments.find((i) => i.status === "active")!;
  const totalActive = myInstallments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + (i.total - i.paid), 0);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-muted">Selamat datang kembali,</p>
          <h1 className="text-section font-bold text-ink">Rafi Aditya 👋</h1>
        </div>
        <Badge tone="primary">
          <Sparkles className="h-3.5 w-3.5" /> Trust Level 2
        </Badge>
      </div>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-primary-700 via-primary to-sky text-white shadow-float p-7">
        <div
          aria-hidden
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl"
        />
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-90">Total Sisa Cicilan Aktif</p>
          <span className="chip bg-white/15 text-white">2 cicilan</span>
        </div>
        <p className="mt-2 text-[40px] font-bold tracking-tight">
          {formatIDR(totalActive)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <div className="flex items-center gap-2 text-sm opacity-90">
              <CalendarClock className="h-4 w-4" /> Jatuh Tempo
            </div>
            <p className="mt-1 font-semibold">{formatDate(active.nextDueDate)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <div className="flex items-center gap-2 text-sm opacity-90">
              <CreditCard className="h-4 w-4" /> Nominal Bulan Ini
            </div>
            <p className="mt-1 font-semibold">{formatIDR(active.monthly)}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/payments">
            <Button variant="secondary">
              Bayar Sekarang <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/installments">
            <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white">
              Lihat detail <ArrowUpRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Quick apply */}
      <Card className="bg-gradient-to-br from-white to-primary-50 border-primary-100">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary text-white grid place-items-center">
            <Plus className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <CardTitle>Pengajuan Cicilan Baru</CardTitle>
            <p className="text-sm text-ink-muted mt-1">
              Paste link produk dari Tokopedia, Shopee, atau Lazada — kami akan
              hitungkan simulasi cicilannya.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/apply">
                <Button>
                  Mulai Pengajuan <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/installments">
                <Button variant="secondary">Lihat Cicilan Saya</Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Active installments */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-section font-bold text-ink">Cicilan Aktif</h2>
          <Link
            href="/installments"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {myInstallments.map((ins) => {
            const progress = Math.round((ins.paid / ins.total) * 100);
            return (
              <Card key={ins.id} className="p-5">
                <div className="flex gap-4">
                  <img
                    src={ins.product.image}
                    alt={ins.product.title}
                    className="h-16 w-16 rounded-2xl object-cover bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {ins.product.title}
                    </p>
                    <p className="text-sm text-ink-muted mt-0.5">
                      {ins.paidMonths} dari {ins.tenor} cicilan terbayar
                    </p>
                  </div>
                  <Badge
                    tone={ins.status === "completed" ? "success" : "primary"}
                  >
                    {ins.status === "completed" ? "Lunas" : "Aktif"}
                  </Badge>
                </div>
                <div className="mt-4">
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
              </Card>
            );
          })}
        </div>
      </section>

      {/* Reminders */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-emerald/10 text-emerald grid place-items-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-ink">
              Riwayat pembayaran Anda sangat baik 🎉
            </p>
            <p className="text-sm text-ink-muted mt-1">
              Pertahankan track record ini untuk naik ke{" "}
              <span className="font-semibold text-primary">Trust Level 3</span>.
              Limit hingga Rp 10 juta dan margin lebih rendah menanti Anda.
            </p>
          </div>
        </div>
      </Card>

      {/* Recent transactions */}
      <section>
        <h2 className="text-section font-bold text-ink mb-3">
          Transaksi Terbaru
        </h2>
        <Card className="p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {[
              {
                title: "Pembayaran cicilan ke-2",
                meta: "MacBook Air M2 — 12 Mei 2026",
                amount: "+ " + formatIDR(2750000),
                tone: "success",
                Icon: CreditCard,
              },
              {
                title: "Verified Delivery",
                meta: "MacBook Air M2 — 8 Mar 2026",
                amount: "Verified",
                tone: "primary",
                Icon: PackageCheck,
              },
              {
                title: "Pembayaran cicilan ke-1",
                meta: "MacBook Air M2 — 12 Apr 2026",
                amount: "+ " + formatIDR(2750000),
                tone: "success",
                Icon: CreditCard,
              },
            ].map((t, i) => (
              <li key={i} className="flex items-center gap-4 p-5">
                <div
                  className={
                    t.tone === "success"
                      ? "h-10 w-10 rounded-2xl bg-emerald/10 text-emerald grid place-items-center"
                      : "h-10 w-10 rounded-2xl bg-primary-50 text-primary grid place-items-center"
                  }
                >
                  <t.Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{t.title}</p>
                  <p className="text-xs text-ink-muted">{t.meta}</p>
                </div>
                <span
                  className={
                    t.tone === "success"
                      ? "text-sm font-semibold text-emerald"
                      : "text-sm font-semibold text-primary"
                  }
                >
                  {t.amount}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
