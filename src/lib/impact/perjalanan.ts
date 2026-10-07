import type { PaketCuaca } from "@/lib/weather/types";
import type { TitikPeta } from "@/server/peta";
import { tingkatDari, type Tingkat } from "./engine";
import { jarakKm } from "@/lib/lokasi";

/**
 * Mode Perjalanan.
 *
 * SEKALI LAGI, TIDAK ADA DATA JALAN. CuacaKita tidak tahu jalur mana yang
 * benar-benar dilewati, tidak tahu kondisi aspalnya, dan tidak memantau
 * lalu lintas.
 *
 * Yang bisa dilakukan: dari 43 kota yang cuacanya memang dipantau, pilih
 * yang letaknya dekat dengan GARIS LURUS antara asal dan tujuan. Kota-kota
 * itu kemungkinan besar berada di sekitar jalur perjalanan. Hasilnya
 * disebut apa adanya — "kota di sekitar garis lurus", bukan "kota yang
 * Anda lewati" — karena rute jalan sebenarnya selalu berbelok.
 */

/* ── Jarak titik ke garis asal–tujuan ─────────────────────────────── */

/**
 * Proyeksi equirectangular di sekitar titik tengah. Untuk jarak ratusan
 * kilometer di lintang Indonesia, kesalahannya jauh lebih kecil daripada
 * ketidakpastian "jalan sebenarnya lewat mana", jadi memakai rumus bola
 * yang lebih berat tidak menambah arti apa pun di sini.
 */
function keBidang(lat: number, lon: number, latTengah: number) {
  const R = 111.32; // km per derajat lintang
  return {
    x: lon * R * Math.cos((latTengah * Math.PI) / 180),
    y: lat * R,
  };
}

type PosisiJalur = { jarakKeGaris: number; kemajuan: number };

function posisiTerhadapJalur(
  titik: { lat: number; lon: number },
  asal: { lat: number; lon: number },
  tujuan: { lat: number; lon: number },
): PosisiJalur {
  const latTengah = (asal.lat + tujuan.lat) / 2;
  const a = keBidang(asal.lat, asal.lon, latTengah);
  const b = keBidang(tujuan.lat, tujuan.lon, latTengah);
  const p = keBidang(titik.lat, titik.lon, latTengah);

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const panjangKuadrat = dx * dx + dy * dy;
  if (panjangKuadrat === 0) {
    return { jarakKeGaris: Math.hypot(p.x - a.x, p.y - a.y), kemajuan: 0 };
  }

  // t = sejauh mana titik ini berada di sepanjang garis asal→tujuan.
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / panjangKuadrat;
  const tJepit = Math.max(0, Math.min(1, t));
  const proyeksiX = a.x + tJepit * dx;
  const proyeksiY = a.y + tJepit * dy;

  return {
    jarakKeGaris: Math.hypot(p.x - proyeksiX, p.y - proyeksiY),
    kemajuan: t,
  };
}

/* ── Singgahan di sepanjang jalur ─────────────────────────────────── */

export type Singgahan = {
  titik: TitikPeta;
  /** Jarak dari garis lurus asal–tujuan, kilometer. */
  simpangan: number;
  /** Jarak dari kota asal, kilometer. */
  dariAsal: number;
  peran: "asal" | "tengah" | "tujuan";
  /**
   * Kota 12 km dari garis dan kota 69 km dari garis sama-sama berguna,
   * tetapi tidak setara. Yang jauh belum tentu benar-benar dilewati, jadi
   * perbedaannya dinyatakan terang-terangan, bukan diratakan.
   */
  kedekatan: "di-jalur" | "dekat-jalur";
  tingkat: Tingkat;
};

const AMBANG_DI_JALUR = 30;

export function kotaDiJalur(
  asal: TitikPeta,
  tujuan: TitikPeta,
  semua: TitikPeta[],
  maksSimpangan = 70,
): Singgahan[] {
  const jarakTotal = jarakKm(asal.lat, asal.lon, tujuan.lat, tujuan.lon);

  const tengah = semua
    .filter((t) => t.nama !== asal.nama && t.nama !== tujuan.nama)
    .map((t) => {
      const { jarakKeGaris, kemajuan } = posisiTerhadapJalur(t, asal, tujuan);
      return { t, jarakKeGaris, kemajuan };
    })
    // Hanya yang benar-benar berada di antara asal dan tujuan, bukan di
    // belakang salah satu ujungnya.
    .filter(
      (x) =>
        x.jarakKeGaris <= maksSimpangan &&
        x.kemajuan > 0.04 &&
        x.kemajuan < 0.96,
    )
    .sort((a, b) => a.kemajuan - b.kemajuan)
    .map(
      (x): Singgahan => ({
        titik: x.t,
        simpangan: Math.round(x.jarakKeGaris),
        dariAsal: Math.round(jarakKm(asal.lat, asal.lon, x.t.lat, x.t.lon)),
        peran: "tengah",
        kedekatan:
          x.jarakKeGaris <= AMBANG_DI_JALUR ? "di-jalur" : "dekat-jalur",
        tingkat: tingkatDari(x.t.skor.transportasi),
      }),
    );

  return [
    {
      titik: asal,
      simpangan: 0,
      dariAsal: 0,
      peran: "asal",
      kedekatan: "di-jalur",
      tingkat: tingkatDari(asal.skor.transportasi),
    },
    ...tengah,
    {
      titik: tujuan,
      simpangan: 0,
      dariAsal: Math.round(jarakTotal),
      peran: "tujuan",
      kedekatan: "di-jalur",
      tingkat: tingkatDari(tujuan.skor.transportasi),
    },
  ];
}

