import type { ReactNode } from "react";
import { Radio } from "lucide-react";
import { cn } from "@/lib/cn";
import { Topbar } from "./topbar";

/**
 * Kerangka aplikasi: panel putih yang mengambang di atas langit.
 *
 * Latar langit bukan hiasan semata — pengunjung pertama mengenali ini
 * sebagai situs cuaca sebelum membaca satu kata pun. Seluruh isi tinggal
 * di dalam satu panel membulat agar batas antarmukanya jelas dan tidak
 * terasa seperti halaman dokumen yang memanjang tanpa ujung.
 */
export function Kerangka({
  kota,
  diperbaruiPada,
  jumlahPeringatan,
  strip,
  children,
}: {
  kota: string;
  diperbaruiPada?: string;
  jumlahPeringatan?: number;
  strip?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="langit min-h-screen px-0 py-0 sm:px-5 sm:py-5 lg:px-10 lg:py-8">
      <div className="panel-utama mx-auto max-w-[1480px] overflow-hidden sm:rounded-panel">
        <Topbar
          kota={kota}
          diperbaruiPada={diperbaruiPada}
          jumlahPeringatan={jumlahPeringatan}
        />
        {strip}
        <div className="bg-canvas/60 p-3 sm:p-4">{children}</div>
      </div>
    </div>
  );
}

/**
 * Strip informasi langsung di bawah bilah atas.
 *
 * Isinya satu kalimat paling mendesak — bukan ringkasan panjang. Kalau
 * tidak ada yang mendesak, strip ini tetap muncul dengan kabar baik,
 * supaya pengguna tahu sistemnya hidup dan sedang tidak menyembunyikan apa pun.
 */
export function StripLangsung({
  pesan,
  mendesak = false,
  kanan,
}: {
  pesan: ReactNode;
  mendesak?: boolean;
  kanan?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-2.5 sm:px-5",
        mendesak ? "bg-tint-sun/60" : "bg-surface",
      )}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wide",
          mendesak
            ? "bg-[color:var(--color-tingkat-tinggi)] text-white"
            : "bg-brand-600 text-white",
        )}
      >
        <Radio className="size-3 animate-pulse" strokeWidth={2.75} aria-hidden />
        Langsung
      </span>

      <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink-2">
        {pesan}
      </p>

      {kanan ? <div className="flex shrink-0 items-center gap-2">{kanan}</div> : null}
    </div>
  );
}
