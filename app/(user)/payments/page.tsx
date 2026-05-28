"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Banknote,
  Check,
  Copy,
  CreditCard,
  Landmark,
  QrCode,
  Smartphone,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Empty } from "@/components/ui/empty";
import { useToast } from "@/components/ui/toast";
import { customer } from "@/lib/client";
import { formatIDR, cn } from "@/lib/utils";
import Link from "next/link";

type Method = "transfer" | "qris" | "va" | "ewallet";

const banks = ["BCA", "BNI", "Mandiri", "BRI"];
const ewallets = ["GoPay", "OVO", "Dana", "ShopeePay", "LinkAja", "Jenius"];

type PaymentConfig = {
  paymentMode: "manual" | "midtrans" | "mixed";
  bankAccounts: { bank: string; accountNumber: string; accountName: string; notes?: string }[];
  qrisStaticImageUrl: string;
  qrisMerchantName: string;
  qrisMerchantId: string;
  midtransClientKey: string;
  midtransProduction: boolean;
  eSignAutoEnabled: boolean;
};

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-96" />}>
      <PaymentsInner />
    </Suspense>
  );
}

function PaymentsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const applicationId = searchParams.get("applicationId");
  const installmentId = searchParams.get("installmentId");

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [method, setMethod] = useState<Method>("transfer");
  const [bank, setBank] = useState("BCA");
  const [ewallet, setEwallet] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [resolving, setResolving] = useState(true);
  const [intent, setIntent] = useState<any | null>(null);
  const [target, setTarget] = useState<{
    appId?: string;
    type: "dp" | "installment";
    amount: number;
    insId?: string;
    title: string;
  } | null>(null);

  // Fetch payment config first to set default method
  useEffect(() => {
    customer.paymentConfig().then((res) => {
      if (res.ok) {
        setConfig(res.data);
        if (res.data.paymentMode === "midtrans") setMethod("va");
        else setMethod("transfer");
      }
    });
  }, []);

  // Determine target on mount
  useEffect(() => {
    (async () => {
      try {
        if (applicationId) {
          const res = await customer.application(applicationId);
          if (!res.ok) return toast.danger("Gagal memuat", res.error);
          const app = res.data.application;
          if (installmentId) {
            const ins = res.data.installments.find(
              (i: any) => i.id === installmentId
            );
            if (ins)
              setTarget({
                appId: applicationId,
                type: "installment",
                amount: ins.amount + (ins.penaltyAmount ?? 0),
                insId: ins.id,
                title: `Cicilan ke-${ins.sequence}`,
              });
          } else if (app.dpRequired && app.status === "dp_pending") {
            setTarget({
              appId: applicationId,
              type: "dp",
              amount: app.dpAmount,
              title: "Down Payment",
            });
          } else {
            const ins = res.data.installments.find(
              (i: any) => i.status !== "paid"
            );
            if (ins)
              setTarget({
                appId: applicationId,
                type: "installment",
                amount: ins.amount + (ins.penaltyAmount ?? 0),
                insId: ins.id,
                title: `Cicilan ke-${ins.sequence}`,
              });
          }
        } else {
          const res = await customer.installments();
          if (res.ok) {
            const due = res.data.items.find((i: any) => i.ins.status !== "paid");
            if (due)
              setTarget({
                appId: due.app.id,
                type: "installment",
                amount: due.ins.amount + (due.ins.penaltyAmount ?? 0),
                insId: due.ins.id,
                title: `${due.product?.title ?? "Cicilan"} #${due.ins.sequence}`,
              });
          }
        }
      } finally {
        setResolving(false);
      }
    })();
  }, [applicationId, installmentId, toast]);

  // Countdown
  const [timeLeft, setTimeLeft] = useState(60 * 60 * 24);
  useEffect(() => {
    const t = setInterval(() => setTimeLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  if (resolving || !config) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="skeleton h-32" />
        <div className="skeleton h-40" />
      </div>
    );
  }

  if (!target) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <Empty
            Icon={CreditCard}
            title="Tidak ada pembayaran tertunda"
            description="Semua cicilan Anda sudah lunas atau belum waktunya bayar."
            action={
              <Link href="/installments">
                <Button variant="secondary">Lihat Cicilan</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  // Available methods based on mode
  const availableMethods: Method[] =
    config.paymentMode === "manual"
      ? ["transfer", "qris"]
      : config.paymentMode === "midtrans"
        ? ["va", "qris", "ewallet"]
        : ["transfer", "qris", "va", "ewallet"];

  const createIntent = async () => {
    if (!target.appId) return;
    setCreating(true);
    const res = await customer.createPayment({
      applicationId: target.appId,
      installmentId: target.insId,
      type: target.type,
      method,
      channel:
        method === "va"
          ? bank
          : method === "ewallet"
            ? ewallet ?? undefined
            : undefined,
      amount: target.amount,
    });
    setCreating(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    setIntent(res.data);
    toast.success("Instruksi pembayaran dibuat");
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Disalin");
    setTimeout(() => setCopied(null), 1500);
  };

  const confirm = async () => {
    if (!intent) return;
    setSubmitting(true);
    let res;
    if (method === "transfer" || method === "qris") {
      // Manual flow → claim, admin verifies later.
      res = await customer.claimPayment(intent.paymentId, {});
    } else {
      // Midtrans flow → real confirm comes via webhook; this endpoint is
      // admin-only, so customer-side just optimistically closes the modal.
      // We still hit the claim endpoint to record the intent.
      res = await customer.claimPayment(intent.paymentId, {});
    }
    setSubmitting(false);
    setConfirmOpen(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    setSuccess(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-page font-bold text-ink">Pembayaran</h1>
        <p className="text-ink-muted mt-1.5">{target.title}</p>
      </div>

      <Card className="bg-gradient-to-br from-primary-700 via-primary to-sky text-white p-7 shadow-float">
        <p className="text-sm opacity-90">Total Pembayaran</p>
        <p className="text-[40px] font-bold tracking-tight mt-1">
          {formatIDR(target.amount)}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold font-mono">
          <Timer className="h-4 w-4" />
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </div>
      </Card>

      <Card>
        <CardTitle>Pilih Metode Pembayaran</CardTitle>
        <div
          className="mt-4 grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${Math.min(availableMethods.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {availableMethods.includes("transfer") ? (
            <MethodCard
              active={method === "transfer"}
              onClick={() => {
                setMethod("transfer");
                setIntent(null);
              }}
              Icon={Landmark}
              title="Transfer"
              desc="Manual ke rekening bank"
            />
          ) : null}
          {availableMethods.includes("qris") ? (
            <MethodCard
              active={method === "qris"}
              onClick={() => {
                setMethod("qris");
                setIntent(null);
              }}
              Icon={QrCode}
              title="QRIS"
              desc="Scan QR statis / dinamis"
            />
          ) : null}
          {availableMethods.includes("va") ? (
            <MethodCard
              active={method === "va"}
              onClick={() => {
                setMethod("va");
                setIntent(null);
              }}
              Icon={Banknote}
              title="Virtual Account"
              desc="Otomatis (Midtrans)"
            />
          ) : null}
          {availableMethods.includes("ewallet") ? (
            <MethodCard
              active={method === "ewallet"}
              onClick={() => {
                setMethod("ewallet");
                setIntent(null);
              }}
              Icon={Smartphone}
              title="E-Wallet"
              desc="GoPay, OVO, Dana"
            />
          ) : null}
        </div>
      </Card>

      <Card>
        {/* Manual transfer */}
        {method === "transfer" ? (
          <>
            <CardTitle>Transfer Bank</CardTitle>
            <p className="text-sm text-ink-muted mt-1">
              Transfer sesuai nominal ke salah satu rekening berikut, lalu
              klik "Saya Sudah Bayar".
            </p>
            {intent ? (
              <div className="mt-4 space-y-3">
                {(intent.payload.bankAccounts as PaymentConfig["bankAccounts"]).map(
                  (b, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border p-4 flex items-center justify-between flex-wrap gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-ink-muted">{b.bank}</p>
                        <p className="font-mono text-xl font-bold text-ink mt-0.5">
                          {b.accountNumber}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          a.n. {b.accountName}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          copyText(
                            b.accountNumber.replace(/[\s-]/g, ""),
                            `bank-${idx}`
                          )
                        }
                      >
                        {copied === `bank-${idx}` ? (
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
                  )
                )}
                <div className="rounded-2xl bg-warning/10 border border-warning/20 p-3 text-xs text-ink">
                  <p className="font-semibold">Penting</p>
                  <ul className="mt-1 list-disc list-inside text-ink-muted space-y-0.5">
                    <li>
                      Transfer tepat sebesar{" "}
                      <span className="font-semibold text-ink">
                        {formatIDR(target.amount)}
                      </span>
                    </li>
                    <li>
                      Sertakan kode referensi{" "}
                      <span className="font-mono font-semibold text-ink">
                        {intent.referenceNo}
                      </span>{" "}
                      di berita transfer
                    </li>
                    <li>Konfirmasi akan diverifikasi admin maks 2 jam kerja</li>
                  </ul>
                </div>
              </div>
            ) : config.bankAccounts.length === 0 ? (
              <p className="mt-4 text-sm text-warning">
                Admin belum menambahkan rekening transfer. Hubungi support.
              </p>
            ) : (
              <Button
                block
                className="mt-4"
                onClick={createIntent}
                disabled={creating}
              >
                {creating ? "Memproses…" : "Tampilkan Rekening"}
              </Button>
            )}
          </>
        ) : null}

        {/* QRIS */}
        {method === "qris" ? (
          <>
            <CardTitle>QRIS</CardTitle>
            {intent ? (
              <div className="mt-4">
                {intent.payload.imageUrl ? (
                  <div className="grid place-items-center">
                    <img
                      src={intent.payload.imageUrl}
                      alt="QRIS"
                      className="h-64 w-64 rounded-3xl border border-border bg-white object-contain p-3"
                    />
                    <p className="mt-3 font-semibold">
                      {intent.payload.merchantName}
                    </p>
                    {intent.payload.merchantId ? (
                      <p className="text-xs text-ink-muted">
                        NMID: {intent.payload.merchantId}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid place-items-center">
                    <div className="h-56 w-56 rounded-3xl border-2 border-dashed border-border grid place-items-center bg-slate-50">
                      <QrCode className="h-32 w-32 text-ink-muted" />
                    </div>
                    <p className="mt-3 text-sm text-ink-muted">
                      QR akan generate dari Midtrans setelah pembayaran dipicu.
                    </p>
                  </div>
                )}
                <div className="mt-4 rounded-2xl bg-warning/10 border border-warning/20 p-3 text-xs text-ink">
                  Transfer{" "}
                  <span className="font-semibold">
                    {formatIDR(target.amount)}
                  </span>{" "}
                  · Ref{" "}
                  <span className="font-mono font-semibold">
                    {intent.referenceNo}
                  </span>
                </div>
              </div>
            ) : !config.qrisStaticImageUrl &&
              config.paymentMode !== "midtrans" ? (
              <p className="mt-4 text-sm text-warning">
                Admin belum upload QR static. Hubungi support.
              </p>
            ) : (
              <Button
                block
                className="mt-4"
                onClick={createIntent}
                disabled={creating}
              >
                {creating ? "Memproses…" : "Tampilkan QRIS"}
              </Button>
            )}
          </>
        ) : null}

        {/* Virtual Account (Midtrans) */}
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
                  onClick={() => {
                    setBank(b);
                    setIntent(null);
                  }}
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
            {intent ? (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-border p-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-ink-muted">Nomor VA</p>
                  <p className="font-mono text-2xl font-bold text-ink mt-1">
                    {intent.payload.vaNumber}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    a.n. {intent.payload.accountName}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    copyText(
                      String(intent.payload.vaNumber).replace(/-/g, ""),
                      "va"
                    )
                  }
                >
                  {copied === "va" ? (
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
            ) : !config.midtransClientKey ? (
              <p className="mt-4 text-sm text-warning">
                Midtrans belum dikonfigurasi. Hubungi admin.
              </p>
            ) : (
              <Button
                block
                className="mt-4"
                onClick={createIntent}
                disabled={creating}
              >
                {creating ? "Memproses…" : `Generate VA ${bank}`}
              </Button>
            )}
          </>
        ) : null}

        {/* E-wallet (Midtrans) */}
        {method === "ewallet" ? (
          <>
            <CardTitle>E-Wallet</CardTitle>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {ewallets.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setEwallet(e);
                    setIntent(null);
                  }}
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
            {intent ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
                <p className="text-ink-muted">Deeplink</p>
                <p className="font-mono text-ink break-all">
                  {intent.payload.deepLink}
                </p>
              </div>
            ) : !config.midtransClientKey ? (
              <p className="mt-4 text-sm text-warning">
                Midtrans belum dikonfigurasi. Hubungi admin.
              </p>
            ) : (
              <Button
                block
                className="mt-4"
                disabled={!ewallet || creating}
                onClick={createIntent}
              >
                {creating ? "Memproses…" : `Bayar dengan ${ewallet ?? "…"}`}
              </Button>
            )}
          </>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Rincian</CardTitle>
        <div className="mt-4 divide-y divide-border">
          <Row label={target.title} value={formatIDR(target.amount)} />
          <Row label="Biaya admin" value={formatIDR(0)} />
          <Row label="Total" value={formatIDR(target.amount)} bold />
        </div>
      </Card>

      <Button
        block
        size="lg"
        disabled={!intent}
        onClick={() => setConfirmOpen(true)}
      >
        <CreditCard className="h-4 w-4" /> Saya Sudah Bayar
      </Button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Konfirmasi pembayaran"
        description={
          method === "transfer" || method === "qris"
            ? "Pembayaran akan diverifikasi manual oleh admin (maks 2 jam kerja)."
            : "Sistem akan memvalidasi via gateway. Anda akan dapat notifikasi setelah terkonfirmasi."
        }
      >
        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <Row label="Metode" value={method.toUpperCase()} />
          <Row label="Total" value={formatIDR(target.amount)} bold />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Batal
          </Button>
          <Button onClick={confirm} disabled={submitting}>
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
        title="Pembayaran terkirim"
        description={
          method === "transfer" || method === "qris"
            ? "Tim Manggala akan verifikasi transfer Anda dalam 2 jam kerja."
            : "Pembayaran terkonfirmasi otomatis."
        }
      >
        <div className="text-center py-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald/10 grid place-items-center">
            <Check className="h-8 w-8 text-emerald" />
          </div>
          <p className="mt-4 text-2xl font-bold text-ink">
            {formatIDR(target.amount)}
          </p>
        </div>
        <div className="space-y-2">
          {intent?.paymentId ? (
            <a
              href={`/api/payments/${intent.paymentId}/invoice`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary block text-center h-11"
            >
              Download Receipt PDF
            </a>
          ) : null}
          <Button
            block
            onClick={() => {
              setSuccess(false);
              router.push("/installments");
            }}
          >
            Lihat Cicilan
          </Button>
        </div>
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
