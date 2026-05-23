"use client";
import { useState } from "react";
import { Bell, CheckCircle2, AlertCircle, Truck, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  Icon: any;
  tone: "success" | "warning" | "primary";
  title: string;
  desc: string;
  time: string;
  unread: boolean;
};

const initial: Notif[] = [
  {
    id: "n1",
    Icon: CheckCircle2,
    tone: "success",
    title: "Pengajuan disetujui",
    desc: "APP-2026-00231 berhasil disetujui",
    time: "2 mnt lalu",
    unread: true,
  },
  {
    id: "n2",
    Icon: Truck,
    tone: "primary",
    title: "Barang dalam perjalanan",
    desc: "Kurir Adi Saputra · ETA 14:00",
    time: "1 jam lalu",
    unread: true,
  },
  {
    id: "n3",
    Icon: AlertCircle,
    tone: "warning",
    title: "Reminder cicilan",
    desc: "Jatuh tempo MacBook Air 12 Juni 2026",
    time: "3 jam lalu",
    unread: false,
  },
  {
    id: "n4",
    Icon: CreditCard,
    tone: "success",
    title: "Pembayaran diterima",
    desc: "Cicilan ke-2 MacBook Air Rp 2.750.000",
    time: "Kemarin",
    unread: false,
  },
];

export function NotificationsPopover({ darkButton = false }: { darkButton?: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>(initial);
  const unread = items.filter((i) => i.unread).length;

  const markAll = () => setItems((s) => s.map((i) => ({ ...i, unread: false })));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "relative h-10 w-10 rounded-2xl border border-border grid place-items-center transition",
          darkButton
            ? "bg-white hover:bg-slate-50"
            : "bg-white hover:bg-slate-50"
        )}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-ink" />
        {unread > 0 ? (
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger" />
        ) : null}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
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
              {items.map((n) => {
                const tones = {
                  success: "bg-emerald/10 text-emerald",
                  warning: "bg-warning/10 text-warning",
                  primary: "bg-primary-50 text-primary",
                };
                return (
                  <li
                    key={n.id}
                    className={cn(
                      "p-4 flex gap-3 hover:bg-slate-50 cursor-pointer",
                      n.unread && "bg-primary-50/30"
                    )}
                    onClick={() =>
                      setItems((s) =>
                        s.map((i) =>
                          i.id === n.id ? { ...i, unread: false } : i
                        )
                      )
                    }
                  >
                    <div
                      className={cn(
                        "h-9 w-9 rounded-2xl grid place-items-center flex-shrink-0",
                        tones[n.tone]
                      )}
                    >
                      <n.Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-ink-muted line-clamp-2">
                        {n.desc}
                      </p>
                      <p className="text-[11px] text-ink-muted mt-1">
                        {n.time}
                      </p>
                    </div>
                    {n.unread ? (
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
