"use client";

import dynamic from "next/dynamic";
import type { TitikPeta } from "@/server/peta";

/**
 * Leaflet menyentuh `window` saat modulnya dimuat, jadi tidak boleh ikut
 * dirender di server. Pembungkus ini menunda pemuatannya sampai peramban
 * siap, sekaligus menyediakan keadaan memuat yang rapi — bukan ruang kosong
 * yang membuat tata letak melompat.
 */

function Memuat({ tinggi }: { tinggi: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-card border border-line bg-surface shadow-tile"
      style={{ height: tinggi }}
    >
      <p className="flex items-center gap-2 text-[13px] font-semibold text-ink-3">
        <span className="size-3 animate-pulse rounded-full bg-brand-400" aria-hidden />
        Memuat peta…
      </p>
    </div>
  );
}

const Klien = dynamic(() => import("./peta-klien").then((m) => m.PetaKlien), {
  ssr: false,
  loading: () => (
    <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
      <Memuat tinggi="min(72vh, 620px)" />
      <div className="h-48 rounded-card border border-line bg-surface shadow-tile" />
    </div>
  ),
});

const KlienDashboard = dynamic(
  () => import("./peta-dashboard").then((m) => m.PetaDashboard),
  { ssr: false, loading: () => <Memuat tinggi="clamp(340px, 46vh, 470px)" /> },
);

export function Peta(props: { titik: TitikPeta[]; diambilPada: string }) {
  return <Klien {...props} />;
}

export function PetaRingkas(props: {
  titik: TitikPeta[];
  pusat: [number, number];
  sorot: string;
  jumlahPeringatan: number;
}) {
  return <KlienDashboard {...props} />;
}
