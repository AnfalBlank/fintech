"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileText,
  PackageCheck,
  Phone,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { admin } from "@/lib/client";
import { formatIDR, formatDate, cn } from "@/lib/utils";

export default function AdminApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const toast = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"approve" | "reject" | "hold" | null>(
    null
  );
  const [reason, setReason] = useState("");

  const refresh = async () => {
    setLoading(true);
    const res = await admin.application(params.id);
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    setData(res.data);
  };
  useEffect(() => {
    refresh();
  }, [params.id]);

  if (loading) return <div className="skeleton h-96" />;
  if (!data) return <Card><p className="text-center text-ink-muted">Tidak ditemukan</p></Card>;

  const { application: app, product, user, risk, installments, payments, deliveries, asset } = data;
  const decided = app.status === "approved" || app.status === "rejected";

  const decide = async () => {
    if (!action) return;
    if (action === "reject" && reason.trim().length < 5)
      return toast.warning("Alasan minimal 5 karakter");
    const res = await admin.decide(
      app.id,
      action,
      action === "reject" ? reason : undefined
    );
    if (!res.ok) return toast.danger("Gagal", res.error);
    if (action === "approve") toast.success("Disetujui");
    else if (action === "reject") toast.danger("Ditolak");
    else toast.info("Diteruskan ke supervisor");
    setAction(null);
    setReason("");
    refresh();
  };

  const paid = payments.filter((p: any) => p.status === "paid");

  return (
    <div className="space-y-5">
      <Link
        href="/admin/approvals"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Approval Center
      </Link>

      {/* Header */}
      <Card>
        <div className="flex items-start gap-4 flex-wrap">
          {product?.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              className="h-24 w-24 rounded-2xl object-cover bg-slate-100"
            />
          ) : null}
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-ink-muted">{app.id}</p>
            <p className="text-cardtitle font-bold text-ink">
              {product?.title}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Badge tone="muted">{product?.marketplace}</Badge>
              <Badge tone="muted">{product?.category}</Badge>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-sm text-ink-muted mt-2">
              Submitted {formatDate(new Date(app.submittedAt))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-muted">Total Pembiayaan</p>
            <p className="text-section font-bold text-ink">
              {formatIDR(app.total)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-4 gap-3">
          <Mini label="Tenor" value={`${app.tenor} bln`} />
          <Mini label="DP" value={formatIDR(app.dpAmount)} />
          <Mini label="Cicilan/bln" value={formatIDR(app.monthly)} />
          <Mini
            label="Risk"
            value={`${app.riskGrade ?? "-"} (${app.riskScore ?? "-"})`}
          />
        </div>
      </Card>

      {/* User + Risk + Documents */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle>Profil Pemohon</CardTitle>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Nama" value={user?.name ?? "—"} />
            <Row label="HP" value={user?.phone ?? "—"} />
            <Row label="Email" value={user?.email ?? "—"} />
            <Row label="Trust" value={`Level ${user?.trustLevel ?? 1}`} />
            <Row label="Pekerjaan" value={user?.occupation ?? "—"} />
            <Row
              label="Penghasilan"
              value={user?.income ? formatIDR(user.income) : "—"}
            />
            <Row label="Kota" value={user?.city ?? "—"} />
            <Row label="Alamat" value={user?.address ?? "—"} />
            <Row label="No. KTP" value={user?.ktpNumber ?? "—"} />
          </div>
          <Link
            href={`/admin/customers/${user?.id ?? ""}`}
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-semibold"
          >
            Lihat profil lengkap →
          </Link>
        </Card>

        <Card>
          <CardTitle>Risk Score</CardTitle>
          {risk ? (
            <div className="mt-4 space-y-2">
              <ScoreRow label="Penghasilan (25%)" pct={risk.income} />
              <ScoreRow label="Pekerjaan (20%)" pct={risk.occupation} />
              <ScoreRow label="Kategori (20%)" pct={risk.category} />
              <ScoreRow label="DP (15%)" pct={risk.dp} />
              <ScoreRow label="Lokasi (10%)" pct={risk.location} />
              <ScoreRow label="Device (10%)" pct={risk.deviceTrust} />
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 flex justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-bold text-ink">
                  {risk.total} ({risk.grade})
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-muted mt-3">Tidak ada risk score</p>
          )}
        </Card>
      </div>

      {/* Asset + Delivery */}
      {asset || deliveries.length > 0 ? (
        <div className="grid lg:grid-cols-2 gap-5">
          {asset ? (
            <Card>
              <CardTitle>Asset</CardTitle>
              <div className="mt-3 space-y-1 text-sm">
                <Row label="Asset ID" value={asset.id} />
                <Row label="Status" value={asset.status} />
                <Row label="QC" value={asset.qcStatus} />
                <Row label="Serial/IMEI" value={asset.imeiOrSerial ?? "—"} />
                <Row
                  label="Invoice"
                  value={asset.purchaseInvoiceNo ?? "—"}
                />
              </div>
            </Card>
          ) : null}
          {deliveries.length > 0 ? (
            <Card>
              <CardTitle>Delivery</CardTitle>
              {deliveries.map((d: any) => (
                <div key={d.id} className="mt-3 space-y-1 text-sm">
                  <Row label="ID" value={d.id} />
                  <Row label="Status" value={d.status} />
                  <Row
                    label="Schedule"
                    value={formatDate(new Date(d.scheduledAt))}
                  />
                </div>
              ))}
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Installments + Payments */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle>Installments ({installments.length})</CardTitle>
          {installments.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Schedule belum dibuat (belum delivered).
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {installments.map((i: any) => (
                <li key={i.id} className="flex justify-between py-2">
                  <span>
                    #{i.sequence} ·{" "}
                    {i.paidAt ? formatDate(new Date(i.paidAt)) : formatDate(new Date(i.dueDate))}
                  </span>
                  <span className="font-semibold flex gap-2 items-center">
                    <span>{formatIDR(i.amount)}</span>
                    <Badge
                      tone={
                        i.status === "paid"
                          ? "success"
                          : i.status === "overdue"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {i.status}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Payments ({payments.length})</CardTitle>
          {payments.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Belum ada pembayaran.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {payments.map((p: any) => (
                <li key={p.id} className="flex justify-between py-2">
                  <div>
                    <p className="font-semibold">{p.type.toUpperCase()}</p>
                    <p className="text-xs text-ink-muted">
                      {p.method} · {p.referenceNo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatIDR(p.amount)}</p>
                    <Badge
                      tone={p.status === "paid" ? "success" : "warning"}
                    >
                      {p.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Decide */}
      {!decided ? (
        <div className="flex gap-3 sticky bottom-4">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => setAction("reject")}
          >
            <X className="h-4 w-4" /> Reject
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setAction("hold")}
          >
            Tahan untuk Supervisor
          </Button>
          <Button
            variant="success"
            className="flex-1"
            onClick={() => setAction("approve")}
          >
            <Check className="h-4 w-4" /> Approve
          </Button>
        </div>
      ) : null}

      <Modal
        open={action !== null}
        onClose={() => {
          setAction(null);
          setReason("");
        }}
        title={
          action === "approve"
            ? "Setujui pengajuan"
            : action === "reject"
              ? "Tolak pengajuan"
              : "Tahan untuk supervisor"
        }
      >
        {action === "reject" ? (
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Alasan…"
            className="input-base h-auto py-3"
          />
        ) : (
          <p className="text-sm text-ink-muted">
            Konfirmasi keputusan untuk <span className="font-mono">{app.id}</span>?
          </p>
        )}
        <div className="mt-4 flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setAction(null)}>
            Batal
          </Button>
          <Button
            variant={
              action === "approve"
                ? "success"
                : action === "reject"
                  ? "danger"
                  : "primary"
            }
            onClick={decide}
          >
            Konfirmasi
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="font-bold text-ink mt-1">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-ink-muted text-xs">{label}</span>
      <span className="font-medium text-ink text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function ScoreRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className="font-semibold text-ink">{pct}</span>
      </div>
      <div className="h-1.5 mt-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: any; label: string }> = {
    pending: { tone: "warning", label: "Pending" },
    manual_review: { tone: "info", label: "Manual Review" },
    approved: { tone: "success", label: "Approved" },
    rejected: { tone: "danger", label: "Rejected" },
    delivered: { tone: "success", label: "Delivered" },
    active: { tone: "primary", label: "Active" },
    completed: { tone: "success", label: "Completed" },
    purchasing: { tone: "info", label: "Purchasing" },
    warehouse: { tone: "info", label: "Warehouse" },
    delivering: { tone: "primary", label: "Delivering" },
    dp_pending: { tone: "warning", label: "DP Pending" },
  };
  const m = map[status] ?? { tone: "muted", label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
