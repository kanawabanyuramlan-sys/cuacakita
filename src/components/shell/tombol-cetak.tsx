"use client";

import { Printer } from "lucide-react";

/**
 * Menyimpan laporan lewat dialog cetak peramban — bisa langsung disimpan
 * sebagai PDF. Dipilih karena benar-benar berfungsi di mana saja tanpa
 * pustaka tambahan maupun layanan luar.
 */
export function TombolCetak() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-pill bg-brand-600 px-3 text-[12px] font-bold text-white transition-colors hover:bg-brand-700"
    >
      <Printer className="size-3.5" strokeWidth={2.5} aria-hidden />
      Simpan laporan
    </button>
  );
}
