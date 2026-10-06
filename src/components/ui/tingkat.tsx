import { CheckCircle2, AlertTriangle, OctagonAlert, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tingkat } from "@/lib/impact/engine";

/**
 * Penanda tingkat dampak.
 *
 * Warna di sini BERARTI baik/buruk, jadi dipakai palet status — dan selalu
 * berpasangan dengan ikon DAN teks. Warna tidak pernah menjadi satu-satunya
 * pembawa makna, termasuk bagi pembaca dengan buta warna.
 */

const meta: Record<
  Tingkat,
  { ikon: typeof CheckCircle2; warna: string; bg: string; teks: string }
> = {
  Rendah: {
    ikon: CheckCircle2,
    warna: "var(--color-tingkat-rendah)",
    bg: "color-mix(in oklab, var(--color-tingkat-rendah) 12%, transparent)",
    teks: "text-[color:var(--color-tingkat-rendah)]",
  },
  Sedang: {
    ikon: AlertTriangle,
    warna: "var(--color-tingkat-sedang)",
    bg: "color-mix(in oklab, var(--color-tingkat-sedang) 18%, transparent)",
    teks: "text-[color:var(--color-tingkat-sedang)]",
  },
  Tinggi: {
    ikon: OctagonAlert,
    warna: "var(--color-tingkat-tinggi)",
    bg: "color-mix(in oklab, var(--color-tingkat-tinggi) 16%, transparent)",
    teks: "text-[color:var(--color-tingkat-tinggi)]",
  },
  "Sangat Tinggi": {
    ikon: ShieldAlert,
    warna: "var(--color-tingkat-sangat)",
    bg: "color-mix(in oklab, var(--color-tingkat-sangat) 14%, transparent)",
    teks: "text-[color:var(--color-tingkat-sangat)]",
  },
};

export function warnaTingkat(t: Tingkat) {
  return meta[t].warna;
}

export function LencanaTingkat({
  tingkat,
  gelap = false,
  className,
}: {
  tingkat: Tingkat;
  /** Dipakai di atas permukaan gelap (hero, peta, footer) agar teks tetap terbaca. */
  gelap?: boolean;
  className?: string;
}) {
  const m = meta[tingkat];
  const Ikon = m.ikon;
  return (
    <span
      style={{ backgroundColor: gelap ? "rgb(255 255 255 / 0.1)" : m.bg }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[12px] font-bold leading-none",
        className,
      )}
    >
      <Ikon
        className={cn("size-3.5 shrink-0", m.teks)}
        strokeWidth={2.5}
        aria-hidden
      />
      <span className={gelap ? "text-white" : "text-ink"}>{tingkat}</span>
    </span>
  );
}

/**
 * Bilah skor 0–100. Isi membawa tingkat keparahan; jalur kosongnya adalah
 * langkah yang lebih terang dari warna yang sama, sehingga keadaan terbaca
 * di sepanjang bilah, bukan hanya pada bagian yang terisi.
 */
export function BilahSkor({
  skor,
  tingkat,
  label,
  className,
}: {
  skor: number;
  tingkat: Tingkat;
  label: string;
  className?: string;
}) {
  const m = meta[tingkat];
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-pill", className)}
      style={{ backgroundColor: m.bg }}
      role="meter"
      aria-valuenow={skor}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${skor} dari 100, tingkat ${tingkat}`}
    >
      <div
        className="h-full rounded-pill transition-[width] duration-700"
        style={{ width: `${Math.max(skor, 2)}%`, backgroundColor: m.warna }}
      />
    </div>
  );
}

/** Cincin skor untuk kartu sektor yang lebih menonjol. */
export function CincinSkor({
  skor,
  tingkat,
  ukuran = 72,
}: {
  skor: number;
  tingkat: Tingkat;
  ukuran?: number;
}) {
  const m = meta[tingkat];
  const r = (ukuran - 8) / 2;
  const keliling = 2 * Math.PI * r;
  const terisi = (Math.max(skor, 1.5) / 100) * keliling;

  return (
    <svg
      width={ukuran}
      height={ukuran}
      viewBox={`0 0 ${ukuran} ${ukuran}`}
      role="img"
      aria-label={`Skor ${skor} dari 100, tingkat ${tingkat}`}
      className="shrink-0"
    >
      <circle
        cx={ukuran / 2}
        cy={ukuran / 2}
        r={r}
        fill="none"
        stroke={m.bg}
        strokeWidth={6}
      />
      <circle
        cx={ukuran / 2}
        cy={ukuran / 2}
        r={r}
        fill="none"
        stroke={m.warna}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={`${terisi} ${keliling}`}
        transform={`rotate(-90 ${ukuran / 2} ${ukuran / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="fill-ink"
        style={{ fontSize: ukuran * 0.3, fontWeight: 800 }}
      >
        {skor}
      </text>
    </svg>
  );
}
