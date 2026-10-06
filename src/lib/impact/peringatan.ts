import type { Kondisi, SkorDampak } from "./engine";
import type { PaketCuaca } from "@/lib/weather/types";

/**
 * Sistem peringatan CuacaKita.
 *
 * Istilah resmi BMKG — "Waspada", "Siaga", "Awas" — SENGAJA TIDAK DIPAKAI.
 * Ketiganya punya arti dan konsekuensi hukum tertentu dalam sistem
 * peringatan dini nasional, dan memakainya di sini akan membuat indikator
 * analitis tampak seperti pengumuman pemerintah. Yang dipakai adalah
 * "Perhatian" dan "Penting", dua kata biasa yang tidak bertabrakan dengan
 * tingkatan resmi mana pun.
 *
 * Ambang batasnya sendiri mengacu pada klasifikasi curah hujan BMKG,
 * karena itu memang rujukan yang lazim di Indonesia.
 */

export type TingkatPeringatan = "Perhatian" | "Penting";

export type JenisPeringatan =
  | "hujan-lebat"
  | "hujan-intensitas"
  | "angin-kencang"
  | "suhu-tinggi"
  | "suhu-rendah"
  | "jarak-pandang"
  | "banjir"
  | "longsor"
  | "kekeringan";

export type Peringatan = {
  id: JenisPeringatan;
  tingkat: TingkatPeringatan;
  ikon: string;
  judul: string;
  /** Kalimat untuk pembaca umum, tanpa jargon. */
  isi: string;
  /** Angka yang memicunya, agar pembaca bisa memeriksa sendiri. */
  dasar: string;
  /** Siapa yang paling perlu membacanya. */
  untuk: string[];
};

const mm = (v: number) => (v < 10 ? v.toFixed(1) : v.toFixed(0));

