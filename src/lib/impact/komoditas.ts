import type { Kondisi } from "./engine";
import { tingkatDari, type Tingkat } from "./engine";

/**
 * Profil kepekaan komoditas terhadap cuaca.
 *
 * PENTING, dan harus disampaikan apa adanya kepada pengguna: angka
 * kepekaan di bawah ini adalah PERKIRAAN INDIKATIF yang disusun dari
 * pengetahuan budidaya yang umum diketahui — bukan hasil model agronomi
 * yang sudah tervalidasi lapangan, dan bukan anjuran teknis resmi.
 *
 * Gunanya adalah menjawab "komoditas mana yang paling perlu diperhatikan
 * saat cuaca seperti sekarang", bukan memperkirakan hasil panen.
 *
 * Setiap nilai berada pada rentang 0–1:
 *   0   = cuaca jenis itu praktis tidak mengganggu
 *   1   = komoditas ini termasuk yang paling cepat terdampak
 */

export type JenisKomoditas = "pertanian" | "perkebunan";

export type Tekanan = {
  /** Hujan berlebih: lahan tergenang, panen tertunda, buah rontok. */
  hujanBerlebih: number;
  /** Udara lembap berkepanjangan: penyakit jamur dan busuk. */
  kelembapan: number;
  /** Angin kencang: tanaman rebah, cabang patah. */
  angin: number;
  /** Suhu tinggi: pembungaan dan pengisian terganggu. */
  panas: number;
  /** Rentetan hari tanpa hujan: air tanah menipis. */
  kekeringan: number;
};

export type Komoditas = {
  id: string;
  nama: string;
  jenis: JenisKomoditas;
  ikon: string;
  peka: Tekanan;
  /** Satu kalimat bahasa sehari-hari tentang kelemahan utamanya. */
  catatan: string;
  /** Tahap yang paling rawan, agar petani tahu kapan harus waspada. */
  faseRawan: string;
};

export const KOMODITAS: Komoditas[] = [
  {
    id: "padi",
    nama: "Padi",
    jenis: "pertanian",
    ikon: "🌾",
    peka: { hujanBerlebih: 0.7, kelembapan: 0.6, angin: 0.85, panas: 0.5, kekeringan: 0.8 },
    catatan:
      "Tahan air saat masih tumbuh, tetapi hujan dan angin saat menjelang panen mudah merebahkan batang.",
    faseRawan: "Menjelang dan saat panen",
  },
  {
    id: "jagung",
    nama: "Jagung",
    jenis: "pertanian",
    ikon: "🌽",
    peka: { hujanBerlebih: 0.6, kelembapan: 0.5, angin: 0.7, panas: 0.6, kekeringan: 0.85 },
    catatan:
      "Paling cepat merasakan kekurangan air; batangnya juga mudah roboh saat angin kencang.",
    faseRawan: "Saat berbunga dan mengisi tongkol",
  },
  {
    id: "cabai",
    nama: "Cabai",
    jenis: "pertanian",
    ikon: "🌶️",
    peka: { hujanBerlebih: 0.9, kelembapan: 0.9, angin: 0.5, panas: 0.6, kekeringan: 0.6 },
    catatan:
      "Sangat tidak suka lahan becek dan udara lembap — akar membusuk dan buah mudah terserang patek.",
    faseRawan: "Sepanjang masa berbuah",
  },
  {
    id: "bawang-merah",
    nama: "Bawang merah",
    jenis: "pertanian",
    ikon: "🧅",
    peka: { hujanBerlebih: 0.95, kelembapan: 0.9, angin: 0.4, panas: 0.45, kekeringan: 0.5 },
    catatan:
      "Umbinya cepat busuk bila tanah terlalu basah; termasuk yang paling cepat gagal saat hujan beruntun.",
    faseRawan: "Pembentukan umbi sampai panen",
  },
  {
    id: "sayuran-daun",
    nama: "Sayuran daun",
    jenis: "pertanian",
    ikon: "🥬",
    peka: { hujanBerlebih: 0.8, kelembapan: 0.7, angin: 0.6, panas: 0.7, kekeringan: 0.7 },
    catatan:
      "Daunnya mudah rusak oleh hujan deras dan cepat layu saat panas berkepanjangan.",
    faseRawan: "Dua minggu menjelang panen",
  },
  {
    id: "buah",
    nama: "Buah-buahan",
    jenis: "pertanian",
    ikon: "🥭",
    peka: { hujanBerlebih: 0.7, kelembapan: 0.6, angin: 0.75, panas: 0.45, kekeringan: 0.5 },
    catatan:
      "Hujan saat berbunga membuat bunga rontok, dan angin kencang menjatuhkan buah yang hampir matang.",
    faseRawan: "Saat berbunga dan buah mulai tua",
  },
  {
    id: "kopi",
    nama: "Kopi",
    jenis: "perkebunan",
    ikon: "☕",
    peka: { hujanBerlebih: 0.7, kelembapan: 0.7, angin: 0.5, panas: 0.6, kekeringan: 0.7 },
    catatan:
      "Butuh musim kering pendek untuk berbunga serempak; hujan terus-menerus menyulitkan penjemuran biji.",
    faseRawan: "Pembungaan dan pengeringan hasil",
  },
  {
    id: "teh",
    nama: "Teh",
    jenis: "perkebunan",
    ikon: "🍵",
    peka: { hujanBerlebih: 0.4, kelembapan: 0.4, angin: 0.5, panas: 0.75, kekeringan: 0.8 },
    catatan:
      "Menyukai udara sejuk dan lembap; yang justru memukulnya adalah panas dan kemarau panjang.",
    faseRawan: "Musim kering",
  },
  {
    id: "sawit",
    nama: "Kelapa sawit",
    jenis: "perkebunan",
    ikon: "🌴",
    peka: { hujanBerlebih: 0.35, kelembapan: 0.25, angin: 0.5, panas: 0.4, kekeringan: 0.8 },
    catatan:
      "Cukup tahan hujan, tetapi kemarau panjang menurunkan jumlah tandan beberapa bulan kemudian.",
    faseRawan: "Musim kering panjang",
  },
  {
    id: "karet",
    nama: "Karet",
    jenis: "perkebunan",
    ikon: "🌳",
    peka: { hujanBerlebih: 0.9, kelembapan: 0.5, angin: 0.6, panas: 0.3, kekeringan: 0.4 },
    catatan:
      "Penyadapan praktis berhenti saat hujan karena getah tercampur air — hari hujan langsung berarti hari tanpa hasil.",
    faseRawan: "Setiap pagi penyadapan",
  },
  {
    id: "kakao",
    nama: "Kakao",
    jenis: "perkebunan",
    ikon: "🍫",
    peka: { hujanBerlebih: 0.6, kelembapan: 0.85, angin: 0.6, panas: 0.6, kekeringan: 0.7 },
    catatan:
      "Udara lembap berkepanjangan memicu busuk buah, yang bisa menghabiskan hasil satu pohon.",
    faseRawan: "Saat buah mulai membesar",
  },
  {
    id: "tebu",
    nama: "Tebu",
    jenis: "perkebunan",
    ikon: "🎋",
    peka: { hujanBerlebih: 0.5, kelembapan: 0.3, angin: 0.65, panas: 0.35, kekeringan: 0.7 },
    catatan:
      "Hujan menjelang tebang menurunkan kadar gula, sedangkan angin kencang merebahkan batang.",
    faseRawan: "Menjelang tebang",
  },
];

