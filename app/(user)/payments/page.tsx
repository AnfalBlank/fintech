"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Check,
  Copy,
  CreditCard,
  QrCode,
  Smartphone,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatIDR, cn } from "@/lib/utils";

type Method = "va" | "qris" | "ewallet";

const banks = ["BCA", "BNI", "Mandiri", "BRI"];
const ewallets = ["GoPay", "OVO", "Dana", "ShopeePay", "LinkAja", "Jenius"];

export default function PaymentsPage() {
  const router = useRouter();
  const toast = useToast();
  const [method, setMethod] = useState<Method>("va");
  const [bank, setBank] = useState("BCA");
  const [ewallet, setEwallet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Countdown
  const [timeLeft, setTimeLeft] = useState(60 * 60 * 24);
  useEffect(() => {
    const t = setInterval(() => setTimeLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const amount = 2750000;
  const va = "8800-1029-3344-1199";

  const copy = () => {
    navigator.clipboard.writeText(va.replaceAll("-", ""));
    setCopied(true);
    toast.success("Nomor VA disalin");
    setTimeout(() => setCopied(false), 1500);
  };

  const submit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1100));
    setSubmitting(false);
    setSuccess(true);
    setConfirmOpen(false);
    toast.success(
      "Pembayaran terkonfirmasi",
      "Cicilan ke-3 berhasil dibayar"
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Pembayaran Cicilan</h1>
        <p className="text-ink-muted mt-1.5">
          MacBook Air M2 — Cicilan ke-3 dari 6
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary-700 via-primary to-sky text-white p-7 shadow-float">
        <p className="text-sm opacity-90">Total Pembayaran</p>
        <p className="text-[40px] font-bold tracking-tight mt-1">
          {formatIDR(amount)}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold font-mono">
          <Timer className="h-4 w-4" />
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </div>
      </Card>

      <Card>
        <CardTitle>Pilih Metode Pembayaran</CardTitle>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <MethodCard
            active={method === "va"}
            onClick={() => setMethod("va")}
            Icon={Banknote}
            title="Virtual Account"
            desc="BCA, BNI, Mandiri"
          />
          <MethodCard
            active={method === "qris"}
            onClick={() => setMethod("qris")}
            Icon={QrCode}
            title="QRIS"
            desc="Semua e-wallet"
          />
          <MethodCard
            active={method === "ewallet"}
            onClick={() => setMethod("ewallet")}
            Icon={Smartphone}
            title="E-Wallet"
            desc="GoPay, OVO, Dana"
          />
        </div>
      </Card>

      <Card>
        {method === "va" ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Virtual Account {bank}</CardTitle>
              <Badge tone="primary">Otomatis Terkonfirmasi</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {banks.map((b) => (
                <button
                  key={b}
                  onClick={() => setBank(b)}
                  className={cn(
                    "h-8 px-3 rounded-xl text-xs font-semibold transition",
                    bank === b
                      ? "bg-primary text-white"
                      : "bg-white border border-border text-ink-muted hover:bg-slate-50"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border-2 border-dashed border-border p-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-ink-muted">Nomor VA</p>
                <p className="font-mono text-2xl font-bold text-ink mt-1">
                  {va}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  a.n. PT. Manggala Utama Indonesia
                </p>
              </div>
              <Button variant="secondary" onClick={copy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Disalin
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Salin
                  </>
                )}
              </Button>
            </div>
          </>
        ) : null}

        {method === "qris" ? (
          <>
            <CardTitle>Scan QRIS</CardTitle>
            <div className="mt-4 grid place-items-center">
              <div className="h-56 w-56 rounded-3xl border-2 border-dashed border-border grid place-items-center bg-slate-50">
                <QrCode className="h-32 w-32 text-ink-muted" />
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                Scan dengan aplikasi e-wallet atau mobile banking
              </p>
            </div>
          </>
        ) : null}

        {method === "ewallet" ? (
          <>
            <CardTitle>Pilih E-Wallet</CardTitle>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {ewallets.map((e) => (
                <button
                  key={e}
                  onClick={() => setEwallet(e)}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-center font-semibold text-ink transition",
                    ewallet === e
                      ? "border-primary bg-primary-50/60 shadow-ring"
                      : "border-border hover:border-primary-200"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
            {ewallet ? (
              <p className="text-xs text-ink-muted mt-3">
                Aplikasi {ewallet} akan terbuka di langkah berikutnya.
              </p>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Rincian Pembayaran</CardTitle>
        <div className="mt-4 divide-y divide-border">
          <Row label="Cicilan pokok" value={formatIDR(2750000)} />
          <Row label="Biaya admin" value={formatIDR(0)} />
          <Row label="Total" value={formatIDR(2750000)} bold />
        </div>
      </Card>

      <Button
        block
        size="lg"
        onClick={() => setConfirmOpen(true)}
        disabled={method === "ewallet" && !ewallet}
      >
        <CreditCard className="h-4 w-4" /> Saya Sudah Bayar
      </Button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Konfirmasi pembayaran"
        description="Sistem akan memvalidasi pembayaran dengan partner payment. Anda akan menerima notifikasi setelah terkonfirmasi."
      >
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <Row label="Metode" value={method.toUpperCase()} />
          <Row label="Total" value={formatIDR(amount)} bold />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Memvalidasi…" : "Konfirmasi"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={success}
        onClose={() => {
          setSuccess(false);
          router.push("/installments");
        }}
        title="Pembayaran berhasil"
        description="Cicilan ke-3 telah tercatat. Lanjutkan jaga track record Anda."
      >
        <div className="text-center py-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald/10 grid place-items-center">
            <Check className="h-8 w-8 text-emerald" />
          </div>
          <p className="mt-4 text-2xl font-bold text-ink">{formatIDR(amount)}</p>
          <p className="text-sm text-ink-muted mt-1">
            Receipt dikirim ke email Anda
          </p>
        </div>
        <Button
          block
          onClick={() => {
            setSuccess(false);
            router.push("/installments");
          }}
        >
          Lihat Cicilan
        </Button>
      </Modal>
    </div>
  );
}

function MethodCard({
  active,
  onClick,
  Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  Icon: any;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-3xl p-4 border-2 text-left transition-all",
        active
          ? "border-primary bg-primary-50/50 shadow-ring"
          : "border-border bg-white hover:border-primary-200"
      )}
    >
      <Icon
        className={cn(
          "h-6 w-6 mb-2",
          active ? "text-primary" : "text-ink-muted"
        )}
      />
      <p className="font-semibold text-ink">{title}</p>
      <p className="text-xs text-ink-muted mt-0.5">{desc}</p>
    </button>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span
        className={cn("text-sm", bold ? "font-bold text-ink" : "font-medium")}
      >
        {value}
      </span>
    </div>
  );
}
