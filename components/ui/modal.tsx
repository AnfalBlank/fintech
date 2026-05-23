"use client";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center p-4 bg-ink/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full bg-card rounded-3xl shadow-float border border-border max-h-[92vh] overflow-y-auto",
          widths[size]
        )}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 h-9 w-9 rounded-xl grid place-items-center hover:bg-slate-100 text-ink-muted z-10"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6 pb-4 border-b border-border">
          <h3 className="text-cardtitle font-semibold text-ink pr-10">
            {title}
          </h3>
          {description ? (
            <p className="text-sm text-ink-muted mt-1.5">{description}</p>
          ) : null}
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
