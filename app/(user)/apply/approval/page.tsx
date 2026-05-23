"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/utils";
import { Stepper } from "@/components/user/stepper";

export default function ApprovalPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Stepper current={4} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card-base text-center p-10"
      >
        <div className="mx-auto h-20 w-20 rounded-full bg-emerald/10 grid place-items-center">
          <CheckCircle2 className="h-10 w-10 text-emerald" />
        </div>
        <h1 className="text-page font-bold text-ink mt-5">
          Pengajuan Diterima
        </h1>
        <p className="text-ink-muted mt-2">
          Pengajuan Anda berhasil dikirim. Tim kami akan melakukan review dalam
          waktu kurang dari 30 menit.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-warning/10 text-warning px-4 py-2 font-semibold text-sm">
          <Clock className="h-4 w-4" /> Menunggu review (≈ 18 menit)
        </div>
      </motion.div>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Ringkasan Pengajuan</CardTitle>
          <Badge tone="primary">APP-2026-00231</Badge>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <Row label="Produk" value="iPhone 15 Pro 256GB" />
          <Row label="Total Pembiayaan" value={formatIDR(24700000)} />
          <Row label="Tenor" value="6 bulan" />
          <Row label="DP" value={formatIDR(3799800)} />
          <Row label="Cicilan / bulan" value={formatIDR(3500000)} />
        </div>
      </Card>

      <Card className="bg-primary-50/40 border-primary-100">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-2xl bg-primary text-white grid place-items-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-ink">Apa yang terjadi selanjutnya?</p>
            <ol className="mt-2 space-y-1.5 text-sm text-ink-muted list-decimal list-inside">
              <li>Tim approval kami review data Anda (~30 mnt)</li>
              <li>Anda dapat notifikasi WhatsApp & email</li>
              <li>Bayar DP via VA / QRIS jika disetujui</li>
              <li>Tim internal beli, QC, dan antarkan barang</li>
            </ol>
          </div>
        </div>
      </Card>

      <div className="flex gap-3">
        <Link href="/dashboard" className="flex-1">
          <Button variant="secondary" block>
            Ke Beranda
          </Button>
        </Link>
        <Link href="/payments" className="flex-1">
          <Button block>
            Bayar DP <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
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
