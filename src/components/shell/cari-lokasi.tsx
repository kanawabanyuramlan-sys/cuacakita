"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { daftarKota } from "@/lib/lokasi";

/**
 * Kotak pencarian lokasi di bilah atas.
 *
 * Dibuat lebar dan selalu terlihat karena bagi pengunjung pertama,
 * "di mana saya mengganti kota?" adalah pertanyaan nomor satu. Menyembunyikan
 * pencarian di balik ikon membuat pertanyaan itu tidak terjawab.
 */
export function CariLokasi({ terpilih }: { terpilih: string }) {
  const router = useRouter();
  const [kueri, setKueri] = useState("");
  const [fokus, setFokus] = useState(false);
  const [sorot, setSorot] = useState(0);
  const [menunggu, mulai] = useTransition();
  const wadahRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function klikLuar(e: MouseEvent) {
      if (wadahRef.current && !wadahRef.current.contains(e.target as Node)) {
        setFokus(false);
      }
    }
    document.addEventListener("mousedown", klikLuar);
    return () => document.removeEventListener("mousedown", klikLuar);
  }, []);

  const hasil = useMemo(() => {
    const t = kueri.trim().toLowerCase();
    const sumber = t
      ? daftarKota.filter(
          (k) =>
            k.nama.toLowerCase().includes(t) ||
            k.provinsi.toLowerCase().includes(t),
        )
      : daftarKota;
    return sumber.slice(0, 8);
  }, [kueri]);

  function pilih(nama: string) {
    setFokus(false);
    setKueri("");
    mulai(() => router.push(`/dashboard?kota=${encodeURIComponent(nama)}`));
  }

  function tombol(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSorot((i) => Math.min(i + 1, hasil.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSorot((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && hasil[sorot]) {
      e.preventDefault();
      pilih(hasil[sorot].nama);
    } else if (e.key === "Escape") {
      setFokus(false);
    }
  }

  return (
    <div className="relative min-w-0 flex-1" ref={wadahRef}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-3"
        aria-hidden
      />
      <input
        value={kueri}
        onChange={(e) => {
          setKueri(e.target.value);
          setSorot(0);
          setFokus(true);
        }}
        onFocus={() => setFokus(true)}
        onKeyDown={tombol}
        type="search"
        role="combobox"
        aria-expanded={fokus}
        aria-controls="hasil-cari-lokasi"
        aria-label="Cari kota"
        placeholder={`Cari kota lain… (sekarang: ${terpilih})`}
        className="h-11 w-full rounded-pill border border-line bg-surface-2 pl-11 pr-4 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-3 hover:border-line-strong focus:border-brand-400 focus:bg-surface"
      />
      {menunggu ? (
        <Loader2
          className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-brand-600"
          aria-hidden
        />
      ) : null}

      {fokus ? (
        <div
          id="hasil-cari-lokasi"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-card border border-line bg-surface shadow-float"
        >
          <ul role="listbox" className="max-h-80 overflow-y-auto p-1.5">
            {hasil.length === 0 ? (
              <li className="px-3 py-6 text-center text-[13px] text-ink-3">
                Tidak ada kota bernama “{kueri}”. Coba nama kota atau provinsi
                lain.
              </li>
            ) : (
              hasil.map((k, i) => (
                <li key={k.adm4}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === sorot}
                    onMouseEnter={() => setSorot(i)}
                    onClick={() => pilih(k.nama)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-tile px-3 py-2 text-left transition-colors",
                      i === sorot ? "bg-brand-50" : "hover:bg-surface-2",
                    )}
                  >
                    <MapPin
                      className="size-3.5 shrink-0 text-ink-3"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-ink">
                        {k.nama}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-3">
                        {k.provinsi}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          <p className="border-t border-line px-3.5 py-2 text-[11px] text-ink-3">
            {daftarKota.length} kota tersedia · gunakan panah atas-bawah lalu
            Enter
          </p>
        </div>
      ) : null}
    </div>
  );
}
