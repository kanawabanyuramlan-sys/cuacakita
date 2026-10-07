import type { KisiElevasi, SelKisi } from "@/server/sources/elevasi";
import type { Kondisi } from "./engine";
import { tingkatDari, type Tingkat } from "./engine";
import { jarakKm } from "@/lib/lokasi";

/**
 * Analisis cekungan dari kisi ketinggian.
 *
 * MENGAPA BUKAN NAMA JALAN. Permintaan yang paling sering muncul adalah
 * "sebutkan jalan mana yang harus dihindari". CuacaKita tidak punya data
 * jaringan jalan, tidak punya catatan titik banjir per ruas, dan tidak
 * punya data saluran air maupun lalu lintas. Menyebut nama jalan tertentu
 * berarti mengarang, dan karangan semacam itu berbahaya: orang bisa
 * memutar ke jalan yang justru lebih buruk.
 *
 * Yang BISA dihitung sungguhan adalah bentuk tanah. Satu titik yang lebih
 * rendah daripada sekelilingnya memang menampung air lebih lama — itu
 * geografi, bukan tebakan. Jadi yang disampaikan adalah ARAH dan JARAK
 * dari pusat kota, bukan nama jalan.
 *
 * Metodenya adalah bentuk sederhana dari Topographic Position Index:
 * selisih ketinggian satu sel terhadap rata-rata tetangganya.
 */

export type AreaRendah = {
  lat: number;
  lon: number;
  elevasi: number;
  /** Seberapa dalam dibanding sekelilingnya, dalam meter. Selalu positif. */
  kedalaman: number;
  /** Arah mata angin dari pusat kota. */
  arah: string;
  jarakKm: number;
  skor: number;
  tingkat: Tingkat;
};

export type AnalisisTopografi = {
  area: AreaRendah[];
  elevasiTerendah: number;
  elevasiTertinggi: number;
  bedaTinggi: number;
  /** true bila wilayahnya memang datar — tidak ada cekungan berarti. */
  relatifDatar: boolean;
};

const MATA_ANGIN = [
  "utara",
  "timur laut",
  "timur",
  "tenggara",
  "selatan",
  "barat daya",
  "barat",
  "barat laut",
];

function arahDari(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  // 0° = utara, memutar searah jarum jam.
  let sudut = (Math.atan2(dLon, dLat) * 180) / Math.PI;
  if (sudut < 0) sudut += 360;
  return MATA_ANGIN[Math.round(sudut / 45) % 8];
}

/** Rata-rata ketinggian tetangga dalam radius satu sel. */
function rataTetangga(sel: SelKisi[], sisi: number, b: number, k: number) {
  const indeks = (bb: number, kk: number) => bb * sisi + kk;
  const nilai: number[] = [];
  for (let db = -1; db <= 1; db++) {
    for (let dk = -1; dk <= 1; dk++) {
      if (db === 0 && dk === 0) continue;
      const bb = b + db;
      const kk = k + dk;
      if (bb < 0 || bb >= sisi || kk < 0 || kk >= sisi) continue;
      nilai.push(sel[indeks(bb, kk)].elevasi);
    }
  }
  return nilai.reduce((a, c) => a + c, 0) / nilai.length;
}

export function analisisTopografi(
  kisi: KisiElevasi,
  kondisi: Kondisi,
): AnalisisTopografi {
  const { sel, sisi, pusat } = kisi;
  const semua = sel.map((s) => s.elevasi);
  const terendah = Math.min(...semua);
  const tertinggi = Math.max(...semua);
  const bedaTinggi = tertinggi - terendah;

  // Pemicu hujan dipakai sebagai pengali: cekungan sedalam apa pun tidak
  // menggenang kalau tidak ada air yang turun.
  const pemicu = Math.min(
    1,
    Math.max(
      (kondisi.hujan24j - 5) / 55,
      (kondisi.hujanMaksPerJam - 2) / 18,
      (kondisi.hujanLalu72j - 20) / 100,
      0,
    ),
  );

  const kandidat: AreaRendah[] = [];

  for (const s of sel) {
    // Tepi kisi tidak punya tetangga lengkap, jadi nilainya tidak andal.
    if (s.baris === 0 || s.kolom === 0 || s.baris === sisi - 1 || s.kolom === sisi - 1) {
      continue;
    }

    const sekitar = rataTetangga(sel, sisi, s.baris, s.kolom);
    const kedalaman = sekitar - s.elevasi;
    if (kedalaman < 2) continue; // bukan cekungan berarti

    // Kedalaman 2–25 m dipetakan ke 0–1, lalu dikalikan pemicu hujan.
    const dalam = Math.min(1, (kedalaman - 2) / 23);
    const skor = Math.round(dalam * pemicu * 100);

    kandidat.push({
      lat: s.lat,
      lon: s.lon,
      elevasi: Math.round(s.elevasi),
      kedalaman: Math.round(kedalaman * 10) / 10,
      arah: arahDari(pusat.lat, pusat.lon, s.lat, s.lon),
      jarakKm: Math.round(jarakKm(pusat.lat, pusat.lon, s.lat, s.lon) * 10) / 10,
      skor,
      tingkat: tingkatDari(skor),
    });
  }

  // Satu arah cukup diwakili cekungan terdalamnya, supaya daftarnya tidak
  // penuh oleh sel-sel bertetangga yang sebenarnya satu lembah yang sama.
  const perArah = new Map<string, AreaRendah>();
  for (const a of kandidat.sort((x, y) => y.kedalaman - x.kedalaman)) {
    if (!perArah.has(a.arah)) perArah.set(a.arah, a);
  }

  return {
    area: [...perArah.values()].sort((a, b) => b.kedalaman - a.kedalaman).slice(0, 5),
    elevasiTerendah: Math.round(terendah),
    elevasiTertinggi: Math.round(tertinggi),
    bedaTinggi: Math.round(bedaTinggi),
    relatifDatar: bedaTinggi < 15,
  };
}
