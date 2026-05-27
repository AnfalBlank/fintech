"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Lock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { auth } from "@/lib/client";
import { cn } from "@/lib/utils";

type Tab = "otp" | "password";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("otp");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone) return;
    setLoading(true);
    const res = await auth.otpRequest(phone);
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal kirim OTP", res.error);
    setStep("otp");
    toast.success(
      "OTP terkirim",
      res.data.otp ? `Dev: ${res.data.otp}` : `Kode dikirim ke ${phone}`
    );
  };

  const verifyOtp = async () => {
    setLoading(true);
    const res = await auth.otpVerify(phone, otp);
    setLoading(false);
    if (!res.ok) return toast.danger("Verifikasi gagal", res.error);
    toast.success("Selamat datang kembali");
    redirectByRole(res.data.user.role);
  };

  const passwordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await auth.login(identifier, password);
    setLoading(false);
    if (!res.ok) return toast.danger("Login gagal", res.error);
    toast.success(`Halo, ${res.data.user.name}`);
    redirectByRole(res.data.user.role);
  };

  const redirectByRole = (role: string) => {
    if (role === "courier") return router.push("/courier");
    if (
      [
        "super_admin",
        "finance_admin",
        "collection_team",
        "delivery_team",
        "surveyor",
      ].includes(role)
    )
      return router.push("/admin");
    router.push("/dashboard");
  };

  return (
    <>
      <h1 className="text-page font-bold text-ink">Masuk</h1>
      <p className="text-ink-muted mt-1.5">
        Pilih metode masuk yang nyaman untuk Anda.
      </p>

      <div className="mt-6 flex gap-2 p-1 rounded-2xl bg-slate-100">
        <button
          onClick={() => setTab("otp")}
          className={cn(
            "flex-1 h-10 rounded-xl text-sm font-semibold transition",
            tab === "otp" ? "bg-white shadow-sm text-ink" : "text-ink-muted"
          )}
        >
          OTP HP
        </button>
        <button
          onClick={() => setTab("password")}
          className={cn(
            "flex-1 h-10 rounded-xl text-sm font-semibold transition",
            tab === "password" ? "bg-white shadow-sm text-ink" : "text-ink-muted"
          )}
        >
          Email & Password
        </button>
      </div>

      {tab === "otp" ? (
        step === "phone" ? (
          <div className="mt-6 space-y-4">
            <div>
              <Label>Nomor HP</Label>
              <div className="relative">
                <Phone className="h-5 w-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62812..."
                  className="pl-11"
                />
              </div>
            </div>
            <Button
              block
              size="lg"
              onClick={sendOtp}
              disabled={!phone || loading}
            >
              {loading ? "Mengirim OTP…" : (
                <>
                  Kirim OTP <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <Label>Kode OTP</Label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6 digit"
                maxLength={6}
                className="tracking-[0.5em] text-center font-mono text-xl"
              />
              <p className="text-xs text-ink-muted mt-2">
                Kode dikirim ke{" "}
                <span className="font-semibold">{phone}</span>.{" "}
                <button
                  onClick={() => setStep("phone")}
                  className="text-primary font-semibold"
                >
                  Ubah nomor
                </button>
              </p>
            </div>
            <Button
              block
              size="lg"
              onClick={verifyOtp}
              disabled={otp.length < 4 || loading}
            >
              {loading ? "Memverifikasi…" : "Masuk"}
            </Button>
          </div>
        )
      ) : (
        <form onSubmit={passwordLogin} className="mt-6 space-y-4">
          <div>
            <Label>Email atau Nomor HP</Label>
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="kamu@email.com"
            />
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Lock className="h-5 w-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-11"
              />
            </div>
          </div>
          <Button block size="lg" type="submit" disabled={loading}>
            {loading ? "Masuk…" : "Masuk"}
          </Button>
          <p className="text-xs text-ink-muted text-center">
            Demo: <code>rafi@example.com</code> /{" "}
            <code>password123</code> (customer) ·{" "}
            <code>bagus@manggala.id</code> (super admin) ·{" "}
            <code>adi@manggala.id</code> (courier)
          </p>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-ink-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="text-primary font-semibold">
          Daftar
        </Link>
      </p>
    </>
  );
}
