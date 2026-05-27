"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stepper } from "@/components/user/stepper";
import { customer } from "@/lib/client";
import { getApply, clearApply } from "@/lib/apply-store";
import { formatIDR } from "@/lib/utils";

export default function ApprovalPage() {
  const [app, setAppData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const a = getApply();
    if (!a.applicationId) {
      setLoading(false);
      return;
    }
    customer.application(a.applicationId).then((res) => {
      setLoading(false);
      if (res.ok) setAppData(res.data);
    });
    // Cleanup the apply store after we've shown confirmation.
    setTimeout(() => clearApply(), 5000);
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="skeleton h-32" />
        <div className="skeleton h-40" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <p className="text-ink">Tidak ada pengajuan aktif.</p>
          <Link href="/apply">
            <Button className="mt-4">Mulai Pengajuan</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const status = app.application.status;
  const isApproved = status === "approved" || status === "dp_pending";
  const isRejected = status === "rejected";
  const isPending =
    status === "pending" || status === "manual_review";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Stepper current={4} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card-base text-center p-10"
      >
        {isApproved ? (
          <>
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald/10 grid place-items-center">
              <CheckCircle2 className="h-10 w-10 text-emerald" />
            </div>
            <h1 className="text-page font-bold text-ink mt-5">
              Pengajuan Disetujui
            </h1>
            <p className="text-ink-muted mt-2">
              Selamat! Pengajuan Anda telah disetujui.
            </p>
          </>
        ) : isRejected ? (
          <>
            <div className="mx-auto h-20 w-20 rounded-full bg-danger/10 grid place-items-center">
              <XCircle className="h-10 w-10 text-danger" />
            </div>
            <h1 className="text-page font-bold text-ink mt-5">
              Pengajuan Ditolak
            </h1>
            <p className="text-ink-muted mt-2">
              {app.application.rejectReason ??
                "Mohon maaf, pengajuan tidak dapat dilanjutkan."}
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald/10 grid place-items-center">
              <CheckCircle2 className="h-10 w-10 text-emerald" />
            </div>
            <h1 className="text-page font-bold text-ink mt-5">
              Pengajuan Diterima
            </h1>
            <p className="text-ink-muted mt-2">
              Tim kami akan review dalam waktu kurang dari 30 menit.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-warning/10 text-warning px-4 py-2 font-semibold text-sm">
              <Clock className="h-4 w-4" /> Menunggu review
            </div>
          </>
        )}
      </motion.div>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Ringkasan Pengajuan</CardTitle>
          <Badge tone="primary">{app.application.id}</Badge>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <Row label="Produk" value={app.product?.title ?? "—"} />
          <Row label="Total Pembiayaan" value={formatIDR(app.application.total)} />
          <Row label="Tenor" value={`${app.application.tenor} bulan`} />
          <Row label="DP" value={formatIDR(app.application.dpAmount)} />
          <Row label="Cicilan / bulan" value={formatIDR(app.application.monthly)} />
          <Row
            label="Risk Grade"
            value={`${app.application.riskGrade ?? "-"} (${
              app.application.riskScore ?? "-"
            })`}
          />
        </div>
      </Card>

      {isApproved ? (
        <Card className="bg-primary-50/40 border-primary-100">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-2xl bg-primary text-white grid place-items-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-ink">
                {app.application.dpRequired
                  ? "Bayar DP untuk lanjut pemrosesan"
                  : "Tim kami akan segera membeli barangnya"}
              </p>
              <ol className="mt-2 space-y-1.5 text-sm text-ink-muted list-decimal list-inside">
                {app.application.dpRequired ? (
                  <li>Bayar DP via VA / QRIS</li>
                ) : null}
                <li>Tim internal beli, QC, & antarkan</li>
                <li>Verified delivery (foto + GPS + TTD)</li>
                <li>Cicilan dimulai setelah barang diterima</li>
              </ol>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="flex gap-3">
        <Link href="/dashboard" className="flex-1">
          <Button variant="secondary" block>
            Ke Beranda
          </Button>
        </Link>
        {isApproved && app.application.dpRequired ? (
          <Link
            href={`/payments?applicationId=${app.application.id}`}
            className="flex-1"
          >
            <Button block>
              Bayar DP <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/installments" className="flex-1">
            <Button block>
              Lihat Cicilan <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
