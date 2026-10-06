import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "lavender"
  | "peach"
  | "sky"
  | "mint"
  | "butter"
  | "rose";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-2 border-line",
  brand: "bg-brand-50 text-brand-700 border-brand-100",
  lavender: "bg-tint-lavender text-tint-lavender-ink border-transparent",
  peach: "bg-tint-peach text-tint-peach-ink border-transparent",
  sky: "bg-tint-sky text-tint-sky-ink border-transparent",
  mint: "bg-tint-mint text-tint-mint-ink border-transparent",
  butter: "bg-tint-butter text-tint-butter-ink border-transparent",
  rose: "bg-tint-rose text-tint-rose-ink border-transparent",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[12px] font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
