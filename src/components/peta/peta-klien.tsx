"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { tingkatDari } from "@/lib/impact/engine";
import { LencanaTingkat } from "@/components/ui/tingkat";
import type { TitikPeta } from "@/server/peta";
import {
  LAPISAN,
  Legenda,
  PetaDasar,
  nilaiTitik,
  type IdLapisan,
} from "./peta-dasar";

/**
 * Halaman Peta Risiko.
 *
 * Satu lapisan aktif pada satu waktu, bukan semuanya bertumpuk. Menumpuk
 * enam lapisan berwarna di atas peta yang sama membuat tidak ada satu pun
 * yang terbaca — pengguna harus bisa menjawab satu pertanyaan sekaligus.
 */
export function PetaKlien({
  titik,
  diambilPada,
}: {
  titik: TitikPeta[];
  diambilPada: string;
}) {
  const [lapisan, setLapisan] = useState<IdLapisan>("banjir");
  const info = LAPISAN.find((l) => l.id === lapisan)!;

  const tertinggi = useMemo(
    () =>
      [...titik]
        .sort((a, b) => nilaiTitik(b, lapisan) - nilaiTitik(a, lapisan))
        .slice(0, 5),
    [titik, lapisan],
  );

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
      <div className="relative overflow-hidden rounded-card border border-line bg-surface shadow-tile">
        <PetaDasar
          titik={titik}
          lapisan={lapisan}
          pusat={[-2.5, 118]}
          zoom={5}
          tinggi="min(72vh, 620px)"
        />
        <Legenda lapisan={lapisan} />
      </div>

      <div className="space-y-3">
        <div className="rounded-card border border-line bg-surface p-4 shadow-tile">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
            Pilih yang ingin dilihat
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {LAPISAN.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLapisan(l.id)}
                aria-pressed={lapisan === l.id}
                className={cn(
                  "rounded-tile px-3 py-2 text-left text-[12.5px] font-semibold transition-colors",
                  lapisan === l.id
                    ? "bg-brand-600 text-white"
                    : "bg-surface-2 text-ink-2 hover:bg-line",
                )}
              >
                {l.nama}
              </button>
            ))}
          </div>
          <p className="mt-3 rounded-tile bg-surface-2 p-3 text-[12px] leading-relaxed text-ink-2">
            {info.awam}
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-4 shadow-tile">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
            Lima tertinggi · {info.nama}
          </p>
          <ol className="mt-3 space-y-2.5">
            {tertinggi.map((t, i) => {
              const nilai = nilaiTitik(t, lapisan);
              return (
                <li key={t.nama} className="flex items-center gap-2.5">
                  <span className="w-4 shrink-0 text-[11px] font-bold tabular-nums text-ink-3">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {t.nama}
                    </span>
                    <span className="block truncate text-[11px] text-ink-3">
                      {t.provinsi}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[13px] font-extrabold tabular-nums text-ink">
                      {nilai}
                      {info.satuan !== "skor" ? (
                        <span className="ml-0.5 text-[10px] font-semibold text-ink-3">
                          {info.satuan}
                        </span>
                      ) : null}
                    </span>
                    {info.satuan === "skor" ? (
                      <LencanaTingkat tingkat={tingkatDari(nilai)} />
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="px-1 text-[11px] leading-relaxed text-ink-3">
          {titik.length} kota · diperbarui{" "}
          {new Date(diambilPada).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          . Peta menampilkan indikator analitis per kota, bukan batas wilayah
          rawan bencana resmi, dan tidak memuat data pribadi siapa pun.
        </p>
      </div>
    </div>
  );
}
