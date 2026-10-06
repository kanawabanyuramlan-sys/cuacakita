import type { KategoriCuaca } from "./wmo";

/**
 * Bentuk data kanonik CuacaKita.
 *
 * Setiap adapter sumber data (Open-Meteo, BMKG, atau sumber lain di masa
 * depan) WAJIB menghasilkan bentuk ini. Seluruh aplikasi — mesin dampak,
 * grafik, peta — hanya bicara dengan tipe di berkas ini, tidak pernah
 * langsung dengan bentuk mentah milik penyedia.
 */

/** Asal-usul sebuah angka. Selalu ditampilkan ke pengguna, tidak pernah disembunyikan. */
export type SumberData = {
  id: "open-meteo" | "bmkg" | "demo";
  nama: string;
  /** Resmi = lembaga pemerintah. Memengaruhi label yang ditampilkan. */
  resmi: boolean;
  /** Kapan penyedia menghasilkan data ini (bukan kapan kita mengambilnya). */
  diperbaruiPada: string;
  keterangan: string;
};

export type Lokasi = {
  nama: string;
  /** Nama administratif lengkap bila tersedia, mis. "Cihapit, Bandung Wetan, Kota Bandung". */
  wilayah?: string;
  provinsi?: string;
  lat: number;
  lon: number;
  /** Meter di atas permukaan laut. Dipakai mesin dampak sebagai pendekatan kasar topografi. */
  elevasi?: number;
  zonaWaktu: string;
  /** Kode wilayah BMKG tingkat desa/kelurahan, bila lokasi ini punya padanannya. */
  adm4?: string;
};

export type CuacaSaatIni = {
  waktu: string;
  suhu: number;
  terasaSeperti: number;
  kelembapan: number;
  /** mm pada jam berjalan. */
  presipitasi: number;
  kodeCuaca: number;
  labelCuaca: string;
  kategori: KategoriCuaca;
  tutupanAwan: number;
  tekanan: number;
  anginKecepatan: number;
  anginArah: number;
  anginHembusan: number;
  /** Meter. Open-Meteo mengirim meter; nilai di atas 24 km berarti "sangat jernih". */
  visibilitas: number | null;
  indeksUV: number | null;
  siang: boolean;
};

export type JamCuaca = {
  waktu: string;
  suhu: number;
  presipitasi: number;
  peluangHujan: number | null;
  kelembapan: number;
  anginKecepatan: number;
  kodeCuaca: number;
  kategori: KategoriCuaca;
  labelCuaca: string;
};

export type HariCuaca = {
  tanggal: string;
  suhuMin: number;
  suhuMaks: number;
  presipitasi: number;
  jamHujan: number | null;
  peluangHujanMaks: number | null;
  anginMaks: number;
  anginHembusanMaks: number;
  indeksUVMaks: number | null;
  kodeCuaca: number;
  kategori: KategoriCuaca;
  labelCuaca: string;
  matahariTerbit: string | null;
  matahariTerbenam: string | null;
};

/** Satu paket lengkap yang dikonsumsi seluruh halaman. */
export type PaketCuaca = {
  lokasi: Lokasi;
  sekarang: CuacaSaatIni;
  perJam: JamCuaca[];
  harian: HariCuaca[];
  sumber: SumberData;
  diambilPada: string;
};

/** Prakiraan resmi BMKG, ditampilkan berdampingan — bukan menggantikan. */
export type PrakiraanBMKG = {
  lokasi: {
    provinsi: string;
    kotkab: string;
    kecamatan: string;
    desa: string;
    adm4: string;
    lat: number;
    lon: number;
  };
  entri: {
    waktuLokal: string;
    suhu: number;
    kelembapan: number;
    presipitasi: number;
    tutupanAwan: number;
    deskripsi: string;
    kategori: KategoriCuaca;
    anginKecepatan: number;
    anginArah: string;
    visibilitas: string | null;
  }[];
  dianalisisPada: string;
  sumber: SumberData;
};
