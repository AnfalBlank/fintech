"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
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
import { courierTasks } from "@/lib/mock-data-extra";
import { formatDate, cn } from "@/lib/utils";

export default function CourierDeliveryPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const task = courierTasks.find((t) => t.id === params.id);
  if (!task) return notFound();

  const [photos, setPhotos] = useState<string[]>([]);
  const [gps, setGps] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [signed, setSigned] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const photoLabels = ["User pegang barang", "Depan rumah", "Kurir + user"];

  const captureGps = () => {
    if (!navigator.geolocation) {
      setGps("-6.1781, 106.6298");
      toast.success("GPS captured", "-6.1781, 106.6298");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        setGps(coord);
        toast.success("GPS captured", coord);
      },
      () => {
        setGps("-6.1781, 106.6298");
        toast.success("GPS captured", "-6.1781, 106.6298 (fallback)");
      }
    );
  };

  const allDone =
    photos.length === 3 && gps !== null && scanned && signed;

  const submit = async () => {
    setSubmitted(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Pengiriman selesai", `Proof ${task.id} berhasil dikirim`);
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

      {/* Customer card */}
      <Card>
        <p className="text-xs text-ink-muted">Pengiriman {task.id}</p>
        <p className="text-cardtitle font-bold text-ink mt-1">
          {task.customer}
        </p>
        <p className="text-sm text-ink-muted mt-0.5">{task.product}</p>
        <div className="mt-3 space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-ink">{task.address}</span>
          </p>
          <p className="text-xs text-ink-muted">
            Jadwal: {formatDate(task.scheduled)}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={`tel:${task.phone.replace(/\s/g, "")}`}
            className="btn-secondary h-11 text-sm"
          >
            <Phone className="h-4 w-4" /> Telepon
          </a>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(task.address)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary h-11 text-sm"
          >
            <Navigation className="h-4 w-4" /> Navigasi
          </a>
        </div>
      </Card>

      {/* Step 1: Photos */}
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
                  setPhotos((s) => [...s, `photo-${i}`]);
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
                    <p className="text-[10px] text-ink-muted mt-1 px-2">
                      {lbl}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Step 2: GPS */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>GPS Lokasi</CardTitle>
          <Badge tone={gps ? "success" : "warning"}>
            {gps ? "Captured" : "Pending"}
          </Badge>
        </div>
        {gps ? (
          <p className="mt-2 font-mono text-sm">{gps}</p>
        ) : (
          <p className="text-xs text-ink-muted mt-1">
            Pastikan Anda berada di lokasi pengiriman.
          </p>
        )}
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

      {/* Step 3: QR */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Verifikasi User (QR)</CardTitle>
          <Badge tone={scanned ? "success" : "warning"}>
            {scanned ? "Verified" : "Pending"}
          </Badge>
        </div>
        <p className="text-xs text-ink-muted mt-1">
          Minta user scan QR di aplikasi mereka.
        </p>
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

      {/* Step 4: Signature */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Tanda Tangan Digital</CardTitle>
          <Badge tone={signed ? "success" : "warning"}>
            {signed ? "Signed" : "Pending"}
          </Badge>
        </div>
        <p className="text-xs text-ink-muted mt-1">
          Mintakan tanda tangan user di kotak di bawah.
        </p>
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
        description="Arahkan kamera ke QR code di aplikasi user."
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
            toast.success("QR Verified", "User verified");
          }}
        >
          Simulasikan Scan Berhasil
        </Button>
      </Modal>

      <Modal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        title="Tanda Tangan Digital"
        description="Tap area di bawah untuk simulasi."
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
              Tap area ini untuk simulasi tanda tangan
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
