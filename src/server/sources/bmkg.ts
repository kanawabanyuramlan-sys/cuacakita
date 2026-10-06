import "server-only";

import { kategoriDariTeks } from "@/lib/weather/wmo";
import type { PrakiraanBMKG, SumberData } from "@/lib/weather/types";

/**
 * Adapter BMKG — prakiraan resmi pemerintah Indonesia.
 *
 * Tiga kenyataan yang menentukan bentuk berkas ini:
 *
 * 1. BMKG menolak permintaan tanpa header `Referer` yang benar. Karena itu
 *    adapter ini WAJIB berjalan di server; memanggilnya dari browser akan
 *    selalu mendapat 403.
 * 2. BMKG hanya melayani tingkat adm4 (desa/kelurahan). Permintaan pada
 *    adm1/adm2/adm3 ditolak, jadi setiap lokasi harus punya kode adm4.
 *    Daftarnya ada di src/data/wilayah.json, dibangun dan diverifikasi oleh
 *    scripts/bangun-wilayah.mjs.
 * 3. BMKG membatasi laju permintaan. Respons di-cache satu jam, dan
 *    kegagalan dikembalikan sebagai null — BUKAN dilempar — supaya
 *    prakiraan resmi yang absen tidak pernah menjatuhkan seluruh halaman.
 *    Open-Meteo tetap menjadi tulang punggung aplikasi.
 */

const BASIS = "https://api.bmkg.go.id/publik/prakiraan-cuaca";

const KEPALA: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Referer: "https://www.bmkg.go.id/",
  Accept: "application/json",
};

type EntriMentah = {
  local_datetime: string;
  t: number;
  hu: number;
  tp: number;
  tcc: number;
  weather_desc: string;
  ws: number;
  wd: string;
  vs_text: string | null;
  analysis_date: string;
};

type RespBMKG = {
  lokasi?: {
    adm4: string;
    provinsi: string;
    kotkab: string;
    kecamatan: string;
    desa: string;
    lat: number;
    lon: number;
  };
  data?: { cuaca?: EntriMentah[][] }[];
};

function sumber(dianalisisPada: string): SumberData {
  return {
    id: "bmkg",
    nama: "BMKG",
    resmi: true,
    diperbaruiPada: dianalisisPada,
    keterangan:
      "Prakiraan resmi Badan Meteorologi, Klimatologi, dan Geofisika Republik Indonesia.",
  };
}

/**
 * Mengambil prakiraan resmi BMKG untuk satu kelurahan.
 * Mengembalikan null bila BMKG tidak dapat dihubungi, membatasi laju, atau
 * tidak mengenali kode wilayahnya.
 */
export async function ambilPrakiraanBMKG(
  adm4: string,
): Promise<PrakiraanBMKG | null> {
  if (!/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(adm4)) return null;

  let r: Response;
  try {
    r = await fetch(`${BASIS}?adm4=${adm4}`, {
      headers: KEPALA,
      next: { revalidate: 3600 },
    });
  } catch {
    return null;
  }
  if (!r.ok) return null;

  let j: RespBMKG;
  try {
    j = (await r.json()) as RespBMKG;
  } catch {
    return null;
  }

  const lok = j.lokasi;
  const kelompok = j.data?.[0]?.cuaca;
  if (!lok || !Array.isArray(kelompok)) return null;

  // BMKG mengirim prakiraan sebagai larik-dalam-larik (satu larik per hari).
  const mentah = kelompok.flat().filter(Boolean);
  if (mentah.length === 0) return null;

  return {
    lokasi: {
      provinsi: lok.provinsi,
      kotkab: lok.kotkab,
      kecamatan: lok.kecamatan,
      desa: lok.desa,
      adm4: lok.adm4,
      lat: lok.lat,
      lon: lok.lon,
    },
    entri: mentah.map((e) => ({
      waktuLokal: e.local_datetime,
      suhu: e.t,
      kelembapan: e.hu,
      presipitasi: e.tp ?? 0,
      tutupanAwan: e.tcc,
      deskripsi: e.weather_desc,
      kategori: kategoriDariTeks(e.weather_desc ?? ""),
      anginKecepatan: e.ws,
      anginArah: e.wd,
      visibilitas: e.vs_text,
    })),
    dianalisisPada: mentah[0]?.analysis_date ?? "",
    sumber: sumber(mentah[0]?.analysis_date ?? ""),
  };
}
