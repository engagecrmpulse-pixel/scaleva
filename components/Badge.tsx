import type { HTMLAttributes } from "react";
import { cn } from "@/utils/helpers";

type Tone = "gray" | "green" | "yellow" | "red" | "brand";

const toneStyles: Record<Tone, string> = {
  gray: "bg-line text-content-muted",
  green: "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
  yellow: "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20",
  red: "bg-danger/10 text-danger ring-1 ring-inset ring-danger/20",
  brand: "bg-accent/10 text-accent ring-1 ring-inset ring-accent/20",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
