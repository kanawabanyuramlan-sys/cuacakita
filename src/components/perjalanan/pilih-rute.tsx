"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowLeftRight, Loader2, MapPin } from "lucide-react";
import { daftarKota } from "@/lib/lokasi";

/**
 * Pemilih asal dan tujuan.
 *
 * Memakai <select> bawaan peramban, bukan daftar buatan sendiri: di ponsel
 * ia membuka pemilih asli sistem yang sudah dikenal semua orang dan bisa
 * digulir dengan ibu jari — untuk daftar 43 kota, itu lebih mudah dipakai
 * orang awam daripada kotak pencarian.
 */
export function PilihRute({
  asal,
  tujuan,
}: {
  asal: string;
  tujuan: string;
}) {
  const router = useRouter();
  const [menunggu, mulai] = useTransition();

  const pindah = (a: string, t: string) =>
    mulai(() =>
      router.push(
        `/perjalanan?asal=${encodeURIComponent(a)}&tujuan=${encodeURIComponent(t)}`,
      ),
    );

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-[150px] flex-1">
        <label
          htmlFor="rute-asal"
          className="block text-[11px] font-bold uppercase tracking-wide text-ink-3"
        >
          Dari
        </label>
        <div className="relative mt-1">
          <MapPin
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-600"
            strokeWidth={2.5}
            aria-hidden
          />
          <select
            id="rute-asal"
            value={asal}
            onChange={(e) => pindah(e.target.value, tujuan)}
            className="h-11 w-full appearance-none rounded-pill border border-line bg-surface pl-10 pr-4 text-[13.5px] font-bold text-ink outline-none transition-colors hover:border-line-strong focus:border-brand-400"
          >
            {daftarKota.map((k) => (
              <option key={k.adm4} value={k.nama}>
                {k.nama} — {k.provinsi}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => pindah(tujuan, asal)}
        aria-label="Tukar asal dan tujuan"
        className="flex size-11 shrink-0 items-center justify-center rounded-pill border border-line bg-surface text-ink-2 transition-colors hover:border-brand-400 hover:text-brand-700"
      >
        {menunggu ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <ArrowLeftRight className="size-4" strokeWidth={2.5} aria-hidden />
        )}
      </button>

      <div className="min-w-[150px] flex-1">
        <label
          htmlFor="rute-tujuan"
          className="block text-[11px] font-bold uppercase tracking-wide text-ink-3"
        >
          Ke
        </label>
        <div className="relative mt-1">
          <MapPin
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[color:var(--color-tingkat-tinggi)]"
            strokeWidth={2.5}
            aria-hidden
          />
          <select
            id="rute-tujuan"
            value={tujuan}
            onChange={(e) => pindah(asal, e.target.value)}
            className="h-11 w-full appearance-none rounded-pill border border-line bg-surface pl-10 pr-4 text-[13.5px] font-bold text-ink outline-none transition-colors hover:border-line-strong focus:border-brand-400"
          >
            {daftarKota.map((k) => (
              <option key={k.adm4} value={k.nama}>
                {k.nama} — {k.provinsi}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
