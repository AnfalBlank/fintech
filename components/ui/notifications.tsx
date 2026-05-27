"use client";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  ShieldAlert,
  Bell as BellIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { customer } from "@/lib/client";

type Notif = {
  id: string;
  type: string;
  tone: "success" | "info" | "warning" | "danger";
  title: string;
  body?: string;
  createdAt: number | string;
  readAt?: number | string | null;
};

const toneStyles: Record<Notif["tone"], string> = {
  success: "bg-emerald/10 text-emerald",
  info: "bg-primary-50 text-primary",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

const TYPE_ICON: Record<string, any> = {
  approval_update: CheckCircle2,
  delivery_update: Truck,
  payment_reminder: AlertCircle,
  payment_success: CreditCard,
  fraud_alert: ShieldAlert,
  system: BellIcon,
};

function timeAgo(d: number | string): string {
  const ts = typeof d === "string" ? new Date(d).getTime() : d * 1000;
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} mnt lalu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const day = Math.floor(h / 24);
  return `${day} hari lalu`;
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const res = await customer.notifications();
    setLoading(false);
    if (res.ok) setItems(res.data.items);
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  const unread = items.filter((i) => !i.readAt).length;

  const markAll = async () => {
    await customer.markNotificationsRead();
    setItems((s) => s.map((i) => ({ ...i, readAt: Date.now() / 1000 })));
  };

  const markOne = async (id: string) => {
    await customer.markNotificationsRead([id]);
    setItems((s) =>
      s.map((i) => (i.id === id ? { ...i, readAt: Date.now() / 1000 } : i))
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((s) => !s);
          if (!open) refresh();
        }}
        className="relative h-10 w-10 rounded-2xl border border-border grid place-items-center bg-white hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-ink" />
        {unread > 0 ? (
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger" />
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[340px] z-50 card-base p-0 overflow-hidden shadow-float">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="font-semibold text-ink text-sm">Notifikasi</p>
              {unread > 0 ? (
                <button
                  onClick={markAll}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Tandai semua dibaca
                </button>
              ) : null}
            </div>
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border">
              {loading ? (
                <li className="p-6 text-center text-xs text-ink-muted">
                  Memuat…
                </li>
              ) : items.length === 0 ? (
                <li className="p-6 text-center text-xs text-ink-muted">
                  Tidak ada notifikasi
                </li>
              ) : null}
              {items.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? BellIcon;
                const isUnread = !n.readAt;
                return (
                  <li
                    key={n.id}
                    onClick={() => isUnread && markOne(n.id)}
                    className={cn(
                      "p-4 flex gap-3 hover:bg-slate-50 cursor-pointer",
                      isUnread && "bg-primary-50/30"
                    )}
                  >
                    <div
                      className={cn(
                        "h-9 w-9 rounded-2xl grid place-items-center flex-shrink-0",
                        toneStyles[n.tone]
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {n.title}
                      </p>
                      {n.body ? (
                        <p className="text-xs text-ink-muted line-clamp-2">
                          {n.body}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-ink-muted mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {isUnread ? (
                      <span className="h-2 w-2 rounded-full bg-primary self-center" />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
