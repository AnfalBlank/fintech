"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2, Info, AlertTriangle, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "warning" | "danger";
type Toast = { id: number; tone: Tone; title: string; desc?: string };

type Ctx = {
  push: (t: Omit<Toast, "id">) => void;
  success: (title: string, desc?: string) => void;
  info: (title: string, desc?: string) => void;
  warning: (title: string, desc?: string) => void;
  danger: (title: string, desc?: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("useToast must be used inside <ToastProvider>");
  return c;
}

let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++_id;
    setItems((s) => [...s, { ...t, id }]);
    setTimeout(
      () => setItems((s) => s.filter((x) => x.id !== id)),
      3500
    );
  }, []);

  const value: Ctx = {
    push,
    success: (title, desc) => push({ tone: "success", title, desc }),
    info: (title, desc) => push({ tone: "info", title, desc }),
    warning: (title, desc) => push({ tone: "warning", title, desc }),
    danger: (title, desc) => push({ tone: "danger", title, desc }),
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,360px)]">
        {items.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onClose={() => setItems((s) => s.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const icon = {
    success: CheckCircle2,
    info: Info,
    warning: AlertTriangle,
    danger: XCircle,
  }[toast.tone];
  const Icon = icon;

  const tone = {
    success: "bg-emerald/10 text-emerald",
    info: "bg-primary-50 text-primary",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  }[toast.tone];

  return (
    <div
      role="status"
      className={cn(
        "card-base p-4 flex items-start gap-3 shadow-float transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-2xl grid place-items-center flex-shrink-0",
          tone
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink text-sm">{toast.title}</p>
        {toast.desc ? (
          <p className="text-xs text-ink-muted mt-0.5">{toast.desc}</p>
        ) : null}
      </div>
      <button
        onClick={onClose}
        className="text-ink-muted hover:text-ink"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
