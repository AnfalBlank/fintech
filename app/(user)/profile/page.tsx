"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CreditCard,
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  Sparkles,
  User,
  FileText,
  Smartphone,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { auth } from "@/lib/client";
import { formatIDR } from "@/lib/utils";

type ModalKey =
  | null
  | "data"
  | "payment"
  | "security"
  | "settings"
  | "help"
  | "legal"
  | "logout";

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState<ModalKey>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    auth.me().then((res) => {
      if (res.ok) setUser(res.data.user);
    });
  }, []);

  const onLogout = async () => {
    await auth.logout();
    toast.success("Berhasil keluar");
    router.push("/login");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-primary text-white grid place-items-center text-2xl font-bold">
            {user?.name?.charAt(0) ?? "?"}
          </div>
          <div className="flex-1">
            <p className="text-section font-bold text-ink">
              {user?.name ?? "Loading..."}
            </p>
            <p className="text-sm text-ink-muted">{user?.phone ?? "—"}</p>
            <Badge tone="primary" className="mt-2">
              <Sparkles className="h-3.5 w-3.5" /> Trust Level{" "}
              {user?.trustLevel ?? 1}
            </Badge>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-primary-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Limit Anda</span>
            <span className="font-semibold text-ink">
              {formatIDR(user?.limit ?? 0)}
            </span>
          </div>
          <Progress
            value={user ? Math.min(100, (user.trustLevel / 3) * 100) : 0}
            className="mt-2"
          />
          <p className="text-xs text-ink-muted mt-2">
            Lunasi cicilan tepat waktu untuk naik trust level.
          </p>
        </div>
      </Card>

      <Card className="p-0">
        <ul className="divide-y divide-border">
          <MenuItem
            Icon={User}
            title="Data Pribadi"
            desc="Update KTP & alamat"
            onClick={() => setOpen("data")}
          />
          <MenuItem
            Icon={CreditCard}
            title="Metode Pembayaran"
            desc="Kelola VA & e-wallet"
            onClick={() => setOpen("payment")}
          />
          <MenuItem
            Icon={Shield}
            title="Keamanan"
            desc="PIN, biometric, device login"
            onClick={() => setOpen("security")}
          />
          <MenuItem
            Icon={Settings}
            title="Pengaturan"
            desc="Notifikasi & bahasa"
            onClick={() => setOpen("settings")}
          />
          <MenuItem
            Icon={FileText}
            title="Dokumen Legal"
            desc="T&C, privacy, perjanjian cicilan"
            onClick={() => setOpen("legal")}
          />
          <MenuItem
            Icon={HelpCircle}
            title="Bantuan"
            desc="FAQ & hubungi kami"
            onClick={() => setOpen("help")}
          />
        </ul>
      </Card>

      <button
        onClick={() => setOpen("logout")}
        className="w-full text-center text-sm text-danger font-semibold py-3 inline-flex items-center justify-center gap-2 hover:underline"
      >
        <LogOut className="h-4 w-4" /> Keluar
      </button>

      {/* Data modal */}
      <Modal
        open={open === "data"}
        onClose={() => setOpen(null)}
        title="Data Pribadi"
        description="Perubahan KTP butuh re-verifikasi tim approval."
      >
        <div className="space-y-3">
          <div>
            <Label>Nama Lengkap</Label>
            <Input defaultValue={user?.name ?? ""} />
          </div>
          <div>
            <Label>Alamat Domisili</Label>
            <Input defaultValue={user?.address ?? user?.city ?? ""} />
          </div>
          <div>
            <Label>Pekerjaan</Label>
            <Input defaultValue={user?.occupation ?? ""} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setOpen(null)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              toast.success("Data tersimpan");
              setOpen(null);
            }}
          >
            Simpan
          </Button>
        </div>
      </Modal>

      <Modal
        open={open === "payment"}
        onClose={() => setOpen(null)}
        title="Metode Pembayaran"
      >
        <ul className="space-y-2">
          {[
            { name: "BCA Virtual Account", masked: "•••• 1199", default: true },
            { name: "GoPay", masked: "+62 812 ••• 2210", default: false },
          ].map((m) => (
            <li
              key={m.name}
              className="flex items-center justify-between p-3 rounded-2xl border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary-50 text-primary grid place-items-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm">{m.name}</p>
                  <p className="text-xs text-ink-muted">{m.masked}</p>
                </div>
              </div>
              {m.default ? <Badge tone="primary">Default</Badge> : null}
            </li>
          ))}
        </ul>
        <Button
          block
          variant="secondary"
          className="mt-4"
          onClick={() => toast.info("Tambah metode", "Coming soon")}
        >
          + Tambah Metode
        </Button>
      </Modal>

      <Modal
        open={open === "security"}
        onClose={() => setOpen(null)}
        title="Keamanan"
      >
        <ul className="space-y-3">
          <Toggle label="Login dengan PIN" defaultChecked />
          <Toggle label="Login dengan Biometric" defaultChecked />
          <Toggle label="Notifikasi login mencurigakan" defaultChecked />
        </ul>
        <div className="mt-5 rounded-2xl bg-primary-50 p-4">
          <p className="text-sm font-semibold text-ink flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            Device Aktif
          </p>
          <p className="text-xs text-ink-muted mt-1">iPhone 14 Pro · Jakarta</p>
        </div>
      </Modal>

      <Modal
        open={open === "settings"}
        onClose={() => setOpen(null)}
        title="Pengaturan"
      >
        <ul className="space-y-3">
          <Toggle label="Push notification" defaultChecked />
          <Toggle label="Email reminder" defaultChecked />
          <Toggle label="WhatsApp reminder" defaultChecked />
          <Toggle label="Marketing message" />
        </ul>
      </Modal>

      <Modal
        open={open === "legal"}
        onClose={() => setOpen(null)}
        title="Dokumen Legal"
      >
        <ul className="divide-y divide-border">
          {[
            "Syarat & Ketentuan",
            "Kebijakan Privasi",
            "Perjanjian Cicilan Digital",
            "Persetujuan Tanda Tangan Digital",
            "Persetujuan Pengambilan Data",
          ].map((d) => (
            <li
              key={d}
              className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl cursor-pointer"
              onClick={() => toast.info("Membuka dokumen", d)}
            >
              <span className="text-sm font-medium text-ink">{d}</span>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={open === "help"}
        onClose={() => setOpen(null)}
        title="Pusat Bantuan"
        description="Tim support siap bantu via WA atau email."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Button
            variant="secondary"
            block
            onClick={() => toast.success("Membuka WhatsApp")}
          >
            Chat WhatsApp
          </Button>
          <Button
            variant="secondary"
            block
            onClick={() => toast.success("Membuka email")}
          >
            Email Support
          </Button>
        </div>
        <div className="mt-5">
          <p className="font-semibold text-ink text-sm mb-2">FAQ</p>
          <ul className="space-y-2 text-sm">
            {[
              "Bagaimana cara naik trust level?",
              "Apa konsekuensi telat bayar?",
              "Kategori barang apa yang bisa dicicil?",
            ].map((q) => (
              <li
                key={q}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                {q}
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      <Modal
        open={open === "logout"}
        onClose={() => setOpen(null)}
        title="Keluar dari akun?"
        description="Anda akan logout dari device ini."
      >
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={() => setOpen(null)}>
            Batal
          </Button>
          <Button variant="danger" onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Keluar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function MenuItem({
  Icon,
  title,
  desc,
  onClick,
}: {
  Icon: any;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 text-left"
      >
        <div className="h-10 w-10 rounded-2xl bg-primary-50 text-primary grid place-items-center">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-ink">{title}</p>
          <p className="text-xs text-ink-muted">{desc}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-ink-muted" />
      </button>
    </li>
  );
}

function Toggle({
  label,
  defaultChecked,
}: {
  label: string;
  defaultChecked?: boolean;
}) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <li className="flex items-center justify-between p-3 rounded-2xl border border-border">
      <span className="text-sm font-medium text-ink">{label}</span>
      <button
        onClick={() => setOn((s) => !s)}
        className={
          on
            ? "relative h-6 w-11 rounded-full bg-primary transition"
            : "relative h-6 w-11 rounded-full bg-slate-300 transition"
        }
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? "left-5" : "left-0.5"}`}
        />
      </button>
    </li>
  );
}