export function susunPeringatan(
  paket: PaketCuaca,
  kondisi: Kondisi,
  sektor: SkorDampak[],
): Peringatan[] {
  const skor = (id: string) => sektor.find((s) => s.id === id)?.skor ?? 0;
  const out: Peringatan[] = [];

  /* Curah hujan harian — mengikuti klasifikasi BMKG */
  if (kondisi.hujan24j >= 50) {
    out.push({
      id: "hujan-lebat",
      tingkat: kondisi.hujan24j >= 100 ? "Penting" : "Perhatian",
      ikon: "🌧️",
      judul:
        kondisi.hujan24j >= 100
          ? "Hujan sangat lebat diperkirakan"
          : "Hujan lebat diperkirakan",
      isi: `Dalam sehari ke depan diperkirakan turun hujan sekitar ${mm(kondisi.hujan24j)} mm. Menurut klasifikasi BMKG, di atas 50 mm per hari tergolong hujan lebat dan di atas 100 mm tergolong sangat lebat.`,
      dasar: `Curah hujan 24 jam: ${mm(kondisi.hujan24j)} mm`,
      untuk: ["Semua warga", "Pengendara", "Petani"],
    });
  }

  /* Intensitas sesaat — yang membuat saluran air kewalahan */
  if (kondisi.hujanMaksPerJam >= 10) {
    out.push({
      id: "hujan-intensitas",
      tingkat: kondisi.hujanMaksPerJam >= 20 ? "Penting" : "Perhatian",
      ikon: "⛈️",
      judul: "Hujan deras dalam waktu singkat",
      isi: `Puncak hujan diperkirakan mencapai ${mm(kondisi.hujanMaksPerJam)} mm dalam satu jam. Hujan sederas ini sering melampaui kemampuan saluran air, sehingga genangan bisa muncul cepat meski totalnya sehari tidak besar.`,
      dasar: `Intensitas tertinggi: ${mm(kondisi.hujanMaksPerJam)} mm/jam`,
      untuk: ["Warga daerah rendah", "Pengendara"],
    });
  }

  /* Angin */
  if (kondisi.hembusanMaks >= 45) {
    out.push({
      id: "angin-kencang",
      tingkat: kondisi.hembusanMaks >= 60 ? "Penting" : "Perhatian",
      ikon: "💨",
      judul: "Hembusan angin kencang",
      isi: `Angin diperkirakan berhembus sampai ${Math.round(kondisi.hembusanMaks)} km/jam. Kecepatan ini berisiko bagi pengendara sepeda motor, atap ringan, papan reklame, serta tanaman tinggi.`,
      dasar: `Hembusan maksimum: ${Math.round(kondisi.hembusanMaks)} km/jam`,
      untuk: ["Pengendara motor", "Petani", "Nelayan"],
    });
  }

  /* Suhu */
  if (kondisi.suhuMaks >= 35) {
    out.push({
      id: "suhu-tinggi",
      tingkat: kondisi.suhuMaks >= 38 ? "Penting" : "Perhatian",
      ikon: "🌡️",
      judul: "Suhu udara tinggi",
      isi: `Suhu tertinggi hari ini diperkirakan ${Math.round(kondisi.suhuMaks)} °C. Pekerja lapangan, lansia, dan ternak paling cepat merasakan dampaknya.`,
      dasar: `Suhu maksimum: ${Math.round(kondisi.suhuMaks)} °C`,
      untuk: ["Pekerja lapangan", "Peternak", "Lansia"],
    });
  }
  if (kondisi.suhuMin <= 16) {
    out.push({
      id: "suhu-rendah",
      tingkat: kondisi.suhuMin <= 12 ? "Penting" : "Perhatian",
      ikon: "❄️",
      judul: "Suhu malam rendah",
      isi: `Suhu terendah diperkirakan ${Math.round(kondisi.suhuMin)} °C. Ternak muda dan tanaman semai perlu perlindungan tambahan pada malam hari.`,
      dasar: `Suhu minimum: ${Math.round(kondisi.suhuMin)} °C`,
      untuk: ["Peternak", "Petani"],
    });
  }

  /* Jarak pandang */
  if (kondisi.visibilitasKm < 2) {
    out.push({
      id: "jarak-pandang",
      tingkat: kondisi.visibilitasKm < 1 ? "Penting" : "Perhatian",
      ikon: "🌫️",
      judul: "Jarak pandang pendek",
      isi: `Jarak pandang sekitar ${kondisi.visibilitasKm.toFixed(1)} km. Nyalakan lampu utama, kurangi kecepatan, dan hindari mendahului.`,
      dasar: `Jarak pandang: ${kondisi.visibilitasKm.toFixed(1)} km`,
      untuk: ["Pengendara", "Pengguna jalan"],
    });
  }

  /* Dampak turunan */
  const banjir = skor("banjir");
  if (banjir >= 50) {
    out.push({
      id: "banjir",
      tingkat: banjir >= 75 ? "Penting" : "Perhatian",
      ikon: "🌊",
      judul: "Indikator potensi genangan meningkat",
      isi: `Gabungan hujan yang sudah turun dan yang akan turun, dikalikan kerentanan dataran rendah, menempatkan indikator genangan di angka ${banjir} dari 100. Pantau saluran air di sekitar rumah dan siapkan barang penting di tempat yang lebih tinggi.`,
      dasar: `Skor banjir ${banjir} · hujan 72 jam terakhir ${mm(kondisi.hujanLalu72j)} mm`,
      untuk: ["Warga daerah rendah", "Pengurus lingkungan"],
    });
  }

  const longsor = skor("longsor");
  if (longsor >= 50) {
    out.push({
      id: "longsor",
      tingkat: longsor >= 75 ? "Penting" : "Perhatian",
      ikon: "⛰️",
      judul: "Indikator risiko longsor meningkat",
      isi: `Lereng di wilayah ini (${kondisi.elevasi.toFixed(0)} mdpl) sudah menerima ${mm(kondisi.hujanLalu72j)} mm hujan dalam tiga hari terakhir. Perhatikan tanda awal seperti retakan tanah, mata air keruh yang baru muncul, atau tiang yang miring.`,
      dasar: `Skor longsor ${longsor} · ${kondisi.hariHujanBerturut} hari hujan berturut-turut`,
      untuk: ["Warga lereng", "Pengguna jalan pegunungan"],
    });
  }

  /* Kekeringan */
  if (kondisi.hariKeringBerturut >= 14) {
    out.push({
      id: "kekeringan",
      tingkat: kondisi.hariKeringBerturut >= 21 ? "Penting" : "Perhatian",
      ikon: "🏜️",
      judul: "Kering berkepanjangan",
      isi: `Sudah ${kondisi.hariKeringBerturut} hari berturut-turut tanpa hujan berarti. Ketersediaan air tanah menurun dan risiko kebakaran lahan meningkat.`,
      dasar: `${kondisi.hariKeringBerturut} hari kering berturut-turut`,
      untuk: ["Petani", "Peternak", "Warga"],
    });
  }

  // Yang paling mendesak lebih dulu.
  const urutan: Record<TingkatPeringatan, number> = { Penting: 0, Perhatian: 1 };
  return out.sort((a, b) => urutan[a.tingkat] - urutan[b.tingkat]);
}

export const PENAFIAN_PERINGATAN =
  "CuacaKita adalah platform analisis informasi, bukan lembaga peringatan dini. " +
  "Peringatan di halaman ini dihitung sendiri dari data cuaca terbuka dan TIDAK " +
  "menggantikan pengumuman resmi. Untuk peringatan dini cuaca dan kebencanaan, " +
  "ikuti BMKG dan BPBD setempat. Dalam keadaan darurat, hubungi 112.";
