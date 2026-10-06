"use client";

import { useId, useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type KolomTabel = { key: string; label: string; numeric?: boolean };

/**
 * Bingkai standar setiap grafik.
 *
 * Setiap grafik WAJIB punya kembaran tabel: nilai tidak boleh hanya bisa
 * dibaca lewat warna atau tooltip. Toggle di kanan atas memindahkannya.
 */
export function ChartFrame({
  judul,
  keterangan,
  legenda,
  kolom,
  baris,
  children,
  className,
}: {
  judul: string;
  keterangan?: string;
  legenda?: ReactNode;
  kolom: KolomTabel[];
  baris: Record<string, string | number>[];
  children: ReactNode;
  className?: string;
}) {
  const [tampilan, setTampilan] = useState<"grafik" | "tabel">("grafik");
  const id = useId();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-start justify-between gap-4 p-5 pb-2">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold tracking-tight text-ink">{judul}</h3>
          {keterangan ? (
            <p className="mt-0.5 text-[13px] leading-snug text-ink-3">{keterangan}</p>
          ) : null}
        </div>
        <div
          className="flex shrink-0 rounded-pill border border-line bg-surface-2 p-0.5"
          role="group"
          aria-label={`Tampilan ${judul}`}
        >
          <button
            type="button"
            aria-pressed={tampilan === "grafik"}
            aria-controls={id}
            onClick={() => setTampilan("grafik")}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-pill transition-colors",
              tampilan === "grafik"
                ? "bg-surface text-brand-700 shadow-tile"
                : "text-ink-3 hover:text-ink-2",
            )}
          >
            <BarChart3 className="size-3.5" strokeWidth={2.5} aria-hidden />
            <span className="sr-only">Tampilkan grafik</span>
          </button>
          <button
            type="button"
            aria-pressed={tampilan === "tabel"}
            aria-controls={id}
            onClick={() => setTampilan("tabel")}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-pill transition-colors",
              tampilan === "tabel"
                ? "bg-surface text-brand-700 shadow-tile"
                : "text-ink-3 hover:text-ink-2",
            )}
          >
            <Table2 className="size-3.5" strokeWidth={2.5} aria-hidden />
            <span className="sr-only">Tampilkan tabel</span>
          </button>
        </div>
      </div>

      {legenda && tampilan === "grafik" ? (
        <div className="px-5 pb-1">{legenda}</div>
      ) : null}

      <div id={id} className="min-w-0 flex-1 px-2 pb-4">
        {tampilan === "grafik" ? (
          children
        ) : (
          <div className="max-h-[260px] overflow-auto px-3">
            <table className="w-full border-collapse text-[13px]">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-line">
                  {kolom.map((k) => (
                    <th
                      key={k.key}
                      scope="col"
                      className={cn(
                        "py-2 font-semibold text-ink-3",
                        k.numeric ? "text-right" : "text-left",
                      )}
                    >
                      {k.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {baris.map((b, i) => (
                  <tr key={i} className="border-b border-line/60 last:border-0">
                    {kolom.map((k) => (
                      <td
                        key={k.key}
                        className={cn(
                          "py-2 text-ink-2",
                          k.numeric
                            ? "text-right font-semibold tabular-nums text-ink"
                            : "text-left",
                        )}
                      >
                        {b[k.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Legenda eksplisit — selalu tampil untuk 2 seri atau lebih. */
export function Legenda({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-1.5">
          <span
            className="h-0.5 w-4 rounded-pill"
            style={{ backgroundColor: it.color }}
            aria-hidden
          />
          <span className="text-[12px] font-semibold text-ink-2">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
