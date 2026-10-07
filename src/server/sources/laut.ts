import "server-only";

import { jarakKm } from "@/lib/lokasi";

/**
 * Adapter Open-Meteo Marine.
 *
 * Satu temuan penting dari pengujian langsung: API ini menjawab HTTP 200
 * untuk titik DARATAN juga, tetapi mengembalikan `wave_height: null` dan
 * elevasi bukan nol. Jadi ia tidak pernah mengarang angka untuk daratan —
 * dan kita bisa memakai null itu sendiri untuk menemukan laut.
 *
 * Caranya: dari sebuah kota, dikirim enam belas titik calon sekaligus
 * (delapan arah mata angin pada dua jarak) dalam SATU permintaan. Yang
 * menjawab dengan angka berarti benar-benar perairan; diambil yang
 * terdekat. Kota yang tidak punya satu pun titik laut dalam jangkauan
 * memang bukan kota pesisir, dan panel nelayan tidak ditampilkan untuknya.
 */

const BASIS = "https://marine-api.open-meteo.com/v1/marine";

/** Delapan arah mata angin, dalam derajat dari utara. */
const ARAH = [0, 45, 90, 135, 180, 225, 270, 315];

/** Dua cincin jarak. Lebih dari 45 km dari laut bukan lagi kota pesisir. */
const JARAK_KM = [18, 45];

export type KondisiLaut = {
  /** Titik perairan yang benar-benar menjawab, bukan posisi kotanya. */
  lat: number;
  lon: number;
  jarakDariKota: number;
  arah: string;
  tinggiGelombang: number;
  arahGelombang: number;
  periodeGelombang: number | null;
  tinggiSwell: number | null;
  tinggiGelombangAngin: number | null;
  /** Tinggi maksimum harian, tiga hari ke depan. */
  harian: { tanggal: string; maksimum: number }[];
  diambilPada: string;
};

const MATA_ANGIN = [
  "utara", "timur laut", "timur", "tenggara",
  "selatan", "barat daya", "barat", "barat laut",
];

function geser(lat: number, lon: number, derajat: number, km: number) {
  const rad = (derajat * Math.PI) / 180;
  const dLat = (km / 111.32) * Math.cos(rad);
  const dLon =
    (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(rad);
  return { lat: lat + dLat, lon: lon + dLon };
}

type RespLaut = {
  latitude: number;
  longitude: number;
  elevation?: number;
  current?: {
    wave_height: number | null;
    wave_direction: number | null;
    wave_period: number | null;
    wind_wave_height: number | null;
    swell_wave_height: number | null;
  };
  daily?: {
    time?: string[];
    wave_height_max?: (number | null)[];
  };
};

export async function cariKondisiLaut(
  lat: number,
  lon: number,
): Promise<KondisiLaut | null> {
  const calon = JARAK_KM.flatMap((km) =>
    ARAH.map((d, i) => ({ ...geser(lat, lon, d, km), km, arah: MATA_ANGIN[i] })),
  );

  const url = new URL(BASIS);
  url.searchParams.set("latitude", calon.map((c) => c.lat.toFixed(3)).join(","));
  url.searchParams.set("longitude", calon.map((c) => c.lon.toFixed(3)).join(","));
  url.searchParams.set(
    "current",
    "wave_height,wave_direction,wave_period,wind_wave_height,swell_wave_height",
  );
  url.searchParams.set("daily", "wave_height_max");
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("timezone", "auto");

  let r: Response;
  try {
    // Satu jam: model gelombang tidak berubah secepat prakiraan per jam,
    // dan panel ini pelengkap — tidak layak menghabiskan kuota.
    r = await fetch(url, { next: { revalidate: 3600 } });
  } catch {
    return null;
  }
  if (!r.ok) return null;

  let mentah: RespLaut | RespLaut[];
  try {
    mentah = (await r.json()) as RespLaut | RespLaut[];
  } catch {
    return null;
  }
  const larik = Array.isArray(mentah) ? mentah : [mentah];

  // Hanya titik yang benar-benar perairan: elevasi nol DAN tinggi
  // gelombang berupa angka. Keduanya diperiksa, bukan salah satu.
  const sah = larik
    .map((x, i) => ({ x, c: calon[i] }))
    .filter(
      ({ x }) =>
        x.elevation === 0 &&
        typeof x.current?.wave_height === "number" &&
        Number.isFinite(x.current.wave_height),
    )
    .sort((a, b) => a.c.km - b.c.km);

  const pilih = sah[0];
  if (!pilih) return null;

  const c = pilih.x.current!;
  const waktu = pilih.x.daily?.time ?? [];
  const maks = pilih.x.daily?.wave_height_max ?? [];

  return {
    lat: pilih.x.latitude,
    lon: pilih.x.longitude,
    jarakDariKota: Math.round(
      jarakKm(lat, lon, pilih.x.latitude, pilih.x.longitude),
    ),
    arah: pilih.c.arah,
    tinggiGelombang: c.wave_height as number,
    arahGelombang: c.wave_direction ?? 0,
    periodeGelombang: c.wave_period,
    tinggiSwell: c.swell_wave_height,
    tinggiGelombangAngin: c.wind_wave_height,
    harian: waktu.map((t, i) => ({
      tanggal: t,
      maksimum: typeof maks[i] === "number" ? (maks[i] as number) : 0,
    })),
    diambilPada: new Date().toISOString(),
  };
}
