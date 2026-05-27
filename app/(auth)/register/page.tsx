"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { auth } from "@/lib/client";

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    consentTnc: false,
    consentData: false,
  });
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consentTnc || !form.consentData) {
      return toast.warning("Persetujuan diperlukan", "Centang T&C dan data");
    }
    setLoading(true);
    const res = await auth.register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      consentTnc: form.consentTnc,
      consentData: form.consentData,
    });
    setLoading(false);
    if (!res.ok) return toast.danger("Pendaftaran gagal", res.error);
    setDevOtp(res.data.otp);
    setStep("otp");
    toast.info(
      "OTP terkirim",
      res.data.otp ? `Dev: ${res.data.otp}` : `Kode dikirim ke ${form.phone}`
    );
  };

  const verifyOtp = async () => {
    setLoading(true);
    const res = await auth.otpVerify(form.phone, otp);
    setLoading(false);
    if (!res.ok) return toast.danger("Verifikasi gagal", res.error);
    toast.success("Akun aktif", "Selamat datang di Manggala");
    router.push("/dashboard");
  };

  return (
    <>
      <h1 className="text-page font-bold text-ink">
        {step === "form" ? "Daftar" : "Verifikasi HP"}
      </h1>
      <p className="text-ink-muted mt-1.5">
        {step === "form"
          ? "Buat akun untuk mulai pengajuan cicilan pertama Anda."
          : "Masukkan 6 digit kode OTP yang kami kirim."}
      </p>

      {step === "form" ? (
        <form onSubmit={submitForm} className="mt-8 space-y-4">
          <div>
            <Label>Nama Lengkap</Label>
            <div className="relative">
              <User className="h-5 w-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Sesuai KTP"
                className="pl-11"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <div className="relative">
              <Mail className="h-5 w-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="kamu@email.com"
                type="email"
                className="pl-11"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label>Nomor HP</Label>
            <div className="relative">
              <Phone className="h-5 w-5 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="+62812..."
                type="tel"
                className="pl-11"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <label className="flex items-start gap-3 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={form.consentTnc}
                onChange={(e) =>
                  setForm({ ...form, consentTnc: e.target.checked })
                }
                className="h-4 w-4 mt-0.5 rounded border-border accent-primary"
              />
              <span className="text-ink">
                Saya setuju dengan{" "}
                <a href="#" className="text-primary font-semibold">
                  T&C
                </a>{" "}
                dan{" "}
                <a href="#" className="text-primary font-semibold">
                  Privasi
                </a>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={form.consentData}
                onChange={(e) =>
                  setForm({ ...form, consentData: e.target.checked })
                }
                className="h-4 w-4 mt-0.5 rounded border-border accent-primary"
              />
              <span className="text-ink">
                Saya setuju Manggala memproses data verifikasi.
              </span>
            </label>
          </div>

          <Button block size="lg" type="submit" disabled={loading}>
            {loading ? "Mendaftar…" : (
              <>
                Lanjutkan <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
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
              Dikirim ke <span className="font-semibold">{form.phone}</span>
              {devOtp ? ` · Dev: ${devOtp}` : ""}
            </p>
          </div>
          <Button
            block
            size="lg"
            onClick={verifyOtp}
            disabled={otp.length < 4 || loading}
          >
            {loading ? "Memverifikasi…" : "Verifikasi & Masuk"}
          </Button>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-ink-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-primary font-semibold">
          Masuk
        </Link>
      </p>
    </>
  );
}
