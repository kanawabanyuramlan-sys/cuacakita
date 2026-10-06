"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { daftarKota } from "@/lib/lokasi";

export function PemilihLokasi({ terpilih }: { terpilih: string }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [kueri, setKueri] = useState("");
  const [menunggu, mulai] = useTransition();
  const wadahRef = useRef<HTMLDivElement>(null);
  const cariRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function klikLuar(e: MouseEvent) {
      if (wadahRef.current && !wadahRef.current.contains(e.target as Node)) {
        setBuka(false);
      }
    }
    document.addEventListener("mousedown", klikLuar);
    return () => document.removeEventListener("mousedown", klikLuar);
  }, []);

  useEffect(() => {
    if (buka) cariRef.current?.focus();
  }, [buka]);

  const hasil = useMemo(() => {
    const t = kueri.trim().toLowerCase();
    if (!t) return daftarKota;
    return daftarKota.filter(
      (k) =>
        k.nama.toLowerCase().includes(t) ||
        k.provinsi.toLowerCase().includes(t),
    );
  }, [kueri]);

  function pilih(nama: string) {
    setBuka(false);
    setKueri("");
    mulai(() => {
      router.push(`/dashboard?kota=${encodeURIComponent(nama)}`);
    });
  }

  return (
    <div className="relative" ref={wadahRef}>
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        aria-haspopup="listbox"
        className="flex w-full items-center gap-2.5 rounded-pill border border-line bg-surface py-2.5 pl-4 pr-3 text-left shadow-tile transition-colors hover:border-line-strong sm:w-auto sm:min-w-[260px]"
      >
        {menunggu ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-brand-600" aria-hidden />
        ) : (
          <MapPin className="size-4 shrink-0 text-brand-600" strokeWidth={2.5} aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold leading-tight text-ink">
            {terpilih}
          </span>
          <span className="block text-[11px] leading-tight text-ink-3">
            {menunggu ? "Memuat data…" : `${daftarKota.length} kota tersedia`}
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-ink-3 transition-transform", buka && "rotate-180")}
          aria-hidden
        />
      </button>

      {buka ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-[300px] overflow-hidden rounded-card border border-line bg-surface shadow-float">
          <div className="relative border-b border-line">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3"
              aria-hidden
            />
            <input
              ref={cariRef}
              value={kueri}
              onChange={(e) => setKueri(e.target.value)}
              type="search"
              placeholder="Cari kota atau provinsi…"
              aria-label="Cari lokasi"
              className="h-11 w-full bg-transparent pl-10 pr-3 text-[13.5px] text-ink outline-none placeholder:text-ink-3"
            />
          </div>

          <ul role="listbox" className="max-h-72 overflow-y-auto p-1.5">
            {hasil.length === 0 ? (
              <li className="px-3 py-6 text-center text-[13px] text-ink-3">
                Tidak ada kota yang cocok dengan “{kueri}”.
              </li>
            ) : (
              hasil.map((k) => {
                const aktif = k.nama === terpilih;
                return (
                  <li key={k.adm4}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={aktif}
                      onClick={() => pilih(k.nama)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-tile px-3 py-2 text-left transition-colors",
                        aktif ? "bg-brand-50" : "hover:bg-surface-2",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-ink">
                          {k.nama}
                        </span>
                        <span className="block truncate text-[11.5px] text-ink-3">
                          {k.provinsi}
                        </span>
                      </span>
                      {aktif ? (
                        <Check className="size-4 shrink-0 text-brand-600" strokeWidth={2.75} aria-hidden />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <p className="border-t border-line px-3.5 py-2.5 text-[11px] leading-snug text-ink-3">
            Hanya kota dengan kode wilayah BMKG yang sudah diverifikasi yang
            ditampilkan di sini.
          </p>
        </div>
      ) : null}
    </div>
  );
}
