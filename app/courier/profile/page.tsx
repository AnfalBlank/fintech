"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Phone, Truck, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { auth, courier } from "@/lib/client";

export default function CourierProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<any | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    delivered: number;
    pending: number;
    onTimePct: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([auth.me(), courier.stats()]).then(([me, st]) => {
      if (me.ok) setUser(me.data.user);
      if (st.ok) setStats(st.data);
    });
  }, []);

  const onLogout = async () => {
    await auth.logout();
    toast.success("Logout berhasil");
    router.push("/login");
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary text-white grid place-items-center text-xl font-bold">
            {user?.name?.charAt(0) ?? "?"}
          </div>
          <div className="flex-1">
            <p className="font-bold text-ink">{user?.name ?? "Loading…"}</p>
            <p className="text-sm text-ink-muted">{user?.phone ?? "—"}</p>
            <Badge tone="primary" className="mt-1.5">
              <Truck className="h-3 w-3" /> Internal Courier
            </Badge>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-ink text-sm mb-3">
          Performa Pengiriman
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Total" value={String(stats?.total ?? 0)} />
          <Stat label="Selesai" value={String(stats?.delivered ?? 0)} />
          <Stat label="On-time" value={`${stats?.onTimePct ?? 0}%`} />
        </div>
      </Card>

      <Card className="p-0">
        <ul className="divide-y divide-border">
          <Item Icon={User} label="Profil & KTP" />
          <Item Icon={Phone} label="Kontak Darurat" />
          <Item Icon={Truck} label="Kendaraan" />
        </ul>
      </Card>

      <Button variant="secondary" block onClick={onLogout}>
        <LogOut className="h-4 w-4" /> Keluar
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

function Item({ Icon, label }: { Icon: any; label: string }) {
  return (
    <li className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer">
      <div className="h-9 w-9 rounded-2xl bg-primary-50 text-primary grid place-items-center">
        <Icon className="h-4 w-4" />
      </div>
      <span className="font-medium text-ink text-sm">{label}</span>
    </li>
  );
}
