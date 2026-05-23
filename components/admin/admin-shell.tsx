"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardCheck,
  Wallet,
  Truck,
  ShieldAlert,
  Boxes,
  Search,
  ChevronDown,
  LineChart,
  Warehouse,
  Users,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsPopover } from "@/components/ui/notifications";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const nav = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/approvals", label: "Approval", Icon: ClipboardCheck },
  { href: "/admin/finance", label: "Finance", Icon: LineChart },
  { href: "/admin/warehouse", label: "Warehouse / QC", Icon: Warehouse },
  { href: "/admin/delivery", label: "Delivery", Icon: Truck },
  { href: "/admin/collection", label: "Collection", Icon: Wallet },
  { href: "/admin/fraud", label: "Fraud", Icon: ShieldAlert },
  { href: "/admin/assets", label: "Assets", Icon: Boxes },
  { href: "/admin/users", label: "Users & Roles", Icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const onLogout = () => {
    toast.success("Berhasil keluar", "Sesi admin diakhiri");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col bg-navy text-white sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-white grid place-items-center text-primary font-bold">
            M
          </div>
          <div className="leading-tight">
            <p className="font-bold">Manggala</p>
            <p className="text-[10px] text-white/50">Admin Console</p>
          </div>
        </div>

        <nav className="px-3 mt-2 space-y-1 flex-1 overflow-y-auto">
          {nav.map((n) => {
            const active = n.exact
              ? pathname === n.href
              : pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <n.Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs text-white/60">Active session</p>
            <p className="text-sm font-semibold mt-1">Andini Pratama</p>
            <p className="text-xs text-white/50">Finance Admin</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 glass border-b border-border">
          <div className="flex items-center gap-3 px-6 h-16">
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full h-10 rounded-2xl bg-white border border-border pl-10 pr-4 text-sm text-ink-muted hover:bg-slate-50 text-left relative"
              >
                <Search className="h-4 w-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                Cari pengajuan, user, asset…
              </button>
            </div>
            <NotificationsPopover />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="h-10 px-2.5 rounded-2xl bg-white border border-border flex items-center gap-2.5 hover:bg-slate-50"
              >
                <span className="h-7 w-7 rounded-xl bg-primary text-white grid place-items-center text-xs font-bold">
                  A
                </span>
                <span className="text-sm font-semibold text-ink hidden sm:inline">
                  Andini
                </span>
                <ChevronDown className="h-4 w-4 text-ink-muted" />
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
                        Andini Pratama
                      </p>
                      <p className="text-xs text-ink-muted">Finance Admin</p>
                    </div>
                    <Link
                      href="/admin/users"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-slate-100"
                    >
                      <User className="h-4 w-4 text-ink-muted" />
                      Profil & Permissions
                    </Link>
                    <button
                      onClick={() =>
                        toast.info("Pengaturan", "Coming soon")
                      }
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-slate-100"
                    >
                      <Settings className="h-4 w-4 text-ink-muted" />
                      Pengaturan
                    </button>
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
        </header>

        <Modal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          title="Cari di Admin Console"
          description="Cari pengajuan, user, asset, atau modul"
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
              Modul
            </p>
            {nav
              .filter(
                (n) =>
                  !query ||
                  n.label.toLowerCase().includes(query.toLowerCase())
              )
              .map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-slate-100"
                >
                  <n.Icon className="h-4 w-4 text-ink-muted" />
                  {n.label}
                </Link>
              ))}
          </div>
        </Modal>

        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
