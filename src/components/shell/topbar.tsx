"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleCheck, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/ui/logo";
import { CariLokasi } from "./cari-lokasi";

/** `bawaKota` menandai halaman yang bergantung pada lokasi terpilih,
 *  supaya pindah menu tidak diam-diam melempar pengguna kembali ke
 *  kota bawaan — kebingungan kecil yang paling sering terjadi. */
const menu = [
  { label: "Ringkasan", href: "/dashboard", bawaKota: true, lencana: false },
  { label: "Peringatan", href: "/peringatan", bawaKota: true, lencana: true },
  { label: "Komoditas", href: "/komoditas", bawaKota: true, lencana: false },
  { label: "Mode Petani", href: "/petani", bawaKota: true, lencana: false },
  { label: "Perjalanan", href: "/perjalanan", bawaKota: false, lencana: false },
  { label: "Pasokan", href: "/pasokan", bawaKota: true, lencana: false },
  { label: "Peta Risiko", href: "/peta", bawaKota: false, lencana: false },
  { label: "Riwayat", href: "/histori", bawaKota: true, lencana: false },
];

export function Topbar({
  kota,
  diperbaruiPada,
  jumlahPeringatan,
}: {
  kota: string;
  diperbaruiPada?: string;
  /** Tidak semua halaman menghitungnya; bila tidak ada, lencana disembunyikan. */
  jumlahPeringatan?: number;
}) {
  const pathname = usePathname();
  const [gelap, setGelap] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = gelap ? "dark" : "light";
  }, [gelap]);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-4 py-3 sm:px-5">
      {/* Lambang + nama */}
      <Link
        href="/"
        aria-label="CuacaKita, beranda"
        className="flex shrink-0 items-center gap-2"
      >
        <LogoMark className="size-8 text-brand-600" />
        <span className="text-[16px] font-extrabold tracking-tight text-ink">
          Cuaca<span className="text-brand-500">Kita</span>
        </span>
      </Link>

      {/* Menu utama */}
      <nav
        aria-label="Navigasi utama"
        className="order-3 flex w-full gap-0.5 overflow-x-auto sm:order-none sm:w-auto"
      >
        {menu.map((m) => {
          const aktif = pathname === m.href;
          const href = m.bawaKota
            ? `${m.href}?kota=${encodeURIComponent(kota)}`
            : m.href;
          return (
            <Link
              key={m.href}
              href={href}
              aria-current={aktif ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-pill px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                aktif
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              {m.label}
              {m.lencana && jumlahPeringatan ? (
                <span className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-pill bg-[color:var(--color-tingkat-tinggi)] px-1 text-[10px] font-extrabold text-white">
                  {jumlahPeringatan}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Pencarian */}
      <div className="order-4 w-full sm:order-none sm:mx-2 sm:w-auto sm:min-w-[220px] sm:flex-1">
        <CariLokasi terpilih={kota} />
      </div>

      {/* Status dan tema */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {diperbaruiPada ? (
          <span className="hidden items-center gap-1.5 rounded-pill bg-surface-2 px-3 py-1.5 text-[11.5px] font-semibold text-ink-2 lg:inline-flex">
            <CircleCheck
              className="size-3.5 text-[color:var(--color-tingkat-rendah)]"
              strokeWidth={2.5}
              aria-hidden
            />
            Diperbarui {diperbaruiPada}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => setGelap((v) => !v)}
          aria-pressed={gelap}
          className="flex size-9 items-center justify-center rounded-pill border border-line bg-surface text-ink-2 transition-colors hover:text-ink"
        >
          {gelap ? (
            <Sun className="size-4" strokeWidth={2.25} aria-hidden />
          ) : (
            <Moon className="size-4" strokeWidth={2.25} aria-hidden />
          )}
          <span className="sr-only">
            {gelap ? "Beralih ke tema terang" : "Beralih ke tema gelap"}
          </span>
        </button>
      </div>
    </div>
  );
}
