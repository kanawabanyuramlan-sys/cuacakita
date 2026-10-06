import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "zest" | "outline" | "ghost" | "night" | "white";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-semibold " +
  "transition-[background-color,color,box-shadow,transform] duration-200 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-tile",
  zest: "bg-zest text-zest-ink hover:bg-zest-dark shadow-tile",
  outline:
    "border border-line-strong bg-surface text-ink hover:border-brand-400 hover:text-brand-700",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  night: "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  white: "bg-white text-ink hover:bg-brand-50 shadow-tile",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[15px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
