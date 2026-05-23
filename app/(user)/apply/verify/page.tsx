"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Check,
  CreditCard,
  FileText,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Stepper } from "@/components/user/stepper";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type DocStatus = "pending" | "uploading" | "done";

export default function VerifyPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<"docs" | "personal">("docs");
  const [docs, setDocs] = useState<Record<string, DocStatus>>({
    ktp: "pending",
    selfie: "pending",
    payslip: "pending",
    bankstmt: "pending",
  });
  const [submitting, setSubmitting] = useState(false);
  const [consents, setConsents] = useState({
    agreement: false,
    signature: false,
    data: false,
  });

  const upload = (key: string) => {
    setDocs((d) => ({ ...d, [key]: "uploading" }));
    setTimeout(() => {
      setDocs((d) => ({ ...d, [key]: "done" }));
      toast.success("Dokumen terverifikasi", `${key.toUpperCase()} OK`);
    }, 900);
  };

  const allMandatoryDone = docs.ktp === "done" && docs.selfie === "done";
  const allConsents =
    consents.agreement && consents.signature && consents.data;

  const submit = async () => {
    if (!allConsents) {
      toast.warning("Persetujuan diperlukan", "Centang semua persetujuan.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    router.push("/apply/approval");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Stepper current={3} />
      <div>
        <h1 className="text-page font-bold text-ink">Verifikasi Data</h1>
        <p className="text-ink-muted mt-1.5">
          Untuk memverifikasi identitas dan kemampuan bayar Anda. Data dienkripsi
          AES & hanya digunakan untuk proses approval.
        </p>
      </div>

      {step === "docs" ? (
        <>
          <Card>
            <CardTitle>Dokumen Wajib</CardTitle>
            <p className="text-sm text-ink-muted mt-1">
              KTP dan selfie liveness untuk verifikasi identitas.
            </p>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <UploadCard
                Icon={CreditCard}
                title="Foto KTP"
                desc="Pastikan terbaca jelas"
                status={docs.ktp}
                onUpload={() => upload("ktp")}
              />
              <UploadCard
                Icon={Camera}
                title="Selfie + Liveness"
                desc="Wajah jelas, tanpa filter"
                status={docs.selfie}
                onUpload={() => upload("selfie")}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>Dokumen Pendukung (Opsional)</CardTitle>
            <p className="text-sm text-ink-muted mt-1">
              Dokumen pendukung mempercepat approval & menaikkan limit Anda.
            </p>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <UploadCard
                Icon={FileText}
                title="Slip Gaji"
                desc="3 bulan terakhir"
                status={docs.payslip}
                onUpload={() => upload("payslip")}
              />
              <UploadCard
                Icon={FileText}
                title="Rekening Koran"
                desc="3 bulan terakhir"
                status={docs.bankstmt}
                onUpload={() => upload("bankstmt")}
              />
            </div>
          </Card>

          <div className="flex gap-3">
            <Link href="/apply/simulate" className="flex-1">
              <Button variant="secondary" block>
                Kembali
              </Button>
            </Link>
            <Button
              block
              className="flex-1"
              disabled={!allMandatoryDone}
              onClick={() => setStep("personal")}
            >
              Lanjut <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <Card>
            <CardTitle>Data Pribadi & Pekerjaan</CardTitle>
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <Field label="Nama Lengkap" defaultValue="Rafi Aditya" />
              <Field label="No. KTP" defaultValue="3174021509980003" />
              <Field
                label="Alamat Domisili"
                className="sm:col-span-2"
                defaultValue="Jl. Kemang Selatan No. 12, Jakarta Selatan"
              />
              <Field label="Pekerjaan" defaultValue="Karyawan Tetap" />
              <Field label="Penghasilan / bln" defaultValue="Rp 12.000.000" />
              <Field
                label="Kontak Darurat (Nama)"
                defaultValue="Anita Suryani"
              />
              <Field label="Kontak Darurat (Telp)" defaultValue="+62 813-..." />
            </div>
          </Card>

          <Card className="bg-emerald/5 border-emerald/20">
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-emerald/10 text-emerald grid place-items-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink">
                  Data Anda aman & terenkripsi
                </p>
                <p className="text-sm text-ink-muted mt-1">
                  Hanya tim approval yang dapat mengakses dokumen Anda. Audit
                  log disimpan untuk setiap akses.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Persetujuan</CardTitle>
            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={consents.agreement}
                  onChange={(e) =>
                    setConsents({ ...consents, agreement: e.target.checked })
                  }
                  className="h-4 w-4 mt-0.5 rounded border-border accent-primary"
                />
                <span className="text-ink">
                  Saya menyetujui{" "}
                  <a href="#" className="text-primary font-semibold">
                    Perjanjian Cicilan Digital
                  </a>{" "}
                  Manggala.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={consents.signature}
                  onChange={(e) =>
                    setConsents({ ...consents, signature: e.target.checked })
                  }
                  className="h-4 w-4 mt-0.5 rounded border-border accent-primary"
                />
                <span className="text-ink">
                  Saya menyetujui penggunaan tanda tangan digital sebagai
                  pengganti tanda tangan basah.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={consents.data}
                  onChange={(e) =>
                    setConsents({ ...consents, data: e.target.checked })
                  }
                  className="h-4 w-4 mt-0.5 rounded border-border accent-primary"
                />
                <span className="text-ink">
                  Saya setuju Manggala memproses & memverifikasi data saya untuk
                  approval cicilan.
                </span>
              </label>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              block
              className="flex-1"
              onClick={() => setStep("docs")}
            >
              Kembali
            </Button>
            <Button
              block
              className="flex-1"
              disabled={submitting || !allConsents}
              onClick={submit}
            >
              {submitting ? "Mengirim…" : "Kirim Pengajuan"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function UploadCard({
  Icon,
  title,
  desc,
  status,
  onUpload,
}: {
  Icon: any;
  title: string;
  desc: string;
  status: DocStatus;
  onUpload: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onUpload}
      disabled={status === "uploading"}
      className={cn(
        "rounded-3xl border-2 border-dashed border-border bg-white p-5 text-left transition-all hover:border-primary hover:bg-primary-50/30",
        status === "done" &&
          "border-solid border-emerald bg-emerald/5 hover:bg-emerald/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-2xl grid place-items-center",
            status === "done"
              ? "bg-emerald/10 text-emerald"
              : "bg-primary-50 text-primary"
          )}
        >
          {status === "done" ? (
            <Check className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-ink">{title}</p>
          <p className="text-xs text-ink-muted mt-0.5">{desc}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold">
            {status === "done" ? (
              <span className="text-emerald">✓ Terverifikasi</span>
            ) : status === "uploading" ? (
              <span className="text-primary">Mengunggah…</span>
            ) : (
              <span className="text-primary inline-flex items-center gap-1">
                <Upload className="h-3.5 w-3.5" /> Klik untuk upload
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function Field({
  label,
  defaultValue,
  className,
}: {
  label: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} placeholder={label} />
    </div>
  );
}
