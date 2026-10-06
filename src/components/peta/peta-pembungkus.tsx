"use client";

import dynamic from "next/dynamic";
import type { TitikPeta } from "@/server/peta";

// Leaflet menyentuh `window` saat modulnya dimuat, jadi tidak boleh
// ikut dirender di server. Pembungkus ini menunda pemuatannya sampai
// peramban siap, sekaligus menyediakan keadaan memuat yang rapi.
const PetaKlien = dynamic(
  () => import("./peta-klien").then((m) => m.PetaKlien),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="flex h-[min(72vh,620px)] items-center justify-center rounded-card border border-line bg-surface shadow-card">
          <p className="text-[13px] font-semibold text-ink-3">Memuat peta…</p>
        </div>
        <div className="h-48 rounded-card border border-line bg-surface shadow-tile" />
      </div>
    ),
  },
);

export function Peta(props: { titik: TitikPeta[]; diambilPada: string }) {
  return <PetaKlien {...props} />;
}
