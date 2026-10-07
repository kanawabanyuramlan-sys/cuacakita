"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { daftarKota, jarakKm } from "@/lib/lokasi";

/**
 * Deteksi lokasi perangkat.
 *
 * PRIVASI. Koordinat yang diberikan peramban TIDAK PERNAH dikirim ke mana
 * pun — tidak ke server CuacaKita, tidak ke layanan geocoding. Daftar kota
 * sudah ikut terkirim bersama halaman, jadi pencocokan kota terdekat
 * dihitung sepenuhnya di perangkat pengguna, lalu yang berpindah hanyalah
 * nama kotanya.
 *
 * Itu bukan sekadar klaim yang enak dibaca: satu-satunya hal yang keluar
 * dari fungsi ini adalah `router.push` dengan nama kota.
 */

type Keadaan =
  | { jenis: "diam" }
  | { jenis: "mencari" }
  | { jenis: "gagal"; pesan: string }
  | { jenis: "jauh"; kota: string; jarak: number };

export function DeteksiLokasi({ ringkas = false }: { ringkas?: boolean }) {
  const router = useRouter();
  const [keadaan, setKeadaan] = useState<Keadaan>({ jenis: "diam" });

  function cari() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setKeadaan({
        jenis: "gagal",
        pesan: "Peramban ini tidak mendukung deteksi lokasi.",
      });
      return;
    }

    setKeadaan({ jenis: "mencari" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // Seluruh perhitungan di bawah berjalan di perangkat pengguna.
        let terdekat = daftarKota[0];
        let jarak = Infinity;
        for (const k of daftarKota) {
          const d = jarakKm(latitude, longitude, k.lat, k.lon);
          if (d < jarak) {
            jarak = d;
            terdekat = k;
          }
        }

        const bulat = Math.round(jarak);
        if (jarak > 120) {
          // Terlalu jauh untuk disebut "lokasi Anda" — pengguna yang
          // memutuskan, bukan sistem.
          setKeadaan({ jenis: "jauh", kota: terdekat.nama, jarak: bulat });
          return;
        }

        setKeadaan({ jenis: "diam" });
        router.push(`/dashboard?kota=${encodeURIComponent(terdekat.nama)}`);
      },
      (err) => {
        const pesan =
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Anda tetap bisa memilih kota lewat kotak pencarian."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Lokasi perangkat tidak dapat ditentukan saat ini."
              : "Pencarian lokasi memakan waktu terlalu lama.";
        setKeadaan({ jenis: "gagal", pesan });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  const sedang = keadaan.jenis === "mencari";

  return (
    <div className={ringkas ? "relative" : undefined}>
      <button
        type="button"
        onClick={cari}
        disabled={sedang}
        title="Gunakan lokasi perangkat — koordinat tidak dikirim ke mana pun"
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-pill border border-line bg-surface font-bold text-ink-2 transition-colors hover:border-brand-400 hover:text-brand-700 disabled:opacity-60",
          ringkas ? "size-9" : "h-11 px-4 text-[13px]",
        )}
      >
        {sedang ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <LocateFixed className="size-4" strokeWidth={2.5} aria-hidden />
        )}
        {ringkas ? (
          <span className="sr-only">Gunakan lokasi saya</span>
        ) : (
          <span>{sedang ? "Mencari…" : "Lokasi saya"}</span>
        )}
      </button>

      {keadaan.jenis === "gagal" || keadaan.jenis === "jauh" ? (
        <div
          role="status"
          className={cn(
            "z-50 mt-2 rounded-card border border-line bg-surface p-3.5 shadow-float",
            ringkas ? "absolute right-0 top-full w-[260px]" : "w-full max-w-sm",
          )}
        >
          {keadaan.jenis === "gagal" ? (
            <p className="text-[12.5px] leading-relaxed text-ink-2">
              {keadaan.pesan}
            </p>
          ) : (
            <>
              <p className="text-[12.5px] leading-relaxed text-ink-2">
                Kota pantauan terdekat adalah{" "}
                <strong className="font-bold text-ink">{keadaan.kota}</strong>,
                tetapi jaraknya sekitar {keadaan.jarak} km dari posisi Anda —
                cuacanya bisa jauh berbeda.
              </p>
              <button
                type="button"
                onClick={() => {
                  const k = keadaan.kota;
                  setKeadaan({ jenis: "diam" });
                  router.push(`/dashboard?kota=${encodeURIComponent(k)}`);
                }}
                className="mt-2.5 inline-flex h-9 items-center rounded-pill bg-brand-600 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-brand-700"
              >
                Buka {keadaan.kota}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setKeadaan({ jenis: "diam" })}
            className="mt-2 block text-[11.5px] font-semibold text-ink-3 hover:text-ink"
          >
            Tutup
          </button>
        </div>
      ) : null}
    </div>
  );
}
