import "server-only";

import { ambilCuacaBanyak } from "./sources/open-meteo";
import { hitungDampak, type Tingkat } from "@/lib/impact/engine";
import { daftarKota, kotaKeLokasi } from "@/lib/lokasi";
import type { KategoriCuaca } from "@/lib/weather/wmo";

/**
 * Menyiapkan data satu halaman peta.
 *
 * Seluruh kota diambil dalam SATU permintaan Open-Meteo, lalu mesin dampak
 * dijalankan untuk masing-masing. Hasilnya sengaja dipangkas menjadi bentuk
 * yang ringan: peta hanya butuh titik, angka, dan tingkat — bukan seluruh
 * prakiraan per jam, yang akan membengkakkan muatan ke peramban tanpa guna.
 */

export type TitikPeta = {
  nama: string;
  provinsi: string;
  lat: number;
  lon: number;
  elevasi: number;
  suhu: number;
  labelCuaca: string;
  kategori: KategoriCuaca;
  hujan24j: number;
  hujan72j: number;
  angin: number;
  /** Dipakai daftar peringatan nasional agar ambangnya sama persis. */
  suhuMaks: number;
  hembusanMaks: number;
  kelembapan: number;
  skor: {
    pertanian: number;
    peternakan: number;
    perkebunan: number;
    transportasi: number;
    banjir: number;
    longsor: number;
  };
  tertinggi: { nama: string; skor: number; tingkat: Tingkat };
};

export async function muatPeta(): Promise<{
  titik: TitikPeta[];
  diambilPada: string;
}> {
  const lokasi = daftarKota.map(kotaKeLokasi);
  const paket = await ambilCuacaBanyak(lokasi);

  const titik: TitikPeta[] = paket.map((p, i) => {
    const kota = daftarKota[i];
    const { kondisi, sektor } = hitungDampak(p);
    const urut = [...sektor].sort((a, b) => b.skor - a.skor);
    const atas = urut[0];

    return {
      nama: kota.nama,
      provinsi: kota.provinsi,
      lat: p.lokasi.lat,
      lon: p.lokasi.lon,
      elevasi: p.lokasi.elevasi ?? 0,
      suhu: Math.round(p.sekarang.suhu * 10) / 10,
      labelCuaca: p.sekarang.labelCuaca,
      kategori: p.sekarang.kategori,
      hujan24j: Math.round(kondisi.hujan24j * 10) / 10,
      hujan72j: Math.round(kondisi.hujan72j * 10) / 10,
      angin: Math.round(p.sekarang.anginKecepatan),
      suhuMaks: Math.round(kondisi.suhuMaks * 10) / 10,
      hembusanMaks: Math.round(kondisi.hembusanMaks),
      kelembapan: p.sekarang.kelembapan,
      skor: {
        pertanian: sektor.find((s) => s.id === "pertanian")?.skor ?? 0,
        peternakan: sektor.find((s) => s.id === "peternakan")?.skor ?? 0,
        perkebunan: sektor.find((s) => s.id === "perkebunan")?.skor ?? 0,
        transportasi: sektor.find((s) => s.id === "transportasi")?.skor ?? 0,
        banjir: sektor.find((s) => s.id === "banjir")?.skor ?? 0,
        longsor: sektor.find((s) => s.id === "longsor")?.skor ?? 0,
      },
      tertinggi: { nama: atas.nama, skor: atas.skor, tingkat: atas.tingkat },
    };
  });

  return { titik, diambilPada: new Date().toISOString() };
}