/* ── Perhitungan ──────────────────────────────────────────────────── */

const jepit = (v: number) => Math.max(0, Math.min(1, v));
const norm = (v: number, lo: number, hi: number) => jepit((v - lo) / (hi - lo));

/** Besaran tekanan cuaca saat ini, 0–1, sebelum dikalikan kepekaan. */
export function tekananCuaca(k: Kondisi): Tekanan {
  return {
    hujanBerlebih: Math.max(norm(k.hujan24j, 5, 60), norm(k.hujan72j, 20, 150)),
    kelembapan: norm(k.kelembapan, 72, 95),
    angin: norm(k.hembusanMaks, 28, 70),
    panas: norm(k.suhuMaks, 31, 38),
    kekeringan: norm(k.hariKeringBerturut, 3, 14),
  };
}

export type RisikoKomoditas = {
  komoditas: Komoditas;
  skor: number;
  tingkat: Tingkat;
  /** Tekanan yang paling menentukan skor ini, untuk dijelaskan ke pengguna. */
  penyebab: { nama: string; sumbangan: number; kalimat: string } | null;
};

const LABEL: Record<keyof Tekanan, { nama: string; kalimat: string }> = {
  hujanBerlebih: {
    nama: "Hujan berlebih",
    kalimat: "lahan berpotensi becek dan pekerjaan di kebun tertunda",
  },
  kelembapan: {
    nama: "Udara lembap",
    kalimat: "penyakit jamur dan busuk lebih mudah menyebar",
  },
  angin: {
    nama: "Angin kencang",
    kalimat: "tanaman berisiko rebah dan buah rontok",
  },
  panas: {
    nama: "Suhu tinggi",
    kalimat: "pembungaan dan pengisian hasil bisa terganggu",
  },
  kekeringan: {
    nama: "Kering berkepanjangan",
    kalimat: "ketersediaan air tanah menipis",
  },
};

export function hitungRisikoKomoditas(
  kondisi: Kondisi,
  jenis?: JenisKomoditas,
): RisikoKomoditas[] {
  const t = tekananCuaca(kondisi);
  const daftar = jenis ? KOMODITAS.filter((k) => k.jenis === jenis) : KOMODITAS;

  return daftar
    .map((komoditas) => {
      const bagian = (Object.keys(t) as (keyof Tekanan)[]).map((kunci) => ({
        kunci,
        nilai: t[kunci] * komoditas.peka[kunci],
      }));

      // Skor diambil dari tekanan terberat, bukan rata-rata: satu masalah
      // besar sudah cukup menggagalkan panen, dan merata-ratakannya dengan
      // empat faktor yang sedang tenang akan menyembunyikannya.
      const terberat = bagian.reduce((a, b) => (b.nilai > a.nilai ? b : a));
      const pendukung =
        bagian.reduce((a, b) => a + b.nilai, 0) - terberat.nilai;
      const skor = Math.round(
        jepit(terberat.nilai * 0.75 + (pendukung / 4) * 0.25) * 100,
      );

      return {
        komoditas,
        skor,
        tingkat: tingkatDari(skor),
        penyebab:
          terberat.nilai > 0.05
            ? {
                nama: LABEL[terberat.kunci].nama,
                sumbangan: Math.round(terberat.nilai * 100),
                kalimat: LABEL[terberat.kunci].kalimat,
              }
            : null,
      };
    })
    .sort((a, b) => b.skor - a.skor);
}
