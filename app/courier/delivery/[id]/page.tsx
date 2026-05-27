"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  MapPin,
  Navigation,
  Phone,
  PenLine,
  QrCode,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { courier } from "@/lib/client";
import { formatDate, cn } from "@/lib/utils";

export default function CourierDeliveryPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [photos, setPhotos] = useState<string[]>([]);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [scanned, setScanned] = useState(false);
  const [signed, setSigned] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    courier.tasks().then((res) => {
      setLoading(false);
      if (res.ok) {
        const t = res.data.items.find((x: any) => x.d.id === params.id);
        if (t) setTask(t);
      }
    });
  }, [params.id]);

  if (loading) return <div className="skeleton h-96" />;
  if (!task) {
    return (
      <Card>
        <p className="text-center text-ink-muted">
          Tugas tidak ditemukan atau bukan untuk Anda.
        </p>
      </Card>
    );
  }
  const t = task.d;

  const photoLabels = ["User pegang barang", "Depan rumah", "Kurir + user"];

  const captureGps = () => {
    if (!navigator.geolocation) {
      const fallback = { lat: -6.1781, lng: 106.6298 };
      setGps(fallback);
      toast.success("GPS captured", `${fallback.lat}, ${fallback.lng}`);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGps(c);
        toast.success("GPS captured", `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`);
      },
      () => {
        const fallback = { lat: -6.1781, lng: 106.6298 };
        setGps(fallback);
        toast.success("GPS captured", "Fallback location");
      }
    );
  };

  const allDone =
    photos.length === 3 && gps !== null && scanned && signed;

  const submit = async () => {
    if (!gps) return;
    setSubmitted(true);
    const res = await courier.submitProof(t.id, {
      photos,
      gpsLat: gps.lat,
      gpsLng: gps.lng,
      signatureDataUrl: "data:image/png;base64,iVBORw0KGgo=",
      qrVerified: true,
    });
    setSubmitted(false);
    if (!res.ok) return toast.danger("Gagal", res.error);
    toast.success("Pengiriman selesai", `Proof ${t.id} terkirim`);
    router.push("/courier");
  };

  return (
    <div className="space-y-4">
      <Link
        href="/courier"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>

      <Card>
        <p className="text-xs text-ink-muted">Pengiriman {t.id}</p>
        <p className="text-cardtitle font-bold text-ink mt-1">
          {t.customerName}
        </p>
        <p className="text-sm text-ink-muted mt-0.5">{task.product?.title}</p>
        <div className="mt-3 space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-ink">{t.address}</span>
          </p>
          <p className="text-xs text-ink-muted">
            Jadwal: {formatDate(new Date(t.scheduledAt))}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={`tel:${(t.customerPhone ?? "").replace(/\s/g, "")}`}
            className="btn-secondary h-11 text-sm"
          >
            <Phone className="h-4 w-4" /> Telepon
          </a>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(t.address)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary h-11 text-sm"
          >
            <Navigation className="h-4 w-4" /> Navigasi
          </a>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Foto Bukti</CardTitle>
          <Badge tone={photos.length === 3 ? "success" : "warning"}>
            {photos.length}/3
          </Badge>
        </div>
        <p className="text-xs text-ink-muted mt-1">
          Foto user pegang barang, depan rumah, dan kurir + user.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photoLabels.map((lbl, i) => {
            const filled = i < photos.length;
            return (
              <button
                key={lbl}
                onClick={() => {
                  if (filled) return;
                  setPhotos((s) => [...s, `photo-${i}-${Date.now()}`]);
                  toast.success("Foto tersimpan", lbl);
                }}
                disabled={filled}
                className={cn(
                  "aspect-square rounded-2xl border-2 border-dashed grid place-items-center transition",
                  filled
                    ? "border-emerald bg-emerald/5"
                    : "border-border bg-slate-50 hover:border-primary"
                )}
              >
                {filled ? (
                  <Check className="h-7 w-7 text-emerald" />
                ) : (
                  <div className="text-center">
                    <Camera className="h-6 w-6 text-ink-muted mx-auto" />
                    <p className="text-[10px] text-ink-muted mt-1 px-2">{lbl}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>GPS Lokasi</CardTitle>
          <Badge tone={gps ? "success" : "warning"}>
            {gps ? "Captured" : "Pending"}
          </Badge>
        </div>
        {gps ? (
          <p className="mt-2 font-mono text-sm">
            {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
          </p>
        ) : null}
        <Button
          variant="secondary"
          block
          className="mt-3"
          onClick={captureGps}
          disabled={gps !== null}
        >
          <Navigation className="h-4 w-4" />
          {gps ? "Sudah di-capture" : "Capture GPS"}
        </Button>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Verifikasi User (QR)</CardTitle>
          <Badge tone={scanned ? "success" : "warning"}>
            {scanned ? "Verified" : "Pending"}
          </Badge>
        </div>
        <Button
          variant="secondary"
          block
          className="mt-3"
          onClick={() => setScanOpen(true)}
          disabled={scanned}
        >
          <QrCode className="h-4 w-4" />
          {scanned ? "Sudah ter-scan" : "Scan QR User"}
        </Button>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Tanda Tangan Digital</CardTitle>
          <Badge tone={signed ? "success" : "warning"}>
            {signed ? "Signed" : "Pending"}
          </Badge>
        </div>
        <Button
          variant="secondary"
          block
          className="mt-3"
          onClick={() => setSignOpen(true)}
          disabled={signed}
        >
          <PenLine className="h-4 w-4" />
          {signed ? "Sudah ditandatangani" : "Ambil Tanda Tangan"}
        </Button>
      </Card>

      <Button
        block
        size="lg"
        disabled={!allDone || submitted}
        onClick={submit}
      >
        <CheckCircle2 className="h-4 w-4" />
        {submitted ? "Mengirim…" : "Selesaikan Pengiriman"}
      </Button>

      <Modal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        title="Scan QR User"
      >
        <div className="aspect-square bg-slate-900 rounded-2xl grid place-items-center relative overflow-hidden">
          <div className="h-48 w-48 border-4 border-emerald rounded-2xl" />
          <div className="absolute h-1 w-48 bg-emerald/80 animate-pulse" />
        </div>
        <Button
          block
          className="mt-4"
          onClick={() => {
            setScanned(true);
            setScanOpen(false);
            toast.success("QR Verified");
          }}
        >
          Simulasikan Scan Berhasil
        </Button>
      </Modal>

      <Modal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        title="Tanda Tangan Digital"
      >
        <div
          onClick={() => {
            setSigned(true);
            setSignOpen(false);
            toast.success("Tanda tangan tersimpan");
          }}
          className="aspect-[2/1] rounded-2xl border-2 border-dashed border-border bg-slate-50 grid place-items-center cursor-pointer hover:border-primary"
        >
          <div className="text-center">
            <PenLine className="h-8 w-8 text-ink-muted mx-auto" />
            <p className="text-sm text-ink-muted mt-2">
              Tap untuk simulasi tanda tangan
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
