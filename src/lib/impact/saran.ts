import type { Kondisi, SkorDampak } from "./engine";
import type { PaketCuaca } from "@/lib/weather/types";

/**
 * Saran bahasa sehari-hari.
 *
 * Bagian pertama yang dibaca orang yang baru membuka CuacaKita bukan angka,
 * melainkan satu kalimat yang bisa langsung ditindaklanjuti: perlu bawa
 * payung atau tidak, aman berkendara atau tidak.
 *
 * Aturan menulisnya:
 * - Tanpa istilah teknis. Tidak ada "mm", "hPa", "indeks", atau "skor".
 * - Satu kalimat utama, satu kalimat tindakan. Tidak lebih.
 * - Tidak pernah menakut-nakuti melebihi yang ditunjukkan data.
 */

export type Nada = "aman" | "siaga" | "waspada";

export type SaranHarian = {
  nada: Nada;
  /** Satu kalimat: apa yang terjadi. */
  judul: string;
  /** Satu kalimat: apa yang sebaiknya dilakukan. */
  tindakan: string;
  /** Tiga hal ringkas yang paling berguna, tanpa jargon. */
  poin: { label: string; nilai: string }[];
};

/** Jam berikutnya yang diprakirakan hujan, bila ada dalam 12 jam ke depan. */
function hujanBerikutnya(paket: PaketCuaca) {
  const t0 = new Date(paket.sekarang.waktu).getTime();
  const calon = paket.perJam.find((j) => {
    const t = new Date(j.waktu).getTime();
    return t > t0 && t <= t0 + 12 * 3600 * 1000 && j.presipitasi >= 0.5;
  });
  if (!calon) return null;
  const d = new Date(calon.waktu);
  return {
    jam: `${String(d.getHours()).padStart(2, "0")}.00`,
    deras: calon.presipitasi >= 5,
    mm: calon.presipitasi,
  };
}

export function susunSaran(
  paket: PaketCuaca,
  kondisi: Kondisi,
  sektor: SkorDampak[],
): SaranHarian {
  const transportasi = sektor.find((s) => s.id === "transportasi")?.skor ?? 0;
  const banjir = sektor.find((s) => s.id === "banjir")?.skor ?? 0;
  const longsor = sektor.find((s) => s.id === "longsor")?.skor ?? 0;
  const berikut = hujanBerikutnya(paket);
  const tertinggi = Math.max(transportasi, banjir, longsor);

  let nada: Nada = "aman";
  let judul: string;
  let tindakan: string;

  if (banjir >= 50 || longsor >= 50) {
    nada = "waspada";
    judul =
      banjir >= longsor
        ? "Hujan deras cukup lama — daerah rendah berpotensi tergenang."
        : "Hujan sudah beberapa hari — lereng dan tebing jadi rawan.";
    tindakan =
      "Hindari daerah rawan, siapkan barang penting di tempat tinggi, dan ikuti pengumuman resmi BMKG serta BPBD.";
  } else if (transportasi >= 50) {
    nada = "waspada";
    judul = "Perjalanan hari ini lebih berisiko dari biasanya.";
    tindakan =
      "Kurangi kecepatan, nyalakan lampu, dan tunda perjalanan jauh dengan motor bila memungkinkan.";
  } else if (berikut?.deras) {
    nada = "siaga";
    judul = `Hujan cukup deras diperkirakan sekitar pukul ${berikut.jam}.`;
    tindakan =
      "Bawa payung atau jas hujan, dan selesaikan urusan di luar sebelum jam tersebut bila bisa.";
  } else if (berikut) {
    nada = "siaga";
    judul = `Kemungkinan hujan ringan sekitar pukul ${berikut.jam}.`;
    tindakan = "Siapkan payung kalau akan keluar rumah sore nanti.";
  } else if (kondisi.hariKeringBerturut >= 7) {
    nada = "siaga";
    judul = `Sudah ${kondisi.hariKeringBerturut} hari tidak turun hujan di sini.`;
    tindakan =
      "Hemat air dan siram tanaman pada pagi atau sore agar tidak cepat menguap.";
  } else if (kondisi.suhuMaks >= 34) {
    nada = "siaga";
    judul = "Siang ini terasa panas.";
    tindakan =
      "Perbanyak minum dan hindari bekerja di bawah matahari langsung pada tengah hari.";
  } else if (tertinggi >= 25) {
    nada = "siaga";
    judul = "Cuaca sebagian besar baik, tapi ada hal kecil yang perlu diperhatikan.";
    tindakan = "Lihat rincian di bawah untuk tahu bagian mana yang terpengaruh.";
  } else {
    nada = "aman";
    judul = "Cuaca hari ini aman untuk kegiatan seperti biasa.";
    tindakan =
      "Tidak ada yang perlu dikhawatirkan dari sisi cuaca untuk beberapa jam ke depan.";
  }

  /* Tiga poin tanpa jargon */
  const poin: { label: string; nilai: string }[] = [
    {
      label: "Perlu bawa payung?",
      nilai: berikut
        ? `Ya, sekitar pukul ${berikut.jam}`
        : kondisi.hujan24j >= 1
          ? "Sebaiknya bawa"
          : "Sepertinya tidak perlu",
    },
    {
      label: "Aman berkendara?",
      nilai:
        transportasi >= 50
          ? "Hati-hati, jalan bisa licin"
          : transportasi >= 25
            ? "Cukup aman, tetap waspada"
            : "Aman seperti biasa",
    },
    {
      label: "Jemuran cepat kering?",
      nilai:
        kondisi.hujan24j >= 5
          ? "Tidak, kemungkinan kehujanan"
          : kondisi.kelembapan >= 85
            ? "Lambat, udara sangat lembap"
            : "Ya, cukup cepat",
    },
  ];

  return { nada, judul, tindakan, poin };
}
