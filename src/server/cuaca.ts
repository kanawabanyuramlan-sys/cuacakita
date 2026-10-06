import "server-only";

import { ambilCuaca, cariLokasi, GagalAmbilCuaca } from "./sources/open-meteo";
import { ambilPrakiraanBMKG } from "./sources/bmkg";
import { hitungDampak, type Kondisi, type SkorDampak } from "@/lib/impact/engine";
import {
  cariKota,
  kotaKeLokasi,
  kotaTerdekat,
  LOKASI_BAWAAN,
  type KotaTerdaftar,
} from "@/lib/lokasi";
import type { PaketCuaca, PrakiraanBMKG } from "@/lib/weather/types";

/**
 * Orkestrasi satu permintaan halaman.
 *
 * Open-Meteo adalah tulang punggung: kalau ia gagal, halaman tidak punya
 * data dan kegagalan itu dilempar ke atas untuk ditangani error state.
 * BMKG bersifat pelengkap: kegagalannya tidak pernah menjatuhkan halaman,
 * hanya menyembunyikan panel prakiraan resmi.
 */

export type DataHalaman = {
  cuaca: PaketCuaca;
  bmkg: PrakiraanBMKG | null;
  kondisi: Kondisi;
  sektor: SkorDampak[];
  kota?: KotaTerdaftar;
  /** Alasan panel BMKG tidak tampil, untuk ditampilkan apa adanya ke pengguna. */
  catatanBMKG?: string;
};

export { GagalAmbilCuaca };

export async function muatHalaman(namaKota?: string): Promise<DataHalaman> {
  const kota = cariKota(namaKota ?? LOKASI_BAWAAN) ?? cariKota(LOKASI_BAWAAN);

  let lokasi;
  if (kota) {
    lokasi = kotaKeLokasi(kota);
  } else {
    // Bukan kota terdaftar: cari lewat geocoding, lalu coba carikan
    // padanan BMKG dari kota terdaftar terdekat.
    const hasil = await cariLokasi(namaKota ?? LOKASI_BAWAAN, 1);
    if (hasil.length === 0) {
      throw new GagalAmbilCuaca(`Lokasi "${namaKota}" tidak ditemukan`);
    }
    lokasi = hasil[0];
    const dekat = kotaTerdekat(lokasi.lat, lokasi.lon);
    if (dekat) lokasi.adm4 = dekat.adm4;
  }

  // 3 hari ke belakang dipakai mesin dampak untuk menilai kejenuhan tanah
  // dan menghitung hari kering berturut-turut.
  const cuaca = await ambilCuaca(lokasi, { hariKeDepan: 7, hariKeBelakang: 3 });

  // BMKG dipanggil berbarengan tapi kegagalannya ditelan di dalam adapter.
  const bmkg = lokasi.adm4 ? await ambilPrakiraanBMKG(lokasi.adm4) : null;

  const { kondisi, sektor } = hitungDampak(cuaca);

  return {
    cuaca,
    bmkg,
    kondisi,
    sektor,
    kota,
    catatanBMKG: !lokasi.adm4
      ? "Lokasi ini belum punya padanan kode wilayah BMKG."
      : !bmkg
        ? "Prakiraan resmi BMKG sedang tidak dapat diambil."
        : undefined,
  };
}
