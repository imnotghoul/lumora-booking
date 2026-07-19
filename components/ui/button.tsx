import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const buttonStyles = ({
  variant = "primary",
  size = "md",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} = {}) =>
  cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
    {
      "bg-accent-600 text-white shadow-sm hover:bg-accent-700": variant === "primary",
      "bg-accent-50 text-accent-700 hover:bg-accent-100": variant === "secondary",
      "text-muted hover:bg-slate-100 hover:text-ink": variant === "ghost",
      "bg-danger text-white hover:bg-red-700": variant === "danger",
      "border border-line bg-white text-ink hover:border-accent-300 hover:bg-accent-50/60": variant === "outline",
      "h-9 px-3 text-sm": size === "sm",
      "h-11 px-4 text-sm": size === "md",
      "h-[3.25rem] px-6 text-base": size === "lg",
      "size-10 p-0": size === "icon",
    },
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonStyles({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
