"use client";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed select-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-700",
        secondary:
          "bg-white text-ink border border-border hover:bg-slate-50",
        ghost: "text-ink hover:bg-slate-100",
        danger: "bg-danger text-white hover:opacity-90",
        success: "bg-emerald text-white hover:opacity-90",
        outline: "border border-primary text-primary hover:bg-primary-50",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-12 px-5 text-[15px]",
        lg: "h-14 px-6 text-base",
        icon: "h-10 w-10",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
