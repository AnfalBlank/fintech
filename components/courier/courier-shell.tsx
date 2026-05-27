"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, History, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { auth } from "@/lib/client";
import { Logo } from "@/components/ui/logo";

const nav = [
  { href: "/courier", label: "Tugas", Icon: Home },
  { href: "/courier/history", label: "Riwayat", Icon: History },
  { href: "/courier/profile", label: "Profil", Icon: User },
];

export function CourierShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const onLogout = async () => {
    await auth.logout();
    toast.success("Logout berhasil");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-md mx-auto border-x border-border pb-20">
      <header className="sticky top-0 z-30 glass">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/courier" className="flex items-center gap-2">
            <Logo size="sm" />
            <div className="leading-tight">
              <p className="font-bold text-sm">Manggala Courier</p>
              <p className="text-[10px] text-ink-muted -mt-0.5">v1.0</p>
            </div>
          </Link>
          <button
            onClick={onLogout}
            className="text-ink-muted hover:text-ink"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-border max-w-md mx-auto">
        <div className="grid grid-cols-3 h-16">
          {nav.map((n) => {
            const active =
              n.href === "/courier"
                ? pathname === "/courier"
                : pathname?.startsWith(n.href);
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
