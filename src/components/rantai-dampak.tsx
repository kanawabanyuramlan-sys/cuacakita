"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { LencanaTingkat, warnaTingkat } from "@/components/ui/tingkat";
import {
  penjelasanKeyakinan,
  type Keyakinan,
  type SimpulRantai,
} from "@/lib/impact/rantai";

const gayaKeyakinan: Record<Keyakinan, { label: string; kelas: string }> = {
  terukur: { label: "Terukur", kelas: "bg-tint-mint text-tint-mint-ink" },
  turunan: { label: "Turunan", kelas: "bg-tint-sky text-tint-sky-ink" },
  indikatif: { label: "Indikatif", kelas: "bg-tint-sun text-tint-sun-ink" },
};

export function RantaiDampak({
  simpul,
  className,
}: {
  simpul: SimpulRantai[];
  className?: string;
}) {
  const [terbuka, setTerbuka] = useState<string | null>(null);
  const aktif = simpul.find((s) => s.id === terbuka) ?? null;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Deret simpul: menggulung mendatar di layar sempit */}
      <ol className="flex snap-x gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-8 lg:gap-1.5 lg:overflow-visible">
        {simpul.map((s, i) => {
          const dipilih = terbuka === s.id;
          return (
            <li key={s.id} className="relative flex min-w-[124px] snap-start lg:min-w-0">
              <button
                type="button"
                onClick={() => setTerbuka(dipilih ? null : s.id)}
                aria-expanded={dipilih}
                className={cn(
                  "group flex w-full flex-col items-start gap-2 rounded-tile border p-3 text-left transition-all",
                  dipilih
                    ? "border-brand-400 bg-brand-50 shadow-tile"
                    : "border-line bg-surface hover:border-line-strong hover:shadow-tile",
                )}
              >
                <span className="flex w-full items-center justify-between gap-1">
                  <span className="text-lg leading-none" aria-hidden>
                    {s.ikon}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 text-ink-3 transition-transform",
                      dipilih && "rotate-180",
                    )}
                    aria-hidden
                  />
                </span>

                <span className="text-[12.5px] font-bold leading-tight text-ink">
                  {s.label}
                </span>

                <span className="flex w-full items-baseline gap-1.5">
                  <span
                    className="text-[20px] font-extrabold leading-none"
                    style={{ color: warnaTingkat(s.tingkat) }}
                  >
                    {s.skor}
                  </span>
                  <span className="text-[10.5px] font-semibold text-ink-3">
                    /100
                  </span>
                </span>

                <span
                  className={cn(
                    "rounded-pill px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide",
                    gayaKeyakinan[s.keyakinan].kelas,
                  )}
                >
                  {gayaKeyakinan[s.keyakinan].label}
                </span>
              </button>

              {/* Penghubung antar simpul */}
              {i < simpul.length - 1 ? (
                <span
                  className="pointer-events-none absolute -right-1 top-1/2 hidden size-2 -translate-y-1/2 lg:block"
                  aria-hidden
                >
                  <svg viewBox="0 0 8 8" className="size-2 text-line-strong">
                    <path
                      d="M2 1l3 3-3 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Panel rincian simpul terpilih */}
      {aktif ? (
        <div className="mt-3 rounded-card border border-brand-200 bg-brand-50/60 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl leading-none" aria-hidden>
              {aktif.ikon}
            </span>
            <h4 className="text-[16px] font-extrabold tracking-tight text-ink">
              {aktif.label}
            </h4>
            <LencanaTingkat tingkat={aktif.tingkat} />
            <span
              className={cn(
                "rounded-pill px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide",
                gayaKeyakinan[aktif.keyakinan].kelas,
              )}
            >
              {gayaKeyakinan[aktif.keyakinan].label}
            </span>
          </div>

          <p className="mt-3 text-[14px] font-semibold leading-snug text-ink">
            {aktif.ringkas}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
            {aktif.rinci}
          </p>

          <div className="mt-4 rounded-tile bg-surface p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
              Dasar perhitungan
            </p>
            <ul className="mt-2 space-y-1">
              {aktif.dasar.map((d) => (
                <li
                  key={d}
                  className="flex gap-2 text-[12.5px] leading-snug text-ink-2"
                >
                  <span
                    className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-3"
                    aria-hidden
                  />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 flex gap-2 text-[11.5px] leading-snug text-ink-3">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {penjelasanKeyakinan[aktif.keyakinan]}
          </p>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-[12.5px] text-ink-3">
          <Info className="size-3.5 shrink-0" aria-hidden />
          Klik salah satu simpul untuk melihat dari mana angkanya berasal.
        </p>
      )}
    </div>
  );
}
