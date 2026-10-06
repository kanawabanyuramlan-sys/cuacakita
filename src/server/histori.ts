import "server-only";

import { GagalAmbilCuaca } from "./sources/open-meteo";
import { cariKota, kotaKeLokasi, LOKASI_BAWAAN } from "@/lib/lokasi";

/**
 * Histori cuaca harian.
 *
 * Memakai endpoint prakiraan Open-Meteo dengan `past_days`, yang menyimpan
 * sampai 92 hari ke belakang — cukup untuk tampilan harian, mingguan, dan
 * bulanan tanpa perlu endpoint arsip terpisah.
 *
 * Periode pembanding diambil dari rentang yang SAMA PANJANG tepat sebelum
 * periode berjalan, supaya perbandingannya adil. Membandingkan 30 hari
 * terakhir dengan "bulan lalu" kalender akan membandingkan panjang periode
 * yang berbeda.
 */

const BASIS = "https://api.open-meteo.com/v1/forecast";

export type HariHistori = {
  tanggal: string;
  suhuMin: number;
  suhuMaks: number;
  hujan: number;
  kelembapan: number;
  anginMaks: number;
};

export type Histori = {
  kota: string;
  provinsi: string;
  rentangHari: number;
  hari: HariHistori[];
  sekarang: { hujan: number; suhuRata: number; kelembapanRata: number };
  sebelumnya: { hujan: number; suhuRata: number; kelembapanRata: number };
};

export const RENTANG = [7, 30, 90] as const;
export type Rentang = (typeof RENTANG)[number];

type Resp = {
  daily: Record<string, (number | string | null)[]>;
};

const rata = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const total = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export async function muatHistori(
  namaKota: string | undefined,
  rentang: Rentang,
): Promise<Histori> {
  const kota = cariKota(namaKota ?? LOKASI_BAWAAN) ?? cariKota(LOKASI_BAWAAN);
  if (!kota) throw new GagalAmbilCuaca("Lokasi tidak dikenali");
  const lokasi = kotaKeLokasi(kota);

  // Dua kali rentang: separuh untuk periode berjalan, separuh pembanding.
  const diminta = Math.min(rentang * 2, 92);

  const url = new URL(BASIS);
  url.searchParams.set("latitude", lokasi.lat.toFixed(4));
  url.searchParams.set("longitude", lokasi.lon.toFixed(4));
  url.searchParams.set(
    "daily",
    [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "relative_humidity_2m_mean",
      "wind_speed_10m_max",
    ].join(","),
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("past_days", String(diminta));
  url.searchParams.set("forecast_days", "1");

  let r: Response;
  try {
    // Satu jam: data historis harian tidak berubah secepat prakiraan.
    r = await fetch(url, { next: { revalidate: 3600 } });
  } catch (e) {
    throw new GagalAmbilCuaca("Tidak dapat menghubungi layanan cuaca", e);
  }
  if (!r.ok) throw new GagalAmbilCuaca(`Layanan cuaca menolak permintaan (${r.status})`);

  const j = (await r.json()) as Resp;
  const tanggal = (j.daily.time as string[]) ?? [];

  const angka = (k: string, i: number) => {
    const v = j.daily[k]?.[i];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  };

  const semua: HariHistori[] = tanggal.map((t, i) => ({
    tanggal: t,
    suhuMaks: Math.round(angka("temperature_2m_max", i) * 10) / 10,
    suhuMin: Math.round(angka("temperature_2m_min", i) * 10) / 10,
    hujan: Math.round(angka("precipitation_sum", i) * 10) / 10,
    kelembapan: Math.round(angka("relative_humidity_2m_mean", i)),
    anginMaks: Math.round(angka("wind_speed_10m_max", i)),
  }));

  // Hari terakhir adalah hari berjalan yang belum lengkap — dibuang supaya
  // tidak terbaca seolah curah hujannya anjlok.
  const lengkap = semua.slice(0, -1);
  const hari = lengkap.slice(-rentang);
  const banding = lengkap.slice(-(rentang * 2), -rentang);

  const ringkas = (xs: HariHistori[]) => ({
    hujan: Math.round(total(xs.map((x) => x.hujan)) * 10) / 10,
    suhuRata: Math.round(rata(xs.map((x) => (x.suhuMin + x.suhuMaks) / 2)) * 10) / 10,
    kelembapanRata: Math.round(rata(xs.map((x) => x.kelembapan))),
  });

  return {
    kota: kota.nama,
    provinsi: kota.provinsi,
    rentangHari: rentang,
    hari,
    sekarang: ringkas(hari),
    sebelumnya: ringkas(banding),
  };
}
