"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Info,
  Percent,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stepper } from "@/components/user/stepper";
import { formatIDR, cn } from "@/lib/utils";
import { simulate, type Tenor } from "@/lib/financing";
import { getApply, setApply } from "@/lib/apply-store";

const tenorOptions: Tenor[] = [3, 6, 12];

export default function SimulatePage() {
  const router = useRouter();
  const [tenor, setTenor] = useState<Tenor>(3);
  const [product, setProduct] = useState<any | null>(null);

  useEffect(() => {
    const a = getApply();
    if (!a.product) {
      router.push("/apply");
      return;
    }
    setProduct(a.product);
    if (a.tenor) setTenor(a.tenor);
  }, [router]);

  if (!product) return null;

  const sim = simulate(product.price, tenor, {
    highRisk: product.highRisk,
  });

  const onContinue = () => {
    setApply({ tenor });
    router.push("/apply/verify");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Stepper current={2} />
      <div>
        <h1 className="text-page font-bold text-ink">Simulasi Cicilan</h1>
        <p className="text-ink-muted mt-1.5">
          Pilih tenor sesuai kemampuan Anda. Margin transparan, tanpa biaya
          tersembunyi.
        </p>
      </div>

      <Card className="flex items-center gap-4">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-16 w-16 rounded-2xl object-cover bg-slate-100"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink line-clamp-1">{product.title}</p>
          <p className="text-sm text-ink-muted">
            {product.marketplace} · {product.category}
          </p>
        </div>
        <p className="font-bold text-ink">{formatIDR(product.price)}</p>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Pilih Tenor Cicilan</CardTitle>
          <Badge tone="info">
            <Percent className="h-3.5 w-3.5" />
            {Math.round(sim.marginPct * 100)}% margin
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {tenorOptions.map((t) => {
            const s = simulate(product.price, t, { highRisk: product.highRisk });
            const active = t === tenor;
            return (
              <button
                key={t}
                onClick={() => setTenor(t)}
                className={cn(
                  "rounded-3xl p-4 text-left border-2 transition-all",
                  active
                    ? "border-primary bg-primary-50/60 shadow-ring"
                    : "border-border bg-white hover:border-primary-200"
                )}
              >
                <p
                  className={cn(
                    "text-sm font-semibold",
                    active ? "text-primary" : "text-ink-muted"
                  )}
                >
                  {t} Bulan
                </p>
                <p className="text-2xl font-bold text-ink mt-1">
                  {formatIDR(s.monthly).replace("Rp", "Rp ")}
                </p>
                <p className="text-xs text-ink-muted mt-1">/bulan</p>
                {active ? (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-semibold">
                    <Check className="h-3.5 w-3.5" /> Dipilih
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Card>

      {sim.dpRequired ? (
        <Card>
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-2xl bg-warning/10 text-warning grid place-items-center">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink">
                DP {Math.round(sim.dpPct * 100)}% diperlukan
              </p>
              <p className="text-sm text-ink-muted mt-1">
                Karena harga produk di atas Rp 3 juta atau kategori high risk,
                sistem mengharuskan pembayaran DP minimum {formatIDR(sim.dpAmount)}.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-emerald/5 border-emerald/20">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-2xl bg-emerald/10 text-emerald grid place-items-center">
              <Check className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink">Tanpa DP</p>
              <p className="text-sm text-ink-muted mt-1">
                Anda memenuhi syarat tanpa uang muka.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Ringkasan Pembiayaan</CardTitle>
        <div className="mt-4 divide-y divide-border">
          <Row label="Harga Produk" value={formatIDR(sim.productPrice)} />
          <Row
            label={`Margin (${Math.round(sim.marginPct * 100)}%)`}
            value={formatIDR(sim.total - sim.productPrice)}
          />
          <Row label="Total Pembiayaan" value={formatIDR(sim.total)} bold />
          {sim.dpRequired ? (
            <Row
              label={`DP (${Math.round(sim.dpPct * 100)}%)`}
              value={"− " + formatIDR(sim.dpAmount)}
              tone="warning"
            />
          ) : null}
          <Row label="Sisa Dicicil" value={formatIDR(sim.financed)} />
          <Row
            label={`Cicilan ${sim.tenor} bulan`}
            value={formatIDR(sim.monthly) + " / bln"}
            tone="primary"
            bold
          />
        </div>

        <div className="mt-5 flex items-start gap-2 text-xs text-ink-muted bg-slate-50 rounded-2xl p-3">
          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p>
            Cicilan pertama jatuh tempo 30 hari setelah barang diterima.
            Pembayaran dapat dilakukan via VA bank, QRIS, atau e-wallet.
          </p>
        </div>
      </Card>

      <div className="flex gap-3">
        <Link href="/apply" className="flex-1">
          <Button variant="secondary" block>
            Kembali
          </Button>
        </Link>
        <Button block className="flex-1" onClick={onContinue}>
          Lanjut Verifikasi <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "primary" | "warning";
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span
        className={cn(
          "text-sm",
          bold ? "font-bold text-ink" : "font-medium text-ink",
          tone === "primary" && "text-primary",
          tone === "warning" && "text-warning"
        )}
      >
        {value}
      </span>
    </div>
  );
}
