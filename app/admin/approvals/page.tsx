"use client";
import { useEffect, useMemo, useState } from "react";
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
import { admin } from "@/lib/client";
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
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [action, setAction] = useState<ActionType>(null);
  const [reason, setReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const res = await admin.applications();
    setLoading(false);
    if (!res.ok) return toast.danger("Gagal memuat", res.error);
    setItems(res.data.items);
    if (!selectedId && res.data.items[0]) {
      setSelectedId(res.data.items[0].app.id);
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    admin.applications().then(() => {});
    fetch(`/api/applications/${selectedId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setDetail(j.data);
      });
  }, [selectedId]);

  const list = useMemo(
    () =>
      filter === "all"
        ? items
        : items.filter((i) => i.app.status === filter),
    [items, filter]
  );

  const selected = list.find((x) => x.app.id === selectedId) ?? list[0];

  const confirmAction = async () => {
    if (!selected) return;
    const id = selected.app.id;
    if (action === "reject" && reason.trim().length < 5) {
      return toast.warning("Reason minimal 5 karakter");
    }
    const res = await admin.decide(
      id,
      action!,
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

  if (loading) return <div className="skeleton h-96" />;

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
            {list.map((row) => {
              const a = row.app;
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
                      src={row.product?.imageUrl}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 justify-between">
                        <p className="font-semibold text-ink truncate text-sm">
                          {row.user?.name}
                        </p>
                        {a.riskGrade ? (
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
                        ) : null}
                      </div>
                      <p className="text-xs text-ink-muted truncate">
                        {row.product?.title}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <p className="text-sm font-semibold text-primary">
                          {formatIDR(a.total)}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {formatDate(new Date(a.submittedAt))}
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

        {selected ? (
          <div className="space-y-5">
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  <img
                    src={selected.product?.imageUrl}
                    alt=""
                    className="h-20 w-20 rounded-2xl object-cover bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-xs text-ink-muted">
                        {selected.app.id}
                      </p>
                      <a
                        href={`/admin/applications/${selected.app.id}`}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Buka detail page →
                      </a>
                    </div>
                    <p className="text-cardtitle font-bold text-ink">
                      {selected.product?.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge tone="muted">{selected.product?.marketplace}</Badge>
                      <Badge tone="muted">{selected.product?.category}</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-muted">Harga produk</p>
                  <p className="text-section font-bold text-ink">
                    {formatIDR(selected.product?.price ?? 0)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Mini label="Tenor" value={`${selected.app.tenor} bln`} />
                <Mini label="DP" value={formatIDR(selected.app.dpAmount)} />
                <Mini label="Cicilan/bln" value={formatIDR(selected.app.monthly)} />
                <Mini label="Total" value={formatIDR(selected.app.total)} />
              </div>
            </Card>

            <div className="grid lg:grid-cols-2 gap-5">
              <Card>
                <CardTitle>Profil User</CardTitle>
                <div className="mt-4 space-y-3">
                  <Info
                    Icon={UserIcon}
                    label={selected.user?.name ?? "—"}
                    sub={`Trust Level ${selected.user?.trustLevel ?? 1}`}
                  />
                  <Info Icon={Phone} label={selected.user?.phone ?? "—"} />
                  <Info Icon={MapPin} label={selected.user?.city ?? "—"} />
                  <Info
                    Icon={Building2}
                    label={detail?.user?.occupation ?? "—"}
                    sub={
                      detail?.user?.income
                        ? `Penghasilan ${formatIDR(detail.user.income)}`
                        : undefined
                    }
                  />
                </div>
              </Card>

              <Card>
                <CardTitle>Risk Score</CardTitle>
                <div className="mt-4 flex items-center gap-5">
                  <RiskCircle
                    score={selected.app.riskScore ?? 0}
                    grade={selected.app.riskGrade ?? "C"}
                  />
                  <div className="flex-1 space-y-2">
                    <ScoreRow label="Penghasilan (25%)" pct={detail?.risk?.income ?? 0} />
                    <ScoreRow label="Pekerjaan (20%)" pct={detail?.risk?.occupation ?? 0} />
                    <ScoreRow label="Kategori (20%)" pct={detail?.risk?.category ?? 0} />
                    <ScoreRow label="DP (15%)" pct={detail?.risk?.dp ?? 0} />
                    <ScoreRow label="Lokasi (10%)" pct={detail?.risk?.location ?? 0} />
                    <ScoreRow label="Device (10%)" pct={detail?.risk?.deviceTrust ?? 0} />
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
                disabled={
                  selected.app.status === "approved" ||
                  selected.app.status === "rejected"
                }
                onClick={() => setAction("reject")}
              >
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={
                  selected.app.status === "approved" ||
                  selected.app.status === "rejected"
                }
                onClick={() => setAction("hold")}
              >
                Tahan untuk Supervisor
              </Button>
              <Button
                variant="success"
                className="flex-1"
                disabled={
                  selected.app.status === "approved" ||
                  selected.app.status === "rejected"
                }
                onClick={() => setAction("approve")}
              >
                <Check className="h-4 w-4" /> Approve
              </Button>
            </div>
          </div>
        ) : null}
      </div>

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
            ? `${selected?.app.id} akan disetujui dan masuk flow DP/checkout.`
            : action === "reject"
              ? `${selected?.app.id} akan ditolak. Mohon isi alasan penolakan.`
              : `${selected?.app.id} akan diteruskan ke supervisor.`
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

      <Modal
        open={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        title={`Preview ${previewDoc}`}
        description="Dokumen ter-encrypt, hanya admin approval yang dapat melihat."
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
