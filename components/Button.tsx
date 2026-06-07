import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/helpers";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover focus-visible:ring-accent",
  secondary:
    "bg-transparent text-content border border-line hover:bg-surface hover:border-content-muted focus-visible:ring-accent",
  ghost:
    "bg-transparent text-content-muted hover:bg-surface hover:text-content focus-visible:ring-accent",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger/80 focus-visible:ring-danger",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-10 px-5 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-btn font-medium tracking-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
