import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const stepLabels = ["Link", "Simulasi", "Verifikasi", "Approval"];

export function Stepper({ current }: { current: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {stepLabels.map((s, i) => {
        const idx = i + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "h-8 w-8 rounded-full grid place-items-center text-xs font-bold border-2",
                done && "bg-primary text-white border-primary",
                active && "bg-primary-50 text-primary border-primary",
                !done && !active && "bg-white text-ink-muted border-border"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : idx}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                active ? "text-ink" : "text-ink-muted"
              )}
            >
              {s}
            </span>
            {idx < stepLabels.length ? (
              <div className="h-px w-6 bg-border mx-1" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