/* ── Jendela waktu berangkat ──────────────────────────────────────── */

export type JamBerangkat = {
  waktu: string;
  jam: string;
  skor: number;
  nilai: "baik" | "sedang" | "buruk";
  alasan: string;
  malam: boolean;
};

const jepit = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const norm = (v: number, lo: number, hi: number) =>
  Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

/**
 * Menilai tiap jam dalam 24 jam ke depan sebagai waktu berangkat.
 *
 * Penilaiannya memakai cuaca di KOTA ASAL. Perjalanan jauh tentu melewati
 * cuaca yang berganti-ganti, dan tanpa data rute maupun waktu tempuh, itu
 * tidak bisa dimodelkan. Karena itu kondisi di sepanjang jalur ditampilkan
 * terpisah sebagai daftar kota, bukan dilebur ke dalam angka ini.
 */
export function jendelaBerangkat(paket: PaketCuaca): JamBerangkat[] {
  const t0 = new Date(paket.sekarang.waktu).getTime();

  return paket.perJam
    .filter((j) => {
      const t = new Date(j.waktu).getTime();
      return t >= t0 && t < t0 + 24 * 3600 * 1000;
    })
    .map((j) => {
      const d = new Date(j.waktu);
      const jam = d.getHours();
      const malam = jam >= 18 || jam < 5;

      const skor = jepit(
        100 -
          norm(j.presipitasi, 0.3, 9) * 55 -
          norm(j.anginKecepatan, 18, 45) * 20 -
          (malam ? 10 : 0) -
          (malam && j.presipitasi >= 1 ? 15 : 0),
      );

      const alasan =
        j.presipitasi >= 4
          ? `Hujan deras ${j.presipitasi.toFixed(1)} mm — jalan licin dan pandangan terbatas.`
          : j.presipitasi >= 0.5
            ? `Hujan ringan ${j.presipitasi.toFixed(1)} mm.`
            : j.anginKecepatan >= 25
              ? `Angin ${Math.round(j.anginKecepatan)} km/jam — hati-hati angin samping.`
              : malam
                ? "Kering, tetapi gelap — jarak pandang alami berkurang."
                : "Kering dan terang.";

      return {
        waktu: j.waktu,
        jam: `${String(jam).padStart(2, "0")}.00`,
        skor: Math.round(skor),
        nilai: skor >= 70 ? "baik" : skor >= 45 ? "sedang" : "buruk",
        alasan,
        malam,
      } satisfies JamBerangkat;
    });
}

/** Rentang jam berurutan terbaik untuk berangkat. */
export function jendelaTerbaik(jam: JamBerangkat[], panjang = 3) {
  if (jam.length < panjang) return null;
  let terbaik = { mulai: 0, rata: -1 };
  for (let i = 0; i + panjang <= jam.length; i++) {
    const potongan = jam.slice(i, i + panjang);
    const rata = potongan.reduce((a, b) => a + b.skor, 0) / panjang;
    if (rata > terbaik.rata) terbaik = { mulai: i, rata };
  }
  const potongan = jam.slice(terbaik.mulai, terbaik.mulai + panjang);
  return {
    mulai: potongan[0],
    selesai: potongan[potongan.length - 1],
    rata: Math.round(terbaik.rata),
  };
}

/* ── Perlengkapan yang perlu disiapkan ────────────────────────────── */

export type Persiapan = { ikon: string; teks: string };

export function susunPersiapan(singgahan: Singgahan[]): Persiapan[] {
  const out: Persiapan[] = [];
  const maksHujan = Math.max(...singgahan.map((s) => s.titik.hujan24j));
  const maksAngin = Math.max(...singgahan.map((s) => s.titik.hembusanMaks));
  const maksTransportasi = Math.max(
    ...singgahan.map((s) => s.titik.skor.transportasi),
  );
  const maksBanjir = Math.max(...singgahan.map((s) => s.titik.skor.banjir));
  const maksLongsor = Math.max(...singgahan.map((s) => s.titik.skor.longsor));
  const elevasiTertinggi = Math.max(...singgahan.map((s) => s.titik.elevasi));

  if (maksHujan >= 2) {
    out.push({
      ikon: "🧥",
      teks: "Bawa jas hujan atau payung — hujan diperkirakan turun di sebagian jalur.",
    });
  }
  if (maksHujan >= 10 || maksTransportasi >= 40) {
    out.push({
      ikon: "🛞",
      teks: "Periksa kondisi ban dan rem sebelum berangkat. Jalan basah memperpanjang jarak pengereman.",
    });
  }
  if (maksAngin >= 40) {
    out.push({
      ikon: "💨",
      teks: `Hembusan sampai ${Math.round(maksAngin)} km/jam di sebagian jalur. Pegang setang lebih mantap dan jaga jarak dari kendaraan tinggi.`,
    });
  }
  if (maksBanjir >= 40) {
    out.push({
      ikon: "🌊",
      teks: "Ada ruas berindikasi genangan. Jangan menerobos genangan yang tidak terlihat dasarnya, dan siapkan rute alternatif.",
    });
  }
  if (maksLongsor >= 40 || elevasiTertinggi >= 600) {
    out.push({
      ikon: "⛰️",
      teks: `Jalur melewati daerah tinggi (sampai ${elevasiTertinggi} mdpl). Waspadai kabut, tikungan licin, dan material di bahu jalan.`,
    });
  }
  out.push({
    ikon: "⏱️",
    teks: "Beri waktu cadangan. CuacaKita tidak memantau lalu lintas — gunakan aplikasi peta dengan kondisi jalan langsung.",
  });

  return out;
}
