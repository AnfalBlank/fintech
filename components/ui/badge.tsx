import { cn } from "@/lib/utils";

export type BadgeTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "info";

const toneClass: Record<BadgeTone, string> = {
  primary: "bg-primary-50 text-primary-700",
  success: "bg-emerald/10 text-emerald",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  muted: "bg-slate-100 text-ink-muted",
  info: "bg-sky-100 text-sky-700",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
