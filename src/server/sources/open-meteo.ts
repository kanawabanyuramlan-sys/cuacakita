import "server-only";

import { bacaKodeCuaca } from "@/lib/weather/wmo";
import type {
  HariCuaca,
  JamCuaca,
  Lokasi,
  PaketCuaca,
  SumberData,
} from "@/lib/weather/types";

/**
 * Adapter Open-Meteo.
 *
 * Dipilih sebagai mesin utama karena memberi data nyata tanpa API key:
 * tidak ada rahasia yang perlu disimpan, dan aplikasi tetap hidup di
 * Vercel bahkan sebelum satu variabel environment pun diisi.
 *
 * Open-Meteo juga mengembalikan elevasi titik, yang dipakai mesin dampak
 * sebagai pendekatan kasar topografi untuk risiko banjir dan longsor.
 */

const BASIS = "https://api.open-meteo.com/v1/forecast";
const BASIS_GEO = "https://geocoding-api.open-meteo.com/v1/search";

const VAR_SEKARANG = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "is_day",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "visibility",
] as const;

const VAR_PER_JAM = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "precipitation_probability",
  "weather_code",
  "wind_speed_10m",
  "uv_index",
] as const;

const VAR_HARIAN = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_hours",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "uv_index_max",
  "sunrise",
  "sunset",
] as const;

type RespForecast = {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current: Record<string, number | string>;
  hourly: Record<string, (number | string | null)[]>;
  daily: Record<string, (number | string | null)[]>;
};

type RespGeo = {
  results?: {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    timezone: string;
    country_code: string;
    country: string;
    admin1?: string;
    admin2?: string;
    population?: number;
  }[];
};

export class GagalAmbilCuaca extends Error {
  constructor(
    message: string,
    readonly sebab?: unknown,
  ) {
    super(message);
    this.name = "GagalAmbilCuaca";
  }
}

function angkaAman(v: unknown, cadangan = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : cadangan;
}

function sumber(waktuModel: string): SumberData {
  return {
    id: "open-meteo",
    nama: "Open-Meteo",
    resmi: false,
    diperbaruiPada: waktuModel,
    keterangan:
      "Prakiraan model cuaca global terbuka. Bukan peringatan resmi pemerintah.",
  };
}

/** Cari lokasi berdasarkan nama. Dibatasi Indonesia agar hasilnya relevan. */
export async function cariLokasi(
  kueri: string,
  batas = 8,
): Promise<Lokasi[]> {
  const teks = kueri.trim();
  if (teks.length < 2) return [];

  const url = new URL(BASIS_GEO);
  url.searchParams.set("name", teks);
  url.searchParams.set("count", String(Math.min(batas * 3, 30)));
  url.searchParams.set("language", "id");
  url.searchParams.set("format", "json");
  url.searchParams.set("countryCode", "ID");

  const r = await fetch(url, { next: { revalidate: 86_400 } });
  if (!r.ok) throw new GagalAmbilCuaca(`Pencarian lokasi gagal (${r.status})`);

  const j = (await r.json()) as RespGeo;
  return (j.results ?? [])
    .filter((x) => x.country_code === "ID")
    .slice(0, batas)
    .map((x) => ({
      nama: x.name,
      wilayah: [x.admin2, x.admin1].filter(Boolean).join(", ") || undefined,
      provinsi: x.admin1,
      lat: x.latitude,
      lon: x.longitude,
      elevasi: x.elevation,
      zonaWaktu: x.timezone,
    }));
}

/**
 * Mengambil banyak lokasi sekaligus.
 *
 * Open-Meteo menerima daftar koordinat yang dipisah koma dan membalas
 * dengan larik. Untuk peta 43 kota, ini berarti SATU permintaan jaringan,
 * bukan 43 — perbedaannya menentukan apakah halaman peta bisa dimuat
 * dalam waktu wajar atau tidak sama sekali.
 *
 * Rentang waktunya sengaja dipersempit (3 hari ke depan, 3 ke belakang)
 * supaya muatan responsnya tetap masuk akal; mesin dampak hanya butuh
 * sampai 72 jam.
 */
export async function ambilCuacaBanyak(
  daftar: (Pick<Lokasi, "lat" | "lon" | "nama"> & Partial<Lokasi>)[],
): Promise<PaketCuaca[]> {
  if (daftar.length === 0) return [];

  const url = new URL(BASIS);
  url.searchParams.set("latitude", daftar.map((l) => l.lat.toFixed(4)).join(","));
  url.searchParams.set("longitude", daftar.map((l) => l.lon.toFixed(4)).join(","));
  url.searchParams.set("current", VAR_SEKARANG.join(","));
  url.searchParams.set("hourly", VAR_PER_JAM.join(","));
  url.searchParams.set("daily", VAR_HARIAN.join(","));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("past_days", "3");

  let r: Response;
  try {
    r = await fetch(url, { next: { revalidate: 900 } });
  } catch (e) {
    throw new GagalAmbilCuaca("Tidak dapat menghubungi layanan cuaca", e);
  }
  if (!r.ok) {
    throw new GagalAmbilCuaca(`Layanan cuaca menolak permintaan (${r.status})`);
  }

  const mentah = (await r.json()) as RespForecast | RespForecast[];
  const larik = Array.isArray(mentah) ? mentah : [mentah];

  return larik.map((j, i) => bentukPaket(j, daftar[i] ?? daftar[0]));
}

