"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Receipt,
  Plus,
  CreditCard,
  User,
  Search,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsPopover } from "@/components/ui/notifications";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const navItems = [
  { href: "/dashboard", label: "Beranda", Icon: Home },
  { href: "/installments", label: "Cicilan", Icon: Receipt },
  { href: "/apply", label: "Ajukan", Icon: Plus, primary: true },
  { href: "/payments", label: "Bayar", Icon: CreditCard },
  { href: "/profile", label: "Profil", Icon: User },
];

export function UserAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const onLogout = () => {
    toast.success("Berhasil keluar", "Anda telah logout dari akun");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-bg pb-24 md:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass">
        <div className="container flex items-center gap-3 h-16">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-primary grid place-items-center text-white font-bold">
              M
            </div>
            <span className="font-bold hidden sm:inline">Manggala</span>
          </Link>
          <div className="flex-1 flex items-center justify-end gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:inline-flex items-center gap-2 h-10 px-3 rounded-2xl border border-border bg-white text-sm text-ink-muted hover:bg-slate-50"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
              Cari produk, transaksi…
            </button>
            <NotificationsPopover />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="h-10 px-1.5 rounded-2xl bg-white border border-border flex items-center gap-2 hover:bg-slate-50"
              >
                <span className="h-7 w-7 rounded-xl bg-primary text-white grid place-items-center font-semibold text-sm">
                  R
                </span>
                <ChevronDown className="h-4 w-4 text-ink-muted hidden sm:inline" />
              </button>

              {menuOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 z-50 card-base p-2 overflow-hidden shadow-float">
                    <div className="px-3 py-2.5 border-b border-border">
                      <p className="text-sm font-semibold text-ink">
                        Rafi Aditya
                      </p>
                      <p className="text-xs text-ink-muted">Trust Level 2</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-slate-100"
                    >
                      <User className="h-4 w-4 text-ink-muted" />
                      Profil
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-slate-100"
                    >
                      <Settings className="h-4 w-4 text-ink-muted" />
                      Pengaturan
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-danger/5 text-danger"
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Cari"
        description="Cari produk, transaksi, atau halaman"
      >
        <div className="relative">
          <Search className="h-5 w-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik untuk mencari…"
            className="input-base pl-11"
          />
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            Saran cepat
          </p>
          {[
            { label: "Cicilan saya", href: "/installments" },
            { label: "Bayar cicilan", href: "/payments" },
            { label: "Pengajuan baru", href: "/apply" },
            { label: "Profil & limit", href: "/profile" },
          ]
            .filter(
              (s) =>
                !query ||
                s.label.toLowerCase().includes(query.toLowerCase())
            )
            .map((s) => (
              <Link
                key={s.href}
                href={s.href}
                onClick={() => setSearchOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm hover:bg-slate-100"
              >
                {s.label}
              </Link>
            ))}
        </div>
      </Modal>

      {/* Side / content */}
      <div className="container md:grid md:grid-cols-[220px_1fr] md:gap-8 py-6 md:py-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col gap-1.5">
          {navItems
            .filter((n) => !n.primary)
            .map((n) => {
              const active = pathname?.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-3 h-11 px-3 rounded-2xl text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-50 text-primary"
                      : "text-ink-muted hover:bg-slate-100 hover:text-ink"
                  )}
                >
                  <n.Icon className="h-5 w-5" />
                  {n.label}
                </Link>
              );
            })}
          <Link
            href="/apply"
            className="mt-3 h-11 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" /> Pengajuan Baru
          </Link>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-border">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((n) => {
            const active = pathname?.startsWith(n.href);
            if (n.primary) {
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex items-center justify-center"
                >
                  <span className="-mt-7 h-14 w-14 rounded-full bg-primary text-white grid place-items-center shadow-float">
                    <n.Icon className="h-6 w-6" />
                  </span>
                </Link>
              );
            }
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-ink-muted"
                )}
              >
                <n.Icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
