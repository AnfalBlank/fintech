import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-bg">
      {/* Left brand panel (desktop) */}
      <div className="hidden md:flex relative bg-gradient-to-br from-primary-700 via-primary to-sky text-white p-10 flex-col justify-between overflow-hidden">
        <div
          aria-hidden
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -left-10 -bottom-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size="lg" />
            <span className="font-bold text-lg">Manggala</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">
            Beli sekarang, <br />
            cicil dengan tenang.
          </h2>
          <p className="mt-3 text-white/80 max-w-md">
            Verified Delivery Financing — financing, QC, anti-fraud, dan
            collection dalam satu platform.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm">
            <Stat label="Approval" value="< 30m" />
            <Stat label="Delivery" value="< 24h" />
            <Stat label="Collection" value="> 90%" />
          </div>
        </div>
        <p className="text-xs text-white/60 relative">
          © 2026 PT. Manggala Utama Indonesia
        </p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-white/70">{label}</p>
  </div>
);
