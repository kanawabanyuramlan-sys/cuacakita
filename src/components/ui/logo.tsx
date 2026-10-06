import { cn } from "@/lib/cn";

/**
 * Lambang CuacaKita: awan dengan tiga garis turun yang memanjang tidak
 * sama — hujan yang berlanjut menjadi rantai dampak, bukan sekadar hujan.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="10" fill="currentColor" />
      <path
        d="M10.4 18.2a3.5 3.5 0 0 1 .5-6.96 5 5 0 0 1 9.49-1.2 4.2 4.2 0 0 1 1.3 8.16H10.4Z"
        fill="#fff"
        fillOpacity="0.95"
      />
      <g stroke="var(--color-zest)" strokeWidth="2.1" strokeLinecap="round">
        <line x1="12.4" y1="21.4" x2="12.4" y2="24.2" />
        <line x1="16.4" y1="21.4" x2="16.4" y2="26.4" />
        <line x1="20.4" y1="21.4" x2="20.4" y2="23.4" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "white";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-9 text-brand-600" />
      <span className="leading-none">
        <span
          className={cn(
            "block text-[17px] font-extrabold tracking-tight",
            tone === "white" ? "text-white" : "text-ink",
          )}
        >
          Cuaca<span className="text-brand-400">Kita</span>
        </span>
        <span
          className={cn(
            "mt-0.5 hidden text-[10.5px] font-semibold sm:block",
            tone === "white" ? "text-white/45" : "text-ink-3",
          )}
        >
          Tahu Cuacanya, Paham Dampaknya
        </span>
      </span>
    </span>
  );
}
