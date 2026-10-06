import { CheckCircle2, Info, TriangleAlert, Umbrella } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Nada, SaranHarian } from "@/lib/impact/saran";

/**
 * Kartu paling atas yang dibaca pengunjung baru.
 *
 * Isinya sengaja bukan angka: satu kalimat tentang apa yang terjadi, satu
 * kalimat tentang apa yang sebaiknya dilakukan, lalu tiga pertanyaan yang
 * benar-benar ditanyakan orang sehari-hari. Angka dan skor baru muncul
 * setelah ini — bagi yang ingin menelusuri lebih jauh.
 */

const gaya: Record<
  Nada,
  { ikon: typeof CheckCircle2; kelas: string; warna: string; label: string }
> = {
  aman: {
    ikon: CheckCircle2,
    kelas: "border-[color:var(--color-tingkat-rendah)]/30 bg-tint-mint/50",
    warna: "text-[color:var(--color-tingkat-rendah)]",
    label: "Aman",
  },
  siaga: {
    ikon: Info,
    kelas: "border-[color:var(--color-tingkat-sedang)]/35 bg-tint-sun/50",
    warna: "text-[color:var(--color-tingkat-sedang)]",
    label: "Perlu disiapkan",
  },
  waspada: {
    ikon: TriangleAlert,
    kelas: "border-[color:var(--color-tingkat-tinggi)]/35 bg-tint-rose/40",
    warna: "text-[color:var(--color-tingkat-tinggi)]",
    label: "Waspada",
  },
};

export function KartuSaran({
  saran,
  kota,
}: {
  saran: SaranHarian;
  kota: string;
}) {
  const g = gaya[saran.nada];
  const Ikon = g.ikon;

  return (
    <section
      aria-label="Ringkasan untuk hari ini"
      className={cn("muncul rounded-card border p-5 shadow-tile", g.kelas)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-ink">
          <Ikon className={cn("size-3.5", g.warna)} strokeWidth={2.75} aria-hidden />
          {g.label}
        </span>
        <span className="text-[12px] font-semibold text-ink-2">
          Hari ini di {kota}
        </span>
      </div>

      <p className="mt-3 text-[clamp(1.05rem,2.2vw,1.35rem)] font-extrabold leading-snug tracking-[-0.02em] text-ink">
        {saran.judul}
      </p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
        {saran.tindakan}
      </p>

      <dl className="mt-4 grid gap-2 sm:grid-cols-3">
        {saran.poin.map((p) => (
          <div key={p.label} className="rounded-tile bg-surface p-3">
            <dt className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-3">
              <Umbrella className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
              {p.label}
            </dt>
            <dd className="mt-1 text-[13.5px] font-bold leading-snug text-ink">
              {p.nilai}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
