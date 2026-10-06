import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

/* Angka besar memakai figur proporsional (default font), bukan tabular-nums —
   tabular membuat angka seperti "121" terlihat renggang di ukuran display. */

type Delta = {
  value: number;
  /** Label periode pembanding, mis. "vs bulan lalu". Wajib: delta tanpa periode tidak bermakna. */
  periode: string;
  /** true bila angka naik berarti kabar baik (default). Laporan aktif naik = buruk. */
  naikItuBaik?: boolean;
};

function DeltaChip({ value, periode, naikItuBaik = true }: Delta) {
  const netral = value === 0;
  const baik = netral ? false : value > 0 === naikItuBaik;
  const Icon = netral ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold">
      <span
        className={cn(
          "inline-flex items-center gap-0.5",
          netral ? "text-ink-3" : baik ? "text-state-good" : "text-state-critical",
        )}
      >
        <Icon className="size-3.5" aria-hidden strokeWidth={2.75} />
        {value > 0 ? "+" : ""}
        {value}
      </span>
      <span className="font-medium text-ink-3">{periode}</span>
    </span>
  );
}

/** Angka utama halaman. Tepat satu per tampilan, >=48px, tetap memakai sans. */
export function HeroFigure({
  label,
  value,
  unit,
  delta,
  footer,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: Delta;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full flex-col justify-between gap-4", className)}>
      <div>
        <p className="text-[13px] font-semibold text-ink-2">{label}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-sans text-5xl font-extrabold leading-none tracking-tight text-ink">
            {value}
          </span>
          {unit ? (
            <span className="text-sm font-semibold text-ink-3">{unit}</span>
          ) : null}
        </div>
        {delta ? (
          <div className="mt-2.5">
            <DeltaChip {...delta} />
          </div>
        ) : null}
      </div>
      {footer}
    </div>
  );
}

/**
 * Sparkline 12 titik: garis dalam warna redup, titik periode berjalan
 * dalam warna aksen. Tidak punya sumbu dan tidak pernah diberi angka —
 * tugasnya hanya menunjukkan bentuk tren, nilainya dibaca dari angka utama.
 */
function Sparkline({ data, label }: { data: number[]; label: string }) {
  const W = 100;
  const H = 26;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const titik = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / span) * (H - 4) - 2,
  }));
  const d = titik.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const akhir = titik[titik.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-[26px] w-full"
      role="img"
      aria-label={`Tren ${label}, 12 periode terakhir`}
    >
      <path
        d={d}
        fill="none"
        stroke="var(--viz-muted)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={akhir.x}
        cy={akhir.y}
        r={2.4}
        fill="var(--viz-series-1)"
        stroke="var(--viz-surface)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Kartu angka ringkas untuk baris KPI. */
export function StatTile({
  label,
  value,
  unit,
  delta,
  icon,
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: Delta;
  icon?: ReactNode;
  trend?: number[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-card border border-line bg-surface p-5 shadow-tile",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink-2">{label}</p>
        {icon ? <div className="shrink-0">{icon}</div> : null}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[28px] font-extrabold leading-none tracking-tight text-ink">
          {value}
        </span>
        {unit ? (
          <span className="text-[13px] font-semibold text-ink-3">{unit}</span>
        ) : null}
      </div>
      {delta ? (
        <div className="mt-2">
          <DeltaChip {...delta} />
        </div>
      ) : null}
      {trend ? (
        <div className="mt-auto pt-4">
          <Sparkline data={trend} label={typeof label === "string" ? label : ""} />
        </div>
      ) : null}
    </div>
  );
}

/* ── Meter ──────────────────────────────────────────────────────────
   Satu rasio terhadap batas. Isi membawa tingkat keparahan; jalur
   kosongnya adalah langkah yang lebih terang dari ramp yang sama,
   sehingga keadaan terbaca di sepanjang bar.                         */

function severity(value: number) {
  if (value >= 75) return { fill: "var(--color-brand-500)", track: "var(--color-brand-100)" };
  if (value >= 55) return { fill: "var(--color-state-warning)", track: "#fdf0cf" };
  return { fill: "var(--color-state-critical)", track: "#f7dcdc" };
}

export function Meter({
  label,
  value,
  caption,
}: {
  label: string;
  value: number;
  caption?: string;
}) {
  const { fill, track } = severity(value);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink">{label}</span>
        <span className="text-[13px] font-bold tabular-nums text-ink-2">{value}</span>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-pill"
        style={{ backgroundColor: track }}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-pill transition-[width] duration-700"
          style={{ width: `${value}%`, backgroundColor: fill }}
        />
      </div>
      {caption ? (
        <p className="mt-1.5 text-[12px] leading-snug text-ink-3">{caption}</p>
      ) : null}
    </div>
  );
}
