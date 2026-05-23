import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  PackageCheck,
  Wallet,
  Clock,
  Star,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Navbar */}
      <header className="sticky top-0 z-40 glass">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-primary grid place-items-center text-white font-bold">
              M
            </div>
            <div className="leading-tight">
              <p className="font-bold text-ink">Manggala</p>
              <p className="text-[10px] text-ink-muted -mt-0.5">
                Verified Financing
              </p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-muted">
            <a href="#how" className="hover:text-ink">
              Cara Kerja
            </a>
            <a href="#products" className="hover:text-ink">
              Kategori Produk
            </a>
            <a href="#trust" className="hover:text-ink">
              Trust & Security
            </a>
            <Link href="/admin" className="hover:text-ink">
              Admin
            </Link>
            <Link href="/courier" className="hover:text-ink">
              Courier
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Daftar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, #DBEAFE 0%, transparent 70%)",
          }}
        />
        <div className="container py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip bg-primary-50 text-primary-700">
              <Sparkles className="h-3.5 w-3.5" /> Smart Verified Financing
            </span>
            <h1 className="mt-4 text-4xl md:text-hero font-bold text-ink leading-[1.05]">
              Beli sekarang, <br />
              <span className="text-primary">cicil dengan tenang.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-muted max-w-lg">
              Cukup paste link produk dari Tokopedia, Shopee, atau Lazada.
              Manggala akan menalangi pembelian, melakukan QC, lalu antar
              langsung ke rumah Anda.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/apply">
                <Button size="lg">
                  Mulai Pengajuan <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how">
                <Button variant="secondary" size="lg">
                  Lihat Cara Kerja
                </Button>
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              <Stat label="Approval" value="< 30 mnt" />
              <Stat label="Pengiriman" value="< 24 jam" />
              <Stat label="Collection" value="> 90%" />
            </div>
          </div>

          {/* Hero Card */}
          <div className="relative">
            <div className="absolute -top-6 -left-6 h-32 w-32 rounded-3xl bg-primary-100 -z-10" />
            <div className="absolute -bottom-8 -right-4 h-40 w-40 rounded-[42px] bg-emerald/10 -z-10" />
            <div className="rounded-[32px] bg-gradient-to-br from-primary-700 via-primary to-sky text-white shadow-float p-7">
              <div className="flex items-center justify-between">
                <p className="text-sm/none opacity-90">Total Cicilan Aktif</p>
                <span className="chip bg-white/20 text-white">
                  Lvl 2 · Trusted
                </span>
              </div>
              <p className="mt-2 text-[40px] font-bold tracking-tight">
                {formatIDR(8250000)}
              </p>
              <p className="text-sm opacity-80">3 dari 6 cicilan terbayar</p>

              <div className="mt-5 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: "50%" }}
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs opacity-80">Cicilan Berikutnya</p>
                  <p className="font-semibold mt-1">12 Juni 2026</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs opacity-80">Nominal</p>
                  <p className="font-semibold mt-1">
                    {formatIDR(2750000)}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-base mt-4 p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald/10 grid place-items-center">
                <PackageCheck className="h-6 w-6 text-emerald" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">
                  Verified Delivery
                </p>
                <p className="text-xs text-ink-muted">
                  Foto, GPS, dan tanda tangan digital di setiap pengiriman.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-muted" />
            </div>
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="container py-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">
            Cara Kerja
          </p>
          <h2 className="mt-2 text-page font-bold text-ink">
            Pengajuan dalam 4 langkah
          </h2>
          <p className="mt-3 text-ink-muted">
            Proses simpel — di-design supaya selesai dalam hitungan menit.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.title} className="card-base p-6">
              <div className="h-10 w-10 rounded-2xl bg-primary-50 text-primary grid place-items-center font-bold">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h4 className="mt-4 text-cardtitle font-semibold">{s.title}</h4>
              <p className="mt-1.5 text-sm text-ink-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="container py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">
              Kategori
            </p>
            <h2 className="mt-2 text-page font-bold text-ink">
              Cicil produk yang produktif
            </h2>
            <p className="mt-3 text-ink-muted">
              Kami fokus pada elektronik produktif, home appliance, dan
              peralatan usaha — bukan barang spekulatif.
            </p>
            <Link href="/apply" className="inline-flex items-center gap-2 mt-6 text-primary font-semibold">
              Lihat semua kategori <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((c) => (
              <div key={c.title} className="card-base p-5">
                <div className="h-11 w-11 rounded-2xl bg-primary-50 grid place-items-center text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-semibold text-ink">{c.title}</p>
                <p className="text-xs text-ink-muted mt-0.5">{c.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="container py-16">
        <div className="rounded-[32px] bg-gradient-to-br from-slate-900 to-navy text-white p-10 md:p-14 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
          />
          <p className="text-sm font-semibold text-sky-300 uppercase tracking-wider">
            Trust & Security
          </p>
          <h2 className="mt-2 text-page font-bold max-w-xl">
            Diverifikasi langsung sebelum diantar.
          </h2>
          <p className="mt-3 text-white/70 max-w-xl">
            Kami beli, QC, dan validasi serial number tiap produk sebelum
            dikirim. Setiap pengiriman wajib disertai foto, GPS, dan tanda
            tangan digital.
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {trust.map((t) => (
              <div
                key={t.title}
                className="rounded-3xl bg-white/5 border border-white/10 p-5"
              >
                <t.icon className="h-6 w-6 text-sky-300" />
                <p className="mt-3 font-semibold">{t.title}</p>
                <p className="text-sm text-white/60 mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 text-center">
        <h2 className="text-page font-bold text-ink">
          Siap mulai cicilan pertama Anda?
        </h2>
        <p className="mt-3 text-ink-muted max-w-xl mx-auto">
          Dapatkan persetujuan kurang dari 30 menit dan barang sampai dalam 24
          jam.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/apply">
            <Button size="lg">
              Ajukan Sekarang <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="lg">
              Lihat Dashboard
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-white">
        <div className="container py-10 text-sm text-ink-muted flex flex-wrap items-center justify-between gap-4">
          <p>
            © 2026 PT. Manggala Utama Indonesia. Verified Delivery Financing
            Platform.
          </p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-ink">
              Terms
            </a>
            <a href="#" className="hover:text-ink">
              Privacy
            </a>
            <a href="#" className="hover:text-ink">
              Kontak
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-2xl font-bold text-ink">{value}</p>
    <p className="text-xs text-ink-muted">{label}</p>
  </div>
);

const steps = [
  {
    title: "Paste Link Produk",
    desc: "Salin tautan dari Tokopedia, Shopee, atau Lazada.",
  },
  {
    title: "Pilih Tenor & DP",
    desc: "Lihat simulasi cicilan secara instan.",
  },
  {
    title: "Verifikasi Data",
    desc: "Upload KTP, selfie, dan data pekerjaan.",
  },
  {
    title: "Verified Delivery",
    desc: "Barang di-QC, diantar, dan diverifikasi.",
  },
];

const categories = [
  {
    title: "Elektronik Produktif",
    examples: "Smartphone, laptop, tablet, printer",
    icon: Smartphone,
  },
  {
    title: "Home Appliance",
    examples: "AC, kulkas, mesin cuci",
    icon: PackageCheck,
  },
  {
    title: "Peralatan Usaha",
    examples: "Mesin kopi, alat kasir, freezer",
    icon: Wallet,
  },
  {
    title: "Trust System",
    examples: "Limit naik seiring riwayat baik",
    icon: Star,
  },
];

const trust = [
  {
    icon: ShieldCheck,
    title: "OCR & Liveness",
    desc: "KTP di-scan otomatis, selfie diverifikasi via liveness detection.",
  },
  {
    icon: PackageCheck,
    title: "QC Internal",
    desc: "Setiap barang difoto, dicek kondisi, dan dicatat serial number.",
  },
  {
    icon: Clock,
    title: "Reminder Otomatis",
    desc: "Notifikasi via WA, email, dan push sebelum jatuh tempo.",
  },
];
