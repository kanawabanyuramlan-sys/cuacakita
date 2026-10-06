import dataWilayah from "@/data/wilayah.json";
import type { Lokasi } from "@/lib/weather/types";

/**
 * Daftar kota yang punya padanan kode wilayah BMKG.
 *
 * Berkas src/data/wilayah.json dihasilkan oleh scripts/bangun-wilayah.mjs,
 * dan setiap kode adm4 di dalamnya sudah diuji langsung ke BMKG. Kota di
 * luar daftar ini tetap bisa dicari lewat Open-Meteo — hanya panel
 * prakiraan resmi BMKG yang tidak tersedia untuk lokasi tersebut.
 */

export type KotaTerdaftar = {
  nama: string;
  tipe: "kota" | "kabupaten";
  provinsi: string;
  lat: number;
  lon: number;
  adm4: string;
  wilayahBMKG: string;
};

export const daftarKota = dataWilayah.kota as KotaTerdaftar[];

export const wilayahDibuatPada = dataWilayah.dibuatPada as string;

/** Lokasi yang dipakai bila pengguna belum memilih apa pun. */
export const LOKASI_BAWAAN = "Bandung";

export function cariKota(nama: string): KotaTerdaftar | undefined {
  const t = nama.trim().toLowerCase();
  return (
    daftarKota.find((k) => k.nama.toLowerCase() === t) ??
    daftarKota.find((k) => k.nama.toLowerCase().includes(t))
  );
}

export function kotaKeLokasi(k: KotaTerdaftar): Lokasi {
  return {
    nama: k.nama,
    wilayah: k.wilayahBMKG,
    provinsi: k.provinsi,
    lat: k.lat,
    lon: k.lon,
    zonaWaktu: "Asia/Jakarta",
    adm4: k.adm4,
  };
}

/** Kota terdaftar terdekat dari sebuah titik, dipakai untuk mencarikan padanan BMKG. */
export function kotaTerdekat(
  lat: number,
  lon: number,
  maksKm = 40,
): KotaTerdaftar | undefined {
  let terbaik: { k: KotaTerdaftar; jarak: number } | undefined;
  for (const k of daftarKota) {
    const jarak = jarakKm(lat, lon, k.lat, k.lon);
    if (!terbaik || jarak < terbaik.jarak) terbaik = { k, jarak };
  }
  return terbaik && terbaik.jarak <= maksKm ? terbaik.k : undefined;
}

/** Jarak lingkaran besar dalam kilometer (rumus haversine). */
export function jarakKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
