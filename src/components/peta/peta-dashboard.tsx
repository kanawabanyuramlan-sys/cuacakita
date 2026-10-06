"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TitikPeta } from "@/server/peta";
import { LAPISAN, Legenda, PetaDasar, type IdLapisan } from "./peta-dasar";

/** Lapisan yang ditawarkan di dashboard — empat yang paling sering ditanya. */
const PILIHAN: IdLapisan[] = ["banjir", "longsor", "transportasi", "hujan"];

export function PetaDashboard({
  titik,
  pusat,
  sorot,
  jumlahPeringatan,
}: {
  titik: TitikPeta[];
  pusat: [number, number];
  sorot: string;
  jumlahPeringatan: number;
}) {
  const [lapisan, setLapisan] = useState<IdLapisan>("banjir");
  const info = LAPISAN.find((l) => l.id === lapisan)!;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-tile">
      {/* Pembungkus relatif sendiri: tanpa ini legenda menempel ke seluruh
          kartu dan menimpa keterangan di bawah peta. */}
      <div className="relative">
        <PetaDasar
          titik={titik}
          lapisan={lapisan}
          pusat={pusat}
          zoom={7}
          tinggi="clamp(300px, 42vh, 420px)"
          sorot={sorot}
        />

        {/* Lencana peringatan, mengambang di kiri atas seperti pada referensi */}
        <div className="pointer-events-none absolute left-4 top-4 z-[500]">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-pill px-3 py-2 text-[12px] font-bold shadow-card",
            jumlahPeringatan > 0
              ? "bg-[color:var(--color-tingkat-tinggi)] text-white"
              : "kaca text-ink",
          )}
        >
          {jumlahPeringatan > 0 ? (
            <>
              <TriangleAlert className="size-3.5" strokeWidth={2.75} aria-hidden />
              {jumlahPeringatan} hal perlu diperhatikan di {sorot}
            </>
          ) : (
            <>
              <span
                className="size-2 rounded-full bg-[color:var(--color-tingkat-rendah)]"
                aria-hidden
              />
              Tidak ada peringatan di {sorot}
            </>
          )}
        </span>
      </div>

        {/* Pemilih lapisan, mengambang di kanan atas */}
        <div className="absolute right-4 top-16 z-[500] flex max-w-[62%] flex-wrap justify-end gap-1 sm:top-4">
          {PILIHAN.map((id) => {
            const l = LAPISAN.find((x) => x.id === id)!;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setLapisan(id)}
                aria-pressed={lapisan === id}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-[11.5px] font-bold shadow-card transition-colors",
                  lapisan === id
                    ? "bg-brand-600 text-white"
                    : "kaca text-ink hover:text-brand-700",
                )}
              >
                {l.nama}
              </button>
            );
          })}
        </div>

        <Legenda lapisan={lapisan} />
      </div>

      {/* Keterangan bawah: menjelaskan lapisan dengan bahasa biasa */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface px-4 py-2.5">
        <p className="min-w-0 flex-1 text-[12px] leading-snug text-ink-2">
          {info.awam}
        </p>
        <Link
          href="/peta"
          className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-bold text-brand-700 hover:underline"
        >
          Peta lengkap
          <ArrowUpRight className="size-3.5" strokeWidth={2.75} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
