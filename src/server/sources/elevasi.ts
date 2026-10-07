import "server-only";

import { GagalAmbilCuaca } from "./open-meteo";

/**
 * Pengambilan peta ketinggian di sekitar sebuah titik.
 *
 * Open-Meteo menyediakan API elevasi terpisah yang menerima sampai 100
 * koordinat sekaligus. Satu permintaan cukup untuk membangun kisi 9×9 di
 * sekitar kota — dan dari kisi itulah cekungan yang benar-benar rendah
 * dapat dihitung, bukan ditebak.
 *
 * Ini DATA KETINGGIAN TANAH, bukan data jalan, bukan data saluran air,
 * dan bukan catatan banjir. Keterbatasan itu harus ikut disampaikan di
 * mana pun hasilnya ditampilkan.
 */

const BASIS = "https://api.open-meteo.com/v1/elevation";

/** 9×9 = 81 titik, aman di bawah batas 100 koordinat per permintaan. */
const SISI = 9;

/** ~0,012° ≈ 1,3 km. Kisi menutup wilayah sekitar 10×10 km. */
const JARAK = 0.012;

export type SelKisi = {
  lat: number;
  lon: number;
  elevasi: number;
  baris: number;
  kolom: number;
};

export type KisiElevasi = {
  pusat: { lat: number; lon: number };
  sisi: number;
  jarak: number;
  sel: SelKisi[];
};

export async function ambilKisiElevasi(
  lat: number,
  lon: number,
): Promise<KisiElevasi | null> {
  const tengah = (SISI - 1) / 2;
  const sel: Omit<SelKisi, "elevasi">[] = [];

  for (let b = 0; b < SISI; b++) {
    for (let k = 0; k < SISI; k++) {
      sel.push({
        lat: lat + (b - tengah) * JARAK,
        lon: lon + (k - tengah) * JARAK,
        baris: b,
        kolom: k,
      });
    }
  }

  const url = new URL(BASIS);
  url.searchParams.set("latitude", sel.map((s) => s.lat.toFixed(4)).join(","));
  url.searchParams.set("longitude", sel.map((s) => s.lon.toFixed(4)).join(","));

  let r: Response;
  try {
    // Ketinggian tanah praktis tidak berubah; disimpan sehari penuh.
    r = await fetch(url, { next: { revalidate: 86_400 } });
  } catch {
    // Analisis topografi bersifat pelengkap — kegagalannya tidak boleh
    // menjatuhkan halaman, cukup menyembunyikan bagiannya.
    return null;
  }
  if (!r.ok) return null;

  let j: { elevation?: number[] };
  try {
    j = (await r.json()) as { elevation?: number[] };
  } catch {
    return null;
  }

  const elev = j.elevation;
  if (!Array.isArray(elev) || elev.length !== sel.length) return null;

  return {
    pusat: { lat, lon },
    sisi: SISI,
    jarak: JARAK,
    sel: sel.map((s, i) => ({ ...s, elevasi: elev[i] })),
  };
}

export { GagalAmbilCuaca };
