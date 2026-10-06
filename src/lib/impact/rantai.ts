import type { Kondisi, SkorDampak, Tingkat } from "./engine";
import { tingkatDari } from "./engine";

/**
 * Rantai dampak cuaca.
 *
 * CUACA → PERTANIAN → PASOKAN → HARGA → TRANSPORTASI → LINGKUNGAN
 *       → BENCANA → MASYARAKAT
 *
 * Hal terpenting di berkas ini adalah `keyakinan`. Makin jauh sebuah
 * simpul dari pengukuran cuaca, makin banyak hal lain yang ikut menentukan
 * hasilnya — harga pangan dipengaruhi stok nasional, impor, kebijakan,
 * dan biaya bahan bakar, bukan hanya hujan. Menyembunyikan kenyataan itu
 * akan membuat platform ini terdengar lebih pintar daripada yang
 * sebenarnya, jadi tingkat keyakinan ditampilkan apa adanya pada
 * setiap simpul.
 */

export type Keyakinan = "terukur" | "turunan" | "indikatif";

export const penjelasanKeyakinan: Record<Keyakinan, string> = {
  terukur:
    "Dihitung langsung dari data cuaca terukur dan prakiraan model.",
  turunan:
    "Diturunkan dari skor sektor di atasnya. Faktor non-cuaca belum diperhitungkan.",
  indikatif:
    "Hanya indikasi arah. Banyak faktor di luar cuaca ikut menentukan, sehingga angka ini tidak boleh dibaca sebagai ramalan.",
};

export type SimpulRantai = {
  id: string;
  label: string;
  ikon: string;
  skor: number;
  tingkat: Tingkat;
  keyakinan: Keyakinan;
  ringkas: string;
  rinci: string;
  /** Dari mana angka simpul ini berasal, ditampilkan saat simpul dibuka. */
  dasar: string[];
};

const bulat = (n: number) => Math.round(Math.max(0, Math.min(100, n)));

