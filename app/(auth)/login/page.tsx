"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setStep("otp");
    setLoading(false);
  };

  const verify = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    router.push("/dashboard");
  };

  return (
    <>
      <h1 className="text-page font-bold text-ink">Masuk</h1>
      <p className="text-ink-muted mt-1.5">
        Masukkan nomor HP terdaftar untuk menerima kode OTP.
      </p>

      {step === "phone" ? (
        <div className="mt-8 space-y-4">
          <div>
            <Label>Nomor HP</Label>
            <div className="relative">
              <Phone className="h-5 w-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812..."
                className="pl-11"
              />
            </div>
          </div>
          <Button block size="lg" onClick={send} disabled={!phone || loading}>
            {loading ? "Mengirim OTP…" : (
              <>
                Lanjutkan <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
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
              Kami kirim kode ke <span className="font-semibold">{phone}</span>.
              Tidak dapat?{" "}
              <button onClick={() => setStep("phone")} className="text-primary font-semibold">
                Ubah nomor
              </button>
            </p>
          </div>
          <Button
            block
            size="lg"
            onClick={verify}
            disabled={otp.length < 4 || loading}
          >
            {loading ? "Memverifikasi…" : "Masuk"}
          </Button>
        </div>
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
