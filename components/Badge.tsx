import type { HTMLAttributes } from "react";
import { cn } from "@/utils/helpers";

type Tone = "gray" | "green" | "yellow" | "red" | "brand";

const toneStyles: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-600",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  yellow: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  brand: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "gray", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
