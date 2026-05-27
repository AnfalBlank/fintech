import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<LogoSize, { px: number; box: string; radius: string }> = {
  sm: { px: 32, box: "h-8 w-8", radius: "rounded-xl" },
  md: { px: 36, box: "h-9 w-9", radius: "rounded-2xl" },
  lg: { px: 40, box: "h-10 w-10", radius: "rounded-2xl" },
  xl: { px: 64, box: "h-16 w-16", radius: "rounded-3xl" },
};

/**
 * Brand logo — uses /public/logofintech.png with object-cover container so it
 * works at any aspect ratio. Container has the brand fill so the rounded box
 * still reads as a logo even on dark/light backgrounds.
 */
export function Logo({
  size = "md",
  variant = "primary",
  className,
}: {
  size?: LogoSize;
  variant?: "primary" | "white";
  className?: string;
}) {
  const s = sizeMap[size];
  const bg =
    variant === "white"
      ? "bg-white"
      : "bg-white border border-border shadow-soft";
  return (
    <span
      className={cn(
        "inline-grid place-items-center overflow-hidden",
        s.box,
        s.radius,
        bg,
        className
      )}
      aria-label="Manggala"
    >
      <Image
        src="/logofintech.png"
        alt="Manggala"
        width={s.px}
        height={s.px}
        priority
        className="h-full w-full object-contain p-1"
      />
    </span>
  );
}
