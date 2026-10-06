"use client";

import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { cn } from "@/lib/cn";
import { CincinSkor, LencanaTingkat } from "@/components/ui/tingkat";
import type { SkorDampak } from "@/lib/impact/engine";

/**
 * Kartu satu sektor.
 *
 * Bagian terpenting ada di balik tombol "Lihat dasar perhitungan": nilai
 * mentah, bobot, dan sumbangan tiap faktor terhadap skor akhir. Skor yang
 * tidak bisa dibuka isinya hanyalah angka yang harus dipercaya begitu saja,
 * dan itu bukan yang ingin dibangun di sini.
 */
export function KartuSektor({ sektor }: { sektor: SkorDampak }) {
  const [buka, setBuka] = useState(false);
  const pemicu = sektor.faktor.filter((f) => f.peran === "pemicu");
  const pengali = sektor.faktor.find((f) => f.peran === "pengali");

  return (
    <article className="flex flex-col rounded-card border border-line bg-surface shadow-tile">
      <div className="flex items-start gap-4 p-5">
        <CincinSkor skor={sektor.skor} tingkat={sektor.tingkat} ukuran={68} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-extrabold tracking-tight text-ink">
              {sektor.nama}
            </h3>
            <LencanaTingkat tingkat={sektor.tingkat} />
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
            {sektor.ringkasan}
          </p>
        </div>
      </div>

      {/* Rekomendasi */}
      <div className="px-5 pb-4">
        <ul className="space-y-1.5">
          {sektor.rekomendasi.map((r) => (
            <li key={r} className="flex gap-2">
              <Lightbulb
                className="mt-0.5 size-3.5 shrink-0 text-brand-500"
                strokeWidth={2.25}
                aria-hidden
              />
              <span className="text-[12.5px] leading-snug text-ink-2">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bongkar faktor */}
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="flex items-center justify-between gap-2 border-t border-line px-5 py-3 text-left transition-colors hover:bg-surface-2"
      >
        <span className="text-[12.5px] font-bold text-brand-700">
          Lihat dasar perhitungan
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-ink-3 transition-transform",
            buka && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {buka ? (
        <div className="border-t border-line bg-surface-2 p-5">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Faktor penyusun skor {sektor.nama}
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th
                  scope="col"
                  className="pb-2 text-[10.5px] font-bold uppercase tracking-wide text-ink-3"
                >
                  Faktor
                </th>
                <th
                  scope="col"
                  className="pb-2 text-right text-[10.5px] font-bold uppercase tracking-wide text-ink-3"
                >
                  Nilai
                </th>
                <th
                  scope="col"
                  className="pb-2 text-right text-[10.5px] font-bold uppercase tracking-wide text-ink-3"
                >
                  Bobot
                </th>
                <th
                  scope="col"
                  className="pb-2 text-right text-[10.5px] font-bold uppercase tracking-wide text-ink-3"
                >
                  Sumbangan
                </th>
              </tr>
            </thead>
            <tbody>
              {pemicu.map((f) => (
                <tr key={f.nama} className="border-b border-line/60 align-top">
                  <td className="py-2 pr-2">
                    <span className="block text-[12.5px] font-semibold text-ink">
                      {f.nama}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-ink-3">
                      {f.penjelasan}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-2 text-right text-[12.5px] font-semibold tabular-nums text-ink">
                    {f.nilai}
                    <span className="ml-0.5 text-[10.5px] font-normal text-ink-3">
                      {f.satuan}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-2 text-right text-[12.5px] tabular-nums text-ink-2">
                    {Math.round(f.bobot * 100)}%
                  </td>
                  <td className="whitespace-nowrap py-2 text-right text-[12.5px] font-bold tabular-nums text-ink">
                    +{f.kontribusi}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-2.5 text-[12.5px] font-bold text-ink">
                  Skor akhir
                </td>
                <td className="pt-2.5 text-right text-[14px] font-extrabold tabular-nums text-ink">
                  {sektor.skor}
                </td>
              </tr>
            </tfoot>
          </table>

          {pengali ? (
            <div className="mt-4 rounded-tile border border-line bg-surface p-3.5">
              <p className="flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] font-bold text-ink">
                  {pengali.nama}
                </span>
                <span className="text-[12.5px] font-bold tabular-nums text-ink">
                  ×{(pengali.kontribusi / 100).toFixed(2)}
                </span>
              </p>
              <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
                {pengali.penjelasan} Nilai wilayah ini {pengali.nilai}{" "}
                {pengali.satuan}. Pengali tidak pernah menaikkan skor sendirian —
                tanpa pemicu cuaca, skornya tetap nol.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