export async function ambilCuaca(
  lokasi: Pick<Lokasi, "lat" | "lon" | "nama"> & Partial<Lokasi>,
  opsi?: { hariKeDepan?: number; hariKeBelakang?: number },
): Promise<PaketCuaca> {
  const url = new URL(BASIS);
  url.searchParams.set("latitude", lokasi.lat.toFixed(4));
  url.searchParams.set("longitude", lokasi.lon.toFixed(4));
  url.searchParams.set("current", VAR_SEKARANG.join(","));
  url.searchParams.set("hourly", VAR_PER_JAM.join(","));
  url.searchParams.set("daily", VAR_HARIAN.join(","));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", String(opsi?.hariKeDepan ?? 7));
  if (opsi?.hariKeBelakang) {
    url.searchParams.set("past_days", String(opsi.hariKeBelakang));
  }

  let r: Response;
  try {
    // 15 menit: sama dengan irama pembaruan Open-Meteo, jadi tidak ada
    // permintaan yang terbuang tanpa membuat angka terlihat basi.
    r = await fetch(url, { next: { revalidate: 900 } });
  } catch (e) {
    throw new GagalAmbilCuaca("Tidak dapat menghubungi layanan cuaca", e);
  }
  if (!r.ok) {
    throw new GagalAmbilCuaca(`Layanan cuaca menolak permintaan (${r.status})`);
  }

  return bentukPaket((await r.json()) as RespForecast, lokasi);
}

/** Mengubah respons mentah Open-Meteo menjadi bentuk kanonik CuacaKita. */
function bentukPaket(
  j: RespForecast,
  lokasi: Pick<Lokasi, "lat" | "lon" | "nama"> & Partial<Lokasi>,
): PaketCuaca {
  const c = j.current;
  const info = bacaKodeCuaca(angkaAman(c.weather_code));

  // Indeks UV tidak ada pada blok `current`; diambil dari jam terdekat.
  const jamSekarang = String(c.time ?? "").slice(0, 13);
  const idxJam = (j.hourly.time as string[]).findIndex((t) =>
    t.startsWith(jamSekarang),
  );
  const uvSekarang =
    idxJam >= 0 ? (j.hourly.uv_index?.[idxJam] as number | null) : null;

  const perJam: JamCuaca[] = (j.hourly.time as string[]).map((t, i) => {
    const kode = angkaAman(j.hourly.weather_code?.[i]);
    const ic = bacaKodeCuaca(kode);
    return {
      waktu: t,
      suhu: angkaAman(j.hourly.temperature_2m?.[i]),
      presipitasi: angkaAman(j.hourly.precipitation?.[i]),
      peluangHujan: (j.hourly.precipitation_probability?.[i] as number) ?? null,
      kelembapan: angkaAman(j.hourly.relative_humidity_2m?.[i]),
      anginKecepatan: angkaAman(j.hourly.wind_speed_10m?.[i]),
      kodeCuaca: kode,
      kategori: ic.kategori,
      labelCuaca: ic.label,
    };
  });

  const harian: HariCuaca[] = (j.daily.time as string[]).map((t, i) => {
    const kode = angkaAman(j.daily.weather_code?.[i]);
    const ic = bacaKodeCuaca(kode);
    return {
      tanggal: t,
      suhuMin: angkaAman(j.daily.temperature_2m_min?.[i]),
      suhuMaks: angkaAman(j.daily.temperature_2m_max?.[i]),
      presipitasi: angkaAman(j.daily.precipitation_sum?.[i]),
      jamHujan: (j.daily.precipitation_hours?.[i] as number) ?? null,
      peluangHujanMaks:
        (j.daily.precipitation_probability_max?.[i] as number) ?? null,
      anginMaks: angkaAman(j.daily.wind_speed_10m_max?.[i]),
      anginHembusanMaks: angkaAman(j.daily.wind_gusts_10m_max?.[i]),
      indeksUVMaks: (j.daily.uv_index_max?.[i] as number) ?? null,
      kodeCuaca: kode,
      kategori: ic.kategori,
      labelCuaca: ic.label,
      matahariTerbit: (j.daily.sunrise?.[i] as string) ?? null,
      matahariTerbenam: (j.daily.sunset?.[i] as string) ?? null,
    };
  });

  return {
    lokasi: {
      nama: lokasi.nama,
      wilayah: lokasi.wilayah,
      provinsi: lokasi.provinsi,
      lat: j.latitude,
      lon: j.longitude,
      elevasi: j.elevation,
      zonaWaktu: j.timezone,
      adm4: lokasi.adm4,
    },
    sekarang: {
      waktu: String(c.time),
      suhu: angkaAman(c.temperature_2m),
      terasaSeperti: angkaAman(c.apparent_temperature),
      kelembapan: angkaAman(c.relative_humidity_2m),
      presipitasi: angkaAman(c.precipitation),
      kodeCuaca: info.kode,
      labelCuaca: info.label,
      kategori: info.kategori,
      tutupanAwan: angkaAman(c.cloud_cover),
      tekanan: angkaAman(c.pressure_msl),
      anginKecepatan: angkaAman(c.wind_speed_10m),
      anginArah: angkaAman(c.wind_direction_10m),
      anginHembusan: angkaAman(c.wind_gusts_10m),
      visibilitas: typeof c.visibility === "number" ? c.visibility : null,
      indeksUV: typeof uvSekarang === "number" ? uvSekarang : null,
      siang: angkaAman(c.is_day) === 1,
    },
    perJam,
    harian,
    sumber: sumber(String(c.time)),
    diambilPada: new Date().toISOString(),
  };
}
