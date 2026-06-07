import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/helpers";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-content-muted"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full rounded-btn border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted/60 focus:outline-none focus:ring-1 transition-colors",
            error
              ? "border-danger focus:border-danger focus:ring-danger"
              : "border-line focus:border-accent focus:ring-accent",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