export function bangunRantai(
  kondisi: Kondisi,
  sektor: SkorDampak[],
  labelCuaca: string,
): SimpulRantai[] {
  const cari = (id: string) => sektor.find((s) => s.id === id)?.skor ?? 0;

  const pertanian = cari("pertanian");
  const peternakan = cari("peternakan");
  const perkebunan = cari("perkebunan");
  const transportasi = cari("transportasi");
  const banjir = cari("banjir");
  const longsor = cari("longsor");

  // Cuaca sebagai pemicu: seberapa JAUH kondisinya dari keadaan biasa.
  //
  // Ambangnya sengaja dimulai dari nilai yang sudah bermakna, bukan dari
  // nol — angin tidak pernah nol, dan hembusan 30 km/jam adalah hari yang
  // biasa saja. Memakai nol sebagai dasar membuat cuaca tenang tampak
  // seperti peristiwa. Ambang di bawah ini sama persis dengan yang dipakai
  // model sektor, supaya simpul cuaca tidak pernah bergerak sendirian.
  const antara = (v: number, lo: number, hi: number) =>
    Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * 100;

  const cuaca = bulat(
    Math.max(
      antara(kondisi.hujan24j, 5, 60),
      antara(kondisi.hujanMaksPerJam, 2, 20),
      antara(kondisi.hembusanMaks, 30, 70),
      antara(kondisi.hariKeringBerturut, 3, 14),
    ),
  );

  // Pasokan terganggu bila produksi DAN distribusi sama-sama tertekan.
  const produksi = Math.max(pertanian, perkebunan, peternakan);
  const pasokan = bulat(produksi * 0.65 + transportasi * 0.35);

  // Harga: hanya sebagian kecil pergerakan harga berasal dari cuaca,
  // jadi sinyalnya sengaja diredam dan diberi label paling lemah.
  const harga = bulat(pasokan * 0.6);

  const lingkungan = banjir;
  const bencana = Math.max(banjir, longsor);
  const masyarakat = bulat(
    transportasi * 0.35 + bencana * 0.4 + pasokan * 0.25,
  );

  const n = (
    id: string,
    label: string,
    ikon: string,
    skor: number,
    keyakinan: Keyakinan,
    ringkas: string,
    rinci: string,
    dasar: string[],
  ): SimpulRantai => ({
    id,
    label,
    ikon,
    skor,
    tingkat: tingkatDari(skor),
    keyakinan,
    ringkas,
    rinci,
    dasar,
  });

  return [
    n(
      "cuaca",
      labelCuaca,
      "🌧️",
      cuaca,
      "terukur",
      `Hujan ${kondisi.hujan24j.toFixed(0)} mm dalam 24 jam, angin hingga ${kondisi.hembusanMaks.toFixed(0)} km/jam.`,
      "Titik awal rantai. Seluruh simpul di bawahnya dihitung dari angka cuaca ini, bukan dari asumsi.",
      [
        `Curah hujan 24 jam: ${kondisi.hujan24j.toFixed(1)} mm`,
        `Hembusan angin maksimum: ${kondisi.hembusanMaks.toFixed(0)} km/jam`,
        `Hari kering berturut-turut: ${kondisi.hariKeringBerturut}`,
      ],
    ),
    n(
      "pertanian",
      "Pertanian",
      "🌾",
      pertanian,
      "terukur",
      pertanian >= 50
        ? "Aktivitas tanam dan panen berpotensi terganggu."
        : "Aktivitas pertanian cenderung dapat berjalan.",
      "Dihitung dari curah hujan, intensitas, kelembapan, angin, suhu, dan rentetan hari kering.",
      ["Enam faktor cuaca dengan bobot tetap", "Lihat rinciannya di modul Pertanian"],
    ),
    n(
      "pasokan",
      "Pasokan",
      "📦",
      pasokan,
      "turunan",
      pasokan >= 50
        ? "Produksi dan distribusi berpotensi sama-sama tertekan."
        : "Ketersediaan pasokan cenderung belum terpengaruh.",
      "Gabungan tekanan pada produksi (pertanian, perkebunan, peternakan) dan hambatan distribusi (transportasi).",
      [
        `Tekanan produksi tertinggi: ${produksi}`,
        `Hambatan distribusi: ${transportasi}`,
        "Bobot: 65% produksi, 35% distribusi",
      ],
    ),
    n(
      "harga",
      "Harga",
      "💰",
      harga,
      "indikatif",
      harga >= 50
        ? "Tekanan pasokan dapat memengaruhi harga komoditas."
        : "Belum terlihat tekanan dari sisi cuaca terhadap harga.",
      "Cuaca hanya SALAH SATU faktor pembentuk harga. Stok, impor, kebijakan, dan biaya distribusi sering lebih menentukan. Angka ini menunjukkan arah tekanan dari sisi cuaca saja, bukan prediksi harga.",
      [
        `Tekanan pasokan: ${pasokan}`,
        "Diredam 40% karena faktor non-cuaca dominan",
        "Tidak terhubung ke data harga pasar mana pun",
      ],
    ),
    n(
      "transportasi",
      "Transportasi",
      "🚚",
      transportasi,
      "terukur",
      transportasi >= 50
        ? "Risiko perjalanan meningkat."
        : "Kondisi perjalanan cenderung normal.",
      "Dihitung dari intensitas hujan, jarak pandang, hembusan angin, dan akumulasi hujan.",
      ["Empat faktor cuaca dengan bobot tetap", "Jarak pandang dan hembusan angin paling menentukan"],
    ),
    n(
      "lingkungan",
      "Lingkungan",
      "🌊",
      lingkungan,
      "terukur",
      lingkungan >= 50
        ? "Potensi genangan meningkat."
        : "Indikator genangan masih rendah.",
      "Hujan sebagai pemicu, dikalikan kerentanan dataran rendah.",
      [`Skor banjir: ${banjir}`, "Elevasi dipakai sebagai pengali kerentanan"],
    ),
    n(
      "bencana",
      "Risiko Bencana",
      "⛰️",
      bencana,
      "terukur",
      bencana >= 50
        ? "Indikator risiko bencana hidrometeorologi meningkat."
        : "Indikator risiko bencana masih rendah.",
      "Nilai tertinggi antara indikator banjir dan longsor. Ini indikator analitis, BUKAN peringatan dini resmi — rujukan resmi tetap BMKG dan BPBD.",
      [`Banjir: ${banjir}`, `Longsor: ${longsor}`, "Diambil nilai tertinggi"],
    ),
    n(
      "masyarakat",
      "Masyarakat",
      "👨‍👩‍👧",
      masyarakat,
      "turunan",
      masyarakat >= 50
        ? "Aktivitas dan mobilitas warga berpotensi terganggu."
        : "Aktivitas warga cenderung dapat berjalan normal.",
      "Gabungan hambatan perjalanan, risiko bencana, dan tekanan pasokan — tiga hal yang paling langsung terasa warga.",
      [
        `Transportasi ${transportasi} (bobot 35%)`,
        `Risiko bencana ${bencana} (bobot 40%)`,
        `Pasokan ${pasokan} (bobot 25%)`,
      ],
    ),
  ];
}
