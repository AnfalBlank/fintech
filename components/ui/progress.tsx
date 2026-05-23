import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  tone = "primary",
}: {
  value: number;
  className?: string;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const tones = {
    primary: "bg-primary",
    success: "bg-emerald",
    warning: "bg-warning",
    danger: "bg-danger",
  } as const;
  return (
    <div
      className={cn(
        "h-2 w-full bg-slate-100 rounded-full overflow-hidden",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
