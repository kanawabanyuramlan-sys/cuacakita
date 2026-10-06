import type { Kondisi, SkorDampak } from "./engine";
import { tingkatDari, type Tingkat } from "./engine";
import { hitungRisikoKomoditas } from "./komoditas";
import type { Keyakinan } from "./rantai";

/**
 * Rantai cuaca → produksi → pasokan → distribusi → harga.
 *
 * Berkas ini menangani bagian spesifikasi yang paling mudah disalahpahami.
 * Karena itu bentuk datanya MEMAKSA setiap langkah membawa tingkat
 * keyakinannya sendiri, dan langkah "Harga" menyertakan daftar faktor di
 * luar cuaca yang ikut menentukan — supaya tidak ada satu pun tempat di
 * layar yang bisa dibaca sebagai "cuaca begini, harga pasti begitu".
 *
 * CuacaKita TIDAK terhubung ke data harga pasar mana pun. Yang dihitung
 * di sini adalah arah tekanan dari sisi cuaca saja.
 */

export type LangkahPasokan = {
  id: string;
  label: string;
  ikon: string;
  nilai: number;
  tingkat: Tingkat;
  keyakinan: Keyakinan;
  judul: string;
  penjelasan: string;
  rincian: { label: string; nilai: string }[];
  /** Hanya diisi pada langkah Harga: hal-hal yang tidak diketahui CuacaKita. */
  diluarJangkauan?: string[];
};

const bulat = (n: number) => Math.round(Math.max(0, Math.min(100, n)));

export function susunRantaiPasokan(
  kondisi: Kondisi,
  sektor: SkorDampak[],
  namaKota: string,
): { langkah: LangkahPasokan[]; komoditasTeratas: ReturnType<typeof hitungRisikoKomoditas> } {
  const skor = (id: string) => sektor.find((s) => s.id === id)?.skor ?? 0;

  const pertanian = skor("pertanian");
  const perkebunan = skor("perkebunan");
  const peternakan = skor("peternakan");
  const transportasi = skor("transportasi");

  const cuaca = bulat(
    Math.max(
      ((kondisi.hujan24j - 5) / 55) * 100,
      ((kondisi.hembusanMaks - 30) / 40) * 100,
      ((kondisi.hariKeringBerturut - 3) / 11) * 100,
    ),
  );

  const produksi = Math.max(pertanian, perkebunan, peternakan);
  const pasokan = bulat(produksi * 0.65 + transportasi * 0.35);
  const harga = bulat(pasokan * 0.6);

  const komoditas = hitungRisikoKomoditas(kondisi).slice(0, 5);

  const langkah: LangkahPasokan[] = [
    {
      id: "cuaca",
      label: "Cuaca",
      ikon: "🌧️",
      nilai: cuaca,
      tingkat: tingkatDari(cuaca),
      keyakinan: "terukur",
      judul: "Titik awal seluruh rantai",
      penjelasan:
        "Diukur dari seberapa jauh cuaca saat ini menyimpang dari keadaan biasa. Semua langkah di bawahnya dihitung dari angka ini, bukan dari asumsi.",
      rincian: [
        { label: "Hujan 24 jam", nilai: `${kondisi.hujan24j.toFixed(1)} mm` },
        { label: "Hembusan angin", nilai: `${Math.round(kondisi.hembusanMaks)} km/jam` },
        { label: "Hari kering berturut", nilai: `${kondisi.hariKeringBerturut} hari` },
      ],
    },
    {
      id: "produksi",
      label: "Produksi",
      ikon: "🌾",
      nilai: produksi,
      tingkat: tingkatDari(produksi),
      keyakinan: "terukur",
      judul:
        produksi >= 50
          ? "Kegiatan bertani dan berkebun berpotensi terganggu"
          : "Kegiatan produksi cenderung dapat berjalan",
      penjelasan:
        "Diambil dari tekanan tertinggi di antara pertanian, perkebunan, dan peternakan. Satu sektor yang tertekan berat sudah cukup mengurangi hasil, jadi nilainya tidak dirata-ratakan.",
      rincian: [
        { label: "Pertanian", nilai: `${pertanian} dari 100` },
        { label: "Perkebunan", nilai: `${perkebunan} dari 100` },
        { label: "Peternakan", nilai: `${peternakan} dari 100` },
      ],
    },
    {
      id: "distribusi",
      label: "Distribusi",
      ikon: "🚚",
      nilai: transportasi,
      tingkat: tingkatDari(transportasi),
      keyakinan: "terukur",
      judul:
        transportasi >= 50
          ? "Pengangkutan hasil berpotensi tersendat"
          : "Pengangkutan cenderung lancar",
      penjelasan:
        "Hasil panen yang baik tetap tidak sampai ke pasar bila jalannya tergenang atau jarak pandang terlalu pendek untuk truk melintas.",
      rincian: [
        { label: "Intensitas hujan", nilai: `${kondisi.hujanMaksPerJam.toFixed(1)} mm/jam` },
        { label: "Jarak pandang", nilai: `${kondisi.visibilitasKm.toFixed(1)} km` },
        { label: "Hembusan angin", nilai: `${Math.round(kondisi.hembusanMaks)} km/jam` },
      ],
    },
    {
      id: "pasokan",
      label: "Pasokan",
      ikon: "📦",
      nilai: pasokan,
      tingkat: tingkatDari(pasokan),
      keyakinan: "turunan",
      judul:
        pasokan >= 50
          ? "Ketersediaan barang berpotensi menurun"
          : "Ketersediaan cenderung belum terpengaruh",
      penjelasan:
        "Gabungan tekanan produksi dan hambatan distribusi. Ini sudah satu langkah dari pengukuran cuaca, jadi faktor non-cuaca mulai ikut berperan dan belum diperhitungkan di sini.",
      rincian: [
        { label: "Tekanan produksi", nilai: `${produksi} (bobot 65%)` },
        { label: "Hambatan distribusi", nilai: `${transportasi} (bobot 35%)` },
      ],
    },
    {
      id: "harga",
      label: "Harga",
      ikon: "💰",
      nilai: harga,
      tingkat: tingkatDari(harga),
      keyakinan: "indikatif",
      judul:
        harga >= 50
          ? "Ada tekanan ke arah kenaikan harga dari sisi cuaca"
          : "Belum terlihat tekanan harga dari sisi cuaca",
      penjelasan:
        `Cuaca hanya SALAH SATU pembentuk harga pangan di ${namaKota}, dan sering bukan yang paling menentukan. Angka ini menunjukkan arah tekanan dari sisi cuaca saja — bukan ramalan harga, dan tidak boleh dipakai untuk mengambil keputusan jual-beli.`,
      rincian: [
        { label: "Tekanan pasokan", nilai: `${pasokan} dari 100` },
        { label: "Diredam", nilai: "40% karena faktor non-cuaca dominan" },
        { label: "Data harga pasar", nilai: "Tidak terhubung" },
      ],
      diluarJangkauan: [
        "Stok nasional dan cadangan pemerintah",
        "Kebijakan impor dan harga eceran tertinggi",
        "Harga bahan bakar dan biaya angkut",
        "Permintaan musiman, misalnya menjelang hari besar",
        "Kondisi panen di daerah pemasok lain",
        "Rantai perdagangan dan perilaku pedagang",
      ],
    },
  ];

  return { langkah, komoditasTeratas: komoditas };
}
