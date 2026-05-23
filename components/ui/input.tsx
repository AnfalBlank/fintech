import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-14 rounded-2xl border border-border bg-white px-4 text-[15px] text-ink placeholder:text-ink-muted outline-none transition-all focus:border-primary focus:shadow-ring",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("text-sm font-medium text-ink-muted mb-1.5 block", className)}
    {...props}
  />
);
