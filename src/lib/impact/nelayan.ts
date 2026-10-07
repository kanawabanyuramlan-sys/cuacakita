import type { KondisiLaut } from "@/server/sources/laut";
import type { Kondisi } from "./engine";

/**
 * Penilaian kondisi melaut.
 *
 * Berbeda dari modul lain di proyek ini, ambang di sini TIDAK disusun
 * sendiri. Dipakai dua rujukan yang memang menjadi acuan di Indonesia:
 *
 *  1. Klasifikasi tinggi gelombang BMKG (Tenang sampai Sangat Ekstrem).
 *  2. Tabel peringatan BMKG untuk keselamatan pelayaran, yang memasangkan
 *     kecepatan angin dan tinggi gelombang per jenis kapal.
 *
 * Alasannya sederhana: nyawa nelayan terlalu mahal untuk dipertaruhkan
 * pada ambang karangan sendiri. Bila rujukannya sudah ada dan dipakai
 * secara nasional, rujukan itu yang dipakai.
 *
 * Tetap perlu ditegaskan: CuacaKita bukan lembaga peringatan pelayaran.
 * Keputusan melaut harus mengikuti pengumuman resmi BMKG Maritim dan
 * syahbandar setempat.
 */

/** Kelas tinggi gelombang menurut BMKG, dalam meter. */
export const KELAS_GELOMBANG = [
  { nama: "Tenang", batas: 0.1 },
  { nama: "Rendah", batas: 0.5 },
  { nama: "Sedang", batas: 1.25 },
  { nama: "Tinggi", batas: 2.5 },
  { nama: "Sangat Tinggi", batas: 4.0 },
  { nama: "Ekstrem", batas: 6.0 },
  { nama: "Sangat Ekstrem", batas: Infinity },
] as const;

export function kelasGelombang(tinggi: number) {
  return KELAS_GELOMBANG.find((k) => tinggi < k.batas) ?? KELAS_GELOMBANG[6];
}

const KNOT = 1.852; // km/jam per knot

/**
 * Tabel peringatan keselamatan pelayaran BMKG.
 * Peringatan berlaku bila angin DAN gelombang sama-sama melewati ambang.
 */
const KAPAL = [
  { nama: "Perahu nelayan", ikon: "🛶", angin: 15, gelombang: 1.25 },
  { nama: "Kapal tongkang", ikon: "🚤", angin: 16, gelombang: 1.5 },
  { nama: "Kapal feri", ikon: "⛴️", angin: 21, gelombang: 2.5 },
  { nama: "Kapal besar / kargo", ikon: "🚢", angin: 27, gelombang: 4.0 },
] as const;

export type RisikoKapal = {
  nama: string;
  ikon: string;
  aman: boolean;
  ambangAngin: number;
  ambangGelombang: number;
  alasan: string;
};

export type PenilaianLaut = {
  tinggi: number;
  kelas: string;
  anginKnot: number;
  /** Tinggi maksimum tiga hari ke depan, dari model gelombang. */
  puncakHarian: { tanggal: string; maksimum: number; kelas: string }[];
  kapal: RisikoKapal[];
  /** Ringkasan untuk nelayan perahu kecil — kelompok paling rentan. */
  ringkas: string;
  nada: "aman" | "waspada" | "bahaya";
  catatan: string[];
};

