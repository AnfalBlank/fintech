import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  trend = "up",
  Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  Icon?: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const tones = {
    primary: "bg-primary-50 text-primary",
    success: "bg-emerald/10 text-emerald",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
  } as const;
  return (
    <div className="bg-card rounded-3xl border border-border shadow-soft p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted font-medium">{label}</p>
        {Icon ? (
          <div
            className={cn(
              "h-10 w-10 grid place-items-center rounded-2xl",
              tones[tone]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-[28px] font-bold tracking-tight text-ink">
        {value}
      </p>
      {delta ? (
        <div className="mt-1 flex items-center gap-1 text-xs font-medium">
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-danger" />
          )}
          <span
            className={cn(
              trend === "up" ? "text-emerald" : "text-danger",
              "font-semibold"
            )}
          >
            {delta}
          </span>
          <span className="text-ink-muted">vs bulan lalu</span>
        </div>
      ) : null}
    </div>
  );
}
