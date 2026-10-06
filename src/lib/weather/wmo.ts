/**
 * Pemetaan kode cuaca WMO 4677 (dipakai Open-Meteo) ke bahasa Indonesia.
 *
 * BMKG memakai kode yang sebagian besar sejalan dengan WMO, tetapi BMKG
 * sudah mengirim `weather_desc` sendiri — untuk BMKG kita pakai teksnya
 * langsung dan hanya memetakan kategorinya lewat tabel ini.
 */

export type KategoriCuaca =
  | "cerah"
  | "cerah-berawan"
  | "berawan"
  | "kabut"
  | "gerimis"
  | "hujan"
  | "hujan-lebat"
  | "badai"
  | "salju";

export type InfoCuaca = {
  kode: number;
  label: string;
  kategori: KategoriCuaca;
};

const TABEL: Record<number, { label: string; kategori: KategoriCuaca }> = {
  0: { label: "Cerah", kategori: "cerah" },
  1: { label: "Cerah Berawan", kategori: "cerah-berawan" },
  2: { label: "Berawan Sebagian", kategori: "cerah-berawan" },
  3: { label: "Berawan", kategori: "berawan" },
  45: { label: "Berkabut", kategori: "kabut" },
  48: { label: "Kabut Beku", kategori: "kabut" },
  51: { label: "Gerimis Ringan", kategori: "gerimis" },
  53: { label: "Gerimis Sedang", kategori: "gerimis" },
  55: { label: "Gerimis Lebat", kategori: "gerimis" },
  56: { label: "Gerimis Beku Ringan", kategori: "gerimis" },
  57: { label: "Gerimis Beku Lebat", kategori: "gerimis" },
  61: { label: "Hujan Ringan", kategori: "hujan" },
  63: { label: "Hujan Sedang", kategori: "hujan" },
  65: { label: "Hujan Lebat", kategori: "hujan-lebat" },
  66: { label: "Hujan Beku Ringan", kategori: "hujan" },
  67: { label: "Hujan Beku Lebat", kategori: "hujan-lebat" },
  71: { label: "Salju Ringan", kategori: "salju" },
  73: { label: "Salju Sedang", kategori: "salju" },
  75: { label: "Salju Lebat", kategori: "salju" },
  77: { label: "Butiran Salju", kategori: "salju" },
  80: { label: "Hujan Lokal Ringan", kategori: "hujan" },
  81: { label: "Hujan Lokal Sedang", kategori: "hujan" },
  82: { label: "Hujan Lokal Lebat", kategori: "hujan-lebat" },
  85: { label: "Hujan Salju Ringan", kategori: "salju" },
  86: { label: "Hujan Salju Lebat", kategori: "salju" },
  95: { label: "Badai Petir", kategori: "badai" },
  96: { label: "Badai Petir disertai Hujan Es", kategori: "badai" },
  99: { label: "Badai Petir disertai Hujan Es Lebat", kategori: "badai" },
};

export function bacaKodeCuaca(kode: number): InfoCuaca {
  const t = TABEL[kode] ?? { label: "Tidak diketahui", kategori: "berawan" as const };
  return { kode, label: t.label, kategori: t.kategori };
}

/** Kategori dari teks BMKG, karena BMKG memakai penomoran yang tidak selalu sama. */
export function kategoriDariTeks(teks: string): KategoriCuaca {
  const t = teks.toLowerCase();
  if (t.includes("petir") || t.includes("badai")) return "badai";
  if (t.includes("sangat lebat") || t.includes("ekstrem")) return "hujan-lebat";
  if (t.includes("hujan lebat")) return "hujan-lebat";
  if (t.includes("hujan")) return "hujan";
  if (t.includes("gerimis")) return "gerimis";
  if (t.includes("kabut") || t.includes("asap") || t.includes("udara kabur"))
    return "kabut";
  if (t.includes("cerah berawan")) return "cerah-berawan";
  if (t.includes("berawan")) return "berawan";
  if (t.includes("cerah")) return "cerah";
  return "berawan";
}

/** Intensitas hujan menurut klasifikasi BMKG (mm per hari). */
export function klasifikasiHujanHarian(mm: number) {
  if (mm < 0.5) return { label: "Tidak hujan", tingkat: 0 };
  if (mm < 20) return { label: "Hujan ringan", tingkat: 1 };
  if (mm < 50) return { label: "Hujan sedang", tingkat: 2 };
  if (mm < 100) return { label: "Hujan lebat", tingkat: 3 };
  if (mm < 150) return { label: "Hujan sangat lebat", tingkat: 4 };
  return { label: "Hujan ekstrem", tingkat: 5 };
}