export function nilaiKondisiLaut(
  laut: KondisiLaut,
  kondisi: Kondisi,
): PenilaianLaut {
  const tinggi = laut.tinggiGelombang;
  const anginKnot = kondisi.hembusanMaks / KNOT;

  const kapal: RisikoKapal[] = KAPAL.map((k) => {
    // Tabel BMKG memakai "dan": keduanya harus terlampaui.
    const lewatAngin = anginKnot >= k.angin;
    const lewatGelombang = tinggi >= k.gelombang;
    const aman = !(lewatAngin && lewatGelombang);

    return {
      nama: k.nama,
      ikon: k.ikon,
      aman,
      ambangAngin: k.angin,
      ambangGelombang: k.gelombang,
      alasan: aman
        ? lewatGelombang
          ? `Gelombang sudah melewati ${k.gelombang} m, tetapi angin masih di bawah ${k.angin} knot.`
          : lewatAngin
            ? `Angin sudah melewati ${k.angin} knot, tetapi gelombang masih di bawah ${k.gelombang} m.`
            : `Angin dan gelombang masih di bawah ambang (${k.angin} knot, ${k.gelombang} m).`
        : `Angin ${anginKnot.toFixed(0)} knot dan gelombang ${tinggi.toFixed(2)} m sama-sama melewati ambang ${k.angin} knot dan ${k.gelombang} m.`,
    };
  });

  const perahu = kapal[0];
  let nada: PenilaianLaut["nada"];
  let ringkas: string;

  if (!perahu.aman) {
    nada = "bahaya";
    ringkas = `Melaut dengan perahu kecil tidak disarankan. Angin dan gelombang sama-sama melewati ambang peringatan BMKG untuk perahu nelayan.`;
  } else if (tinggi >= 1.25 || anginKnot >= 15) {
    nada = "waspada";
    ringkas =
      tinggi >= 1.25
        ? `Gelombang ${tinggi.toFixed(2)} m tergolong ${kelasGelombang(tinggi).nama.toLowerCase()}. Perahu kecil perlu sangat berhati-hati, terutama saat kembali ke pantai.`
        : `Angin ${anginKnot.toFixed(0)} knot sudah cukup kuat. Gelombang masih rendah, tetapi dapat naik cepat bila angin bertahan.`;
  } else {
    nada = "aman";
    ringkas = `Gelombang ${tinggi.toFixed(2)} m dan angin ${anginKnot.toFixed(0)} knot — keduanya di bawah ambang peringatan untuk perahu nelayan.`;
  }

  const catatan: string[] = [];
  if (laut.periodeGelombang != null && laut.periodeGelombang >= 10) {
    catatan.push(
      `Periode gelombang ${laut.periodeGelombang.toFixed(1)} detik menandakan alun dari laut jauh. Alun panjang terasa landai di tengah laut tetapi meninggi tajam saat mendekati pantai dangkal.`,
    );
  }
  if (
    laut.tinggiSwell != null &&
    laut.tinggiGelombangAngin != null &&
    laut.tinggiSwell > laut.tinggiGelombangAngin * 2 &&
    laut.tinggiSwell >= 0.5
  ) {
    catatan.push(
      "Sebagian besar tinggi gelombang berasal dari alun, bukan dari angin setempat. Laut bisa tampak tenang padahal alunnya tetap ada.",
    );
  }
  if (kondisi.visibilitasKm < 4) {
    catatan.push(
      `Jarak pandang ${kondisi.visibilitasKm.toFixed(1)} km. Pastikan alat navigasi dan lampu berfungsi sebelum berangkat.`,
    );
  }
  if (kondisi.hujanMaksPerJam >= 5) {
    catatan.push(
      "Hujan deras diperkirakan turun. Hujan di laut memperpendek jarak pandang jauh lebih cepat daripada di darat.",
    );
  }

  const puncakHarian = laut.harian.map((h) => ({
    ...h,
    kelas: kelasGelombang(h.maksimum).nama,
  }));

  return {
    tinggi,
    kelas: kelasGelombang(tinggi).nama,
    anginKnot,
    puncakHarian,
    kapal,
    ringkas,
    nada,
    catatan,
  };
}

export const PENAFIAN_LAUT =
  "Ambang pada panel ini mengacu pada klasifikasi tinggi gelombang BMKG dan " +
  "tabel peringatan keselamatan pelayaran BMKG. Data gelombangnya sendiri " +
  "berasal dari model Open-Meteo, bukan dari BMKG. CuacaKita bukan lembaga " +
  "peringatan pelayaran — keputusan melaut harus mengikuti pengumuman resmi " +
  "BMKG Maritim dan syahbandar setempat.";
