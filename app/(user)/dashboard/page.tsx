"use client";
import { useEffect, useState } from "react";
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
import { customer, auth } from "@/lib/client";
import { formatIDR, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [user, setUser] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      auth.me(),
      customer.installments(),
      customer.notifications(),
    ]).then(([me, ins, n]) => {
      setLoading(false);
      if (me.ok) setUser(me.data.user);
      if (ins.ok) setItems(ins.data.items);
      if (n.ok) setNotifs(n.data.items);
    });
  }, []);

  // Group installments by application
  const byApp = items.reduce<Record<string, any>>((acc, it) => {
    const id = it.app?.id;
    if (!id) return acc;
    if (!acc[id])
      acc[id] = {
        app: it.app,
        product: it.product,
        installments: [],
      };
    acc[id].installments.push(it.ins);
    return acc;
  }, {});
  const apps = Object.values(byApp).map((g: any) => {
    const sorted = g.installments.sort(
      (a: any, b: any) => a.sequence - b.sequence
    );
    const paid = sorted.filter((i: any) => i.status === "paid").length;
    return {
      ...g,
      paidMonths: paid,
      tenor: sorted.length,
      paid: sorted
        .filter((i: any) => i.status === "paid")
        .reduce((s: number, i: any) => s + i.amount, 0),
      total: sorted.reduce((s: number, i: any) => s + i.amount, 0),
      monthly: sorted[0]?.amount,
      nextDue: sorted.find((i: any) => i.status !== "paid")?.dueDate,
      status: paid === sorted.length ? "completed" : "active",
    };
  });

  const active = apps.find((a) => a.status === "active");
  const totalActive = apps
    .filter((a) => a.status === "active")
    .reduce((s, a) => s + (a.total - a.paid), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32" />
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-muted">Selamat datang kembali,</p>
          <h1 className="text-section font-bold text-ink">
            {user?.name ?? "Customer"} 👋
          </h1>
        </div>
        <Badge tone="primary">
          <Sparkles className="h-3.5 w-3.5" /> Trust Level{" "}
          {user?.trustLevel ?? 1}
        </Badge>
      </div>

      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-primary-700 via-primary to-sky text-white shadow-float p-7">
        <div
          aria-hidden
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl"
        />
        {apps.length === 0 ? (
          <>
            <p className="text-sm opacity-90">Mulai pengajuan pertama Anda</p>
            <p className="mt-2 text-[28px] font-bold tracking-tight leading-tight">
              Beli sekarang, <br />
              cicil dengan tenang
            </p>
            <p className="mt-2 text-sm opacity-80">
              Limit Anda saat ini {formatIDR(user?.limit ?? 3_000_000)}.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/apply">
                <Button variant="secondary">
                  Mulai Pengajuan <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm opacity-90">Total Sisa Cicilan Aktif</p>
              <span className="chip bg-white/15 text-white">
                {apps.filter((a) => a.status === "active").length} cicilan
              </span>
            </div>
            <p className="mt-2 text-[40px] font-bold tracking-tight">
              {formatIDR(totalActive)}
            </p>

            {active ? (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <CalendarClock className="h-4 w-4" /> Jatuh Tempo
                    </div>
                    <p className="mt-1 font-semibold">
                      {active.nextDue
                        ? formatDate(new Date(active.nextDue))
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <CreditCard className="h-4 w-4" /> Nominal
                    </div>
                    <p className="mt-1 font-semibold">
                      {formatIDR(active.monthly)}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/payments?applicationId=${active.app.id}`}>
                    <Button variant="secondary">
                      Bayar Sekarang <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/installments/${active.app.id}`}>
                    <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white">
                      Lihat detail <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm opacity-90">
                Semua cicilan sudah lunas 🎉
              </p>
            )}
          </>
        )}
      </div>

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

      {apps.length > 0 ? (
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
            {apps.slice(0, 4).map((row) => {
              const progress =
                row.total > 0 ? Math.round((row.paid / row.total) * 100) : 0;
              return (
                <Link
                  key={row.app.id}
                  href={`/installments/${row.app.id}`}
                  className="block"
                >
                  <Card className="p-5">
                    <div className="flex gap-4">
                      <img
                        src={row.product?.imageUrl}
                        alt={row.product?.title}
                        className="h-16 w-16 rounded-2xl object-cover bg-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink truncate">
                          {row.product?.title}
                        </p>
                        <p className="text-sm text-ink-muted mt-0.5">
                          {row.paidMonths} dari {row.tenor} cicilan
                        </p>
                      </div>
                      <Badge
                        tone={row.status === "completed" ? "success" : "primary"}
                      >
                        {row.status === "completed" ? "Lunas" : "Aktif"}
                      </Badge>
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
                        <span className="font-semibold text-ink">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <Card>
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-emerald/10 text-emerald grid place-items-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-ink">
              Limit Anda: {formatIDR(user?.limit ?? 5_000_000)}
            </p>
            <p className="text-sm text-ink-muted mt-1">
              Pertahankan track record pembayaran tepat waktu untuk naik trust
              level dan limit lebih besar.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
