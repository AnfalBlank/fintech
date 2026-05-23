"use client";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  FileText,
  Phone,
  ShieldCheck,
  X,
  MapPin,
  Building2,
  User as UserIcon,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { applications as initialApps } from "@/lib/mock-data";
import type { Application } from "@/lib/mock-data";
import { formatIDR, formatDate, cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Pending" },
  { key: "manual_review", label: "Manual Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

type ActionType = "approve" | "reject" | "hold" | null;

export default function ApprovalsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Application[]>(initialApps);
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [selectedId, setSelectedId] = useState<string>(initialApps[0].id);
  const [action, setAction] = useState<ActionType>(null);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const list = useMemo(
    () =>
      filter === "all" ? items : items.filter((a) => a.status === filter),
    [items, filter]
  );

  const selected = items.find((a) => a.id === selectedId) ?? items[0];

  const updateStatus = (
    id: string,
    status: Application["status"],
    note?: string
  ) => {
    setItems((s) =>
      s.map((a) => (a.id === id ? { ...a, status } : a))
    );
    if (status === "approved") {
      toast.success("Pengajuan disetujui", `${id} berhasil disetujui`);
    } else if (status === "rejected") {
      toast.danger(
        "Pengajuan ditolak",
        note ? `Alasan: ${note}` : `${id} telah ditolak`
      );
    } else {
      toast.info(
        "Diteruskan ke Supervisor",
        `${id} menunggu review supervisor`
      );
    }
  };

  const confirmAction = () => {
    if (!selected) return;
    if (action === "approve") {
      updateStatus(selected.id, "approved");
    } else if (action === "reject") {
      updateStatus(selected.id, "rejected", reason);
    } else if (action === "hold") {
      updateStatus(selected.id, "manual_review");
    }
    setAction(null);
    setReason("");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-page font-bold text-ink">Approval Center</h1>
        <p className="text-ink-muted mt-1">
          Review pengajuan, lihat dokumen & risk score, lalu approve atau reject.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "h-9 px-4 rounded-2xl text-sm font-semibold transition-colors",
              filter === f.key
                ? "bg-primary text-white"
                : "bg-white border border-border text-ink-muted hover:bg-slate-50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-5">
        {/* Left: list */}
        <Card className="p-0 overflow-hidden h-[720px] flex flex-col">
          <div className="px-5 py-4 border-b border-border bg-slate-50">
            <p className="text-sm font-semibold text-ink">
              {list.length} pengajuan
            </p>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-border">
            {list.length === 0 ? (
              <li className="p-8 text-center text-sm text-ink-muted">
                Tidak ada pengajuan pada filter ini.
              </li>
            ) : null}
            {list.map((a) => {
              const active = a.id === selectedId;
              return (
                <li key={a.id}>
                  <button
                    onClick={() => setSelectedId(a.id)}
                    className={cn(
                      "w-full text-left p-4 flex gap-3 transition-colors",
                      active ? "bg-primary-50/60" : "hover:bg-slate-50"
                    )}
                  >
                    <img
                      src={a.product.image}
                      alt={a.product.title}
                      className="h-12 w-12 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 justify-between">
                        <p className="font-semibold text-ink truncate text-sm">
                          {a.user.name}
                        </p>
                        <Badge
                          tone={
                            a.riskGrade === "A"
                              ? "success"
                              : a.riskGrade === "B"
                                ? "primary"
                                : a.riskGrade === "C"
                                  ? "warning"
                                  : "danger"
                          }
                        >
                          {a.riskGrade}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-muted truncate">
                        {a.product.title}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <p className="text-sm font-semibold text-primary">
                          {formatIDR(a.total || a.product.price)}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {formatDate(a.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-ink-muted self-center" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Right: detail */}
        <div className="space-y-5">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4 flex-1 min-w-0">
                <img
                  src={selected.product.image}
                  alt={selected.product.title}
                  className="h-20 w-20 rounded-2xl object-cover bg-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-ink-muted">
                      {selected.id}
                    </p>
                    <StatusInlineBadge status={selected.status} />
                  </div>
                  <p className="text-cardtitle font-bold text-ink">
                    {selected.product.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone="muted">{selected.product.marketplace}</Badge>
                    <Badge tone="muted">{selected.product.category}</Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-muted">Harga produk</p>
                <p className="text-section font-bold text-ink">
                  {formatIDR(selected.product.price)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Mini label="Tenor" value={`${selected.tenor} bln`} />
              <Mini label="DP" value={formatIDR(selected.dp)} />
              <Mini label="Cicilan/bln" value={formatIDR(selected.monthly)} />
              <Mini label="Total" value={formatIDR(selected.total)} />
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-5">
            <Card>
              <CardTitle>Profil User</CardTitle>
              <div className="mt-4 space-y-3">
                <Info
                  Icon={UserIcon}
                  label={selected.user.name}
                  sub={`Trust Level ${selected.user.trustLevel}`}
                />
                <Info Icon={Phone} label={selected.user.phone} />
                <Info Icon={MapPin} label={selected.user.city} />
                <Info
                  Icon={Building2}
                  label="Karyawan Tetap"
                  sub="Penghasilan Rp 12.000.000"
                />
              </div>
            </Card>

            <Card>
              <CardTitle>Risk Score</CardTitle>
              <div className="mt-4 flex items-center gap-5">
                <RiskCircle
                  score={selected.riskScore}
                  grade={selected.riskGrade}
                />
                <div className="flex-1 space-y-2">
                  <ScoreRow label="Penghasilan (25%)" pct={82} />
                  <ScoreRow label="Pekerjaan (20%)" pct={75} />
                  <ScoreRow label="Kategori barang (20%)" pct={88} />
                  <ScoreRow label="DP (15%)" pct={70} />
                  <ScoreRow label="Lokasi (10%)" pct={84} />
                  <ScoreRow label="Device trust (10%)" pct={70} />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardTitle>Dokumen Verifikasi</CardTitle>
            <div className="mt-4 grid sm:grid-cols-4 gap-3">
              {["KTP", "Selfie", "Slip Gaji", "Rekening Koran"].map((d) => (
                <button
                  key={d}
                  onClick={() => setPreviewDoc(d)}
                  className="rounded-2xl border border-border p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50"
                >
                  <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary grid place-items-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-ink text-center">
                    {d}
                  </p>
                  <p className="text-xs text-emerald font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </p>
                </button>
              ))}
            </div>
          </Card>

          <div className="flex gap-3 sticky bottom-4">
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => setAction("reject")}
              disabled={
                selected.status === "approved" ||
                selected.status === "rejected"
              }
            >
              <X className="h-4 w-4" /> Reject
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setAction("hold")}
              disabled={
                selected.status === "approved" ||
                selected.status === "rejected"
              }
            >
              Tahan untuk Supervisor
            </Button>
            <Button
              variant="success"
              className="flex-1"
              onClick={() => setAction("approve")}
              disabled={
                selected.status === "approved" ||
                selected.status === "rejected"
              }
            >
              <Check className="h-4 w-4" /> Approve
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm action modal */}
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
              : "Tahan untuk Supervisor"
        }
        description={
          action === "approve"
            ? `Pengajuan ${selected.id} akan disetujui dan masuk ke flow DP/checkout.`
            : action === "reject"
              ? `Pengajuan ${selected.id} akan ditolak. Mohon isi alasan penolakan.`
              : `Pengajuan ${selected.id} akan diteruskan ke supervisor.`
        }
      >
        {action === "reject" ? (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Alasan penolakan…"
            className="input-base h-auto py-3"
          />
        ) : null}
        <div className="mt-4 flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setAction(null);
              setReason("");
            }}
          >
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
            disabled={action === "reject" && reason.trim().length < 5}
            onClick={confirmAction}
          >
            Konfirmasi
          </Button>
        </div>
      </Modal>

      {/* Document preview modal */}
      <Modal
        open={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        title={`Preview ${previewDoc}`}
        description="Dokumen ter-encrypt AES, hanya admin approval yang dapat melihat."
        size="lg"
      >
        <div className="aspect-video bg-slate-100 rounded-2xl grid place-items-center">
          <div className="text-center">
            <FileText className="h-12 w-12 text-ink-muted mx-auto" />
            <p className="text-sm text-ink-muted mt-3">
              Pratinjau {previewDoc} (mock)
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setPreviewDoc(null)}>
            Tutup
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function StatusInlineBadge({ status }: { status: Application["status"] }) {
  const map: Record<Application["status"], { tone: any; label: string }> = {
    pending: { tone: "warning", label: "Pending" },
    manual_review: { tone: "info", label: "Manual Review" },
    approved: { tone: "success", label: "Approved" },
    rejected: { tone: "danger", label: "Rejected" },
    delivered: { tone: "success", label: "Delivered" },
    active: { tone: "primary", label: "Active" },
  };
  const m = map[status];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="font-bold text-ink mt-1">{value}</p>
    </div>
  );
}

function Info({
  Icon,
  label,
  sub,
}: {
  Icon: any;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-slate-100 grid place-items-center text-ink-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink truncate">{label}</p>
        {sub ? <p className="text-xs text-ink-muted">{sub}</p> : null}
      </div>
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

function RiskCircle({
  score,
  grade,
}: {
  score: number;
  grade: "A" | "B" | "C" | "D";
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const tone =
    grade === "A"
      ? "stroke-emerald"
      : grade === "B"
        ? "stroke-primary"
        : grade === "C"
          ? "stroke-warning"
          : "stroke-danger";
  return (
    <div className="relative">
      <svg className="h-32 w-32 -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth={10}
          className="stroke-slate-100 fill-none"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`fill-none ${tone}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-2xl font-bold text-ink">{score}</p>
          <p className="text-xs text-ink-muted">Grade {grade}</p>
        </div>
      </div>
    </div>
  );
}
