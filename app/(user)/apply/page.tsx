"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Star,
  Store,
  Smartphone,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { customer } from "@/lib/client";
import { setApply, clearApply } from "@/lib/apply-store";
import { formatIDR } from "@/lib/utils";

export default function ApplyPage() {
  const router = useRouter();
  const toast = useToast();
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [scraped, setScraped] = useState<any | null>(null);

  const onScrape = async () => {
    if (!link.trim()) return;
    setLoading(true);
    const res = await customer.scrape(link);
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal ambil data produk", res.error);
    setScraped(res.data.product);
    setApply({
      productUrl: link,
      product: res.data.product,
      simulations: res.data.simulations,
    });
    toast.success("Produk berhasil diambil");
    if (res.data.product.highRisk) {
      toast.warning(
        "Kategori high risk",
        "Pengajuan akan butuh DP lebih besar"
      );
    }
  };

  const useSample = () => {
    setLink("https://tokopedia.com/sample/iphone-15-pro");
  };

  const onContinue = () => {
    router.push("/apply/simulate");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-sm text-ink-muted">Step 1 dari 4</p>
        <h1 className="text-page font-bold text-ink mt-1">Paste Link Produk</h1>
        <p className="text-ink-muted mt-1.5">
          Salin tautan produk dari marketplace, kami akan ambil detailnya
          otomatis.
        </p>
      </div>

      <Card>
        <label className="label-base">Link produk</label>
        <div className="relative">
          <Link2 className="h-5 w-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.tokopedia.com/..."
            className="input-base pl-11 pr-4"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {["Tokopedia", "Shopee", "TikTok Shop", "Lazada"].map((m) => (
            <span key={m} className="chip bg-slate-100 text-ink-muted">
              <Store className="h-3 w-3" /> {m}
            </span>
          ))}
        </div>

        <Button
          block
          className="mt-5"
          size="lg"
          disabled={!link || loading}
          onClick={onScrape}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Menarik data
              produk…
            </>
          ) : (
            <>
              Ambil Data Produk <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {!scraped && !loading ? (
          <button
            type="button"
            onClick={useSample}
            className="mt-3 text-sm text-primary font-medium hover:underline"
          >
            Atau gunakan contoh produk →
          </button>
        ) : null}
      </Card>

      {loading ? (
        <Card>
          <div className="flex gap-4">
            <div className="skeleton h-24 w-24 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-7 w-32 mt-3" />
            </div>
          </div>
        </Card>
      ) : null}

      {scraped ? (
        <Card className="animate-fadeIn">
          <div className="flex items-start justify-between">
            <CardTitle>Preview Produk</CardTitle>
            {scraped.highRisk ? (
              <Badge tone="danger">
                <ShieldAlert className="h-3.5 w-3.5" /> High Risk
              </Badge>
            ) : (
              <Badge tone="success">
                <ShieldCheck className="h-3.5 w-3.5" /> Kategori Aman
              </Badge>
            )}
          </div>
          <div className="mt-4 flex gap-4">
            <img
              src={scraped.imageUrl}
              alt={scraped.title}
              className="h-28 w-28 rounded-2xl object-cover bg-slate-100"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink line-clamp-2">
                {scraped.title}
              </p>
              <p className="text-sm text-ink-muted mt-1 flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" /> {scraped.storeName}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="flex items-center gap-1 text-warning font-semibold">
                  <Star className="h-3.5 w-3.5 fill-warning" />
                  {scraped.storeRating}
                </span>
                <span className="text-ink-muted">·</span>
                <span className="text-ink-muted">{scraped.marketplace}</span>
                <span className="text-ink-muted">·</span>
                <span className="text-ink-muted">{scraped.category}</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-ink">
                {formatIDR(scraped.price)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Resale Score" value={`${scraped.resaleScore}/100`} Icon={Sparkles} />
            <Stat label="Kategori" value={scraped.category.split(" ")[0]} Icon={Smartphone} />
            <Stat label="QC Required" value="Ya" Icon={PackageCheck} />
          </div>

          <Button block size="lg" className="mt-6" onClick={onContinue}>
            Lanjut ke Simulasi <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      ) : null}
    </div>
  );
}

const Stat = ({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: any;
}) => (
  <div className="rounded-2xl bg-slate-50 p-3">
    <Icon className="h-4 w-4 text-primary" />
    <p className="text-[11px] text-ink-muted mt-1.5">{label}</p>
    <p className="font-semibold text-ink text-sm">{value}</p>
  </div>
);
