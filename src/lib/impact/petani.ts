import type { PaketCuaca } from "@/lib/weather/types";
import type { Kondisi } from "./engine";
import { tingkatDari, type Tingkat } from "./engine";
import { hitungRisikoKomoditas, KOMODITAS, type Komoditas } from "./komoditas";

/**
 * Mode Petani.
 *
 * Petani tidak bertanya "berapa milimeter hujan besok". Yang ditanyakan
 * adalah "kapan saya bisa menyemprot", "aman tidak memupuk minggu ini",
 * dan "hari mana yang cukup kering untuk panen". Berkas ini menjawab
 * pertanyaan-pertanyaan itu dari prakiraan per jam yang sudah ada.
 *
 * BATASAN YANG HARUS DISAMPAIKAN. Penilaian di sini disusun dari praktik
 * budidaya yang umum diketahui — bukan rekomendasi agronomi resmi, bukan
 * pengganti penyuluh pertanian, dan tidak memperhitungkan varietas, umur
 * tanaman, jenis tanah, maupun jenis bahan yang dipakai. Petani yang
 * mengenal lahannya sendiri tetap pemegang keputusan.
 */

/* ── Fase tanam ───────────────────────────────────────────────────── */

export const FASE = [
  "persiapan",
  "tanam",
  "vegetatif",
  "berbunga",
  "panen",
] as const;

export type FaseTanam = (typeof FASE)[number];

export const LABEL_FASE: Record<
  FaseTanam,
  { nama: string; namaTahunan: string; catatan: string; pengali: number }
> = {
  persiapan: {
    nama: "Persiapan lahan",
    namaTahunan: "Perawatan kebun",
    catatan: "Hujan pada tahap ini jarang merugikan, bahkan sering membantu melunakkan tanah.",
    pengali: 0.5,
  },
  tanam: {
    nama: "Tanam / semai",
    namaTahunan: "Penyulaman",
    catatan: "Bibit muda rentan pada dua sisi: hanyut saat hujan deras, mati saat kering.",
    pengali: 0.9,
  },
  vegetatif: {
    nama: "Masa tumbuh",
    namaTahunan: "Pemeliharaan",
    catatan: "Tahap paling tahan. Yang perlu dijaga terutama kelembapan berlebih.",
    pengali: 0.8,
  },
  berbunga: {
    nama: "Berbunga / berbuah",
    namaTahunan: "Berbunga / berbuah",
    catatan: "Tahap paling rawan. Hujan dan angin saat berbunga langsung merontokkan calon hasil.",
    pengali: 1.25,
  },
  panen: {
    nama: "Menjelang panen",
    namaTahunan: "Panen",
    catatan: "Hujan menunda panen, menyulitkan pengeringan, dan menurunkan mutu hasil.",
    pengali: 1.35,
  },
};

export const KOMODITAS_TAHUNAN = new Set([
  "kopi", "teh", "sawit", "karet", "kakao", "tebu",
]);

export function namaFase(idKomoditas: string, fase: FaseTanam) {
  const l = LABEL_FASE[fase];
  return KOMODITAS_TAHUNAN.has(idKomoditas) ? l.namaTahunan : l.nama;
}

/* ── Risiko per komoditas, disesuaikan fase ───────────────────────── */

export type RisikoPetani = {
  komoditas: Komoditas;
  fase: FaseTanam;
  namaFase: string;
  skorDasar: number;
  skor: number;
  tingkat: Tingkat;
  penyebab: string | null;
  catatanFase: string;
};

export function hitungRisikoPetani(
  kondisi: Kondisi,
  pilihan: { id: string; fase: FaseTanam }[],
): RisikoPetani[] {
  const dasar = new Map(
    hitungRisikoKomoditas(kondisi).map((r) => [r.komoditas.id, r]),
  );

  return pilihan
    .map((p) => {
      const r = dasar.get(p.id);
      if (!r) return null;
      const l = LABEL_FASE[p.fase];
      const skor = Math.min(100, Math.round(r.skor * l.pengali));
      return {
        komoditas: r.komoditas,
        fase: p.fase,
        namaFase: namaFase(p.id, p.fase),
        skorDasar: r.skor,
        skor,
        tingkat: tingkatDari(skor),
        penyebab: r.penyebab
          ? `${r.penyebab.nama} — ${r.penyebab.kalimat}`
          : null,
        catatanFase: l.catatan,
      } satisfies RisikoPetani;
    })
    .filter((x): x is RisikoPetani => x !== null)
    .sort((a, b) => b.skor - a.skor);
}

/* ── Jadwal kerja kebun tujuh hari ────────────────────────────────── */

export type NilaiHari = "baik" | "sedang" | "buruk";

export type HariKerja = {
  tanggal: string;
  label: string;
  hariIni: boolean;
  skor: number;
  nilai: NilaiHari;
  alasan: string;
};

export type JadwalKerja = {
  id: string;
  nama: string;
  ikon: string;
  keterangan: string;
  hari: HariKerja[];
  terbaik: HariKerja | null;
};

const jepit = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const norm = (v: number, lo: number, hi: number) =>
  Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

type RingkasHari = {
  tanggal: string;
  hujan: number;
  hujanSiang: number;
  anginRata: number;
  hembusan: number;
  suhuMaks: number;
  kelembapanRata: number;
  jamKeringSiang: number;
};

function ringkasPerHari(paket: PaketCuaca): RingkasHari[] {
  const hariIni = paket.sekarang.waktu.slice(0, 10);

  return paket.harian
    .filter((h) => h.tanggal >= hariIni)
    .slice(0, 7)
    .map((h) => {
      // Jam kerja kebun: 06.00–18.00.
      const siang = paket.perJam.filter((j) => {
        if (!j.waktu.startsWith(h.tanggal)) return false;
        const jam = new Date(j.waktu).getHours();
        return jam >= 6 && jam < 18;
      });

      const rata = (xs: number[]) =>
        xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

      return {
        tanggal: h.tanggal,
        hujan: h.presipitasi,
        hujanSiang: siang.reduce((a, j) => a + j.presipitasi, 0),
        anginRata: rata(siang.map((j) => j.anginKecepatan)),
        hembusan: h.anginHembusanMaks,
        suhuMaks: h.suhuMaks,
        kelembapanRata: rata(siang.map((j) => j.kelembapan)),
        jamKeringSiang: siang.filter((j) => j.presipitasi < 0.2).length,
      };
    });
}

function nilaiDari(skor: number): NilaiHari {
  return skor >= 70 ? "baik" : skor >= 45 ? "sedang" : "buruk";
}

function labelHari(tanggal: string, hariIni: boolean) {
  if (hariIni) return "Hari ini";
  const d = new Date(tanggal);
  return d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
}

export function susunJadwalKerja(paket: PaketCuaca): JadwalKerja[] {
  const hari = ringkasPerHari(paket);
  const tglHariIni = paket.sekarang.waktu.slice(0, 10);

  const bangun = (
    id: string,
    nama: string,
    ikon: string,
    keterangan: string,
    nilai: (h: RingkasHari) => { skor: number; alasan: string },
  ): JadwalKerja => {
    const daftar = hari.map((h) => {
      const { skor, alasan } = nilai(h);
      const s = Math.round(jepit(skor));
      return {
        tanggal: h.tanggal,
        label: labelHari(h.tanggal, h.tanggal === tglHariIni),
        hariIni: h.tanggal === tglHariIni,
        skor: s,
        nilai: nilaiDari(s),
        alasan,
      } satisfies HariKerja;
    });

    const baik = daftar.filter((d) => d.nilai !== "buruk");
    const terbaik = baik.length
      ? baik.reduce((a, b) => (b.skor > a.skor ? b : a))
      : null;

    return { id, nama, ikon, keterangan, hari: daftar, terbaik };
  };

  return [
    bangun(
      "semprot",
      "Menyemprot",
      "🧴",
      "Butuh beberapa jam kering setelah penyemprotan, dan angin yang tidak kencang agar larutan tidak terbawa.",
      (h) => {
        const skor =
          100 -
          norm(h.hujanSiang, 0, 8) * 60 -
          norm(h.anginRata, 8, 22) * 30 -
          norm(h.suhuMaks, 32, 38) * 15;
        const alasan =
          h.hujanSiang >= 3
            ? `Hujan siang ${h.hujanSiang.toFixed(1)} mm — larutan berisiko tercuci.`
            : h.anginRata >= 16
              ? `Angin rata-rata ${h.anginRata.toFixed(0)} km/jam — semprotan mudah melayang.`
              : h.suhuMaks >= 34
                ? `Siang sangat panas (${Math.round(h.suhuMaks)} °C) — larutan cepat menguap.`
                : `${h.jamKeringSiang} jam kering pada siang hari.`;
        return { skor, alasan };
      },
    ),

    bangun(
      "pupuk",
      "Memupuk",
      "🌱",
      "Paling baik saat tanah lembap tetapi tidak sampai hanyut. Hujan ringan setelah pemupukan justru membantu melarutkan.",
      (h) => {
        // Pita ideal 2–15 mm. Terlalu kering pupuk tidak larut,
        // terlalu deras pupuk terbawa aliran permukaan.
        const skor =
          h.hujan < 1
            ? 55 - norm(1 - h.hujan, 0, 1) * 15
            : h.hujan <= 15
              ? 100 - norm(h.hujan, 10, 15) * 20
              : 85 - norm(h.hujan, 15, 45) * 70;
        const alasan =
          h.hujan < 1
            ? "Tanah cenderung kering — perlu disiram agar pupuk larut."
            : h.hujan <= 15
              ? `Hujan ${h.hujan.toFixed(1)} mm, cukup untuk melarutkan pupuk.`
              : `Hujan ${h.hujan.toFixed(0)} mm — pupuk berisiko terbawa aliran air.`;
        return { skor, alasan };
      },
    ),

    bangun(
      "panen",
      "Panen",
      "🧺",
      "Butuh hari kering agar hasil tidak basah, tidak berjamur, dan mutunya tidak turun.",
      (h) => {
        const skor =
          100 -
          norm(h.hujan, 0, 14) * 70 -
          norm(h.kelembapanRata, 75, 95) * 20 -
          norm(h.hembusan, 35, 65) * 15;
        const alasan =
          h.hujan >= 5
            ? `Hujan ${h.hujan.toFixed(1)} mm — hasil panen berisiko basah.`
            : h.hembusan >= 45
              ? `Hembusan ${Math.round(h.hembusan)} km/jam — tanaman tinggi berisiko rebah.`
              : `${h.jamKeringSiang} jam kering, kelembapan ${Math.round(h.kelembapanRata)}%.`;
        return { skor, alasan };
      },
    ),

    bangun(
      "jemur",
      "Menjemur hasil",
      "☀️",
      "Gabah, kopi, dan kakao perlu sinar panjang dan udara yang tidak terlalu lembap.",
      (h) => {
        const skor =
          norm(h.jamKeringSiang, 4, 12) * 55 +
          (1 - norm(h.kelembapanRata, 65, 92)) * 30 +
          (1 - norm(h.hujanSiang, 0, 6)) * 15;
        const alasan =
          h.hujanSiang >= 2
            ? `Hujan siang ${h.hujanSiang.toFixed(1)} mm — penjemuran berisiko gagal.`
            : h.kelembapanRata >= 85
              ? `Udara sangat lembap (${Math.round(h.kelembapanRata)}%) — pengeringan lambat.`
              : `${h.jamKeringSiang} jam kering berturut pada siang hari.`;
        return { skor, alasan };
      },
    ),

    bangun(
      "tanam",
      "Tanam / semai",
      "🌾",
      "Tanah perlu cukup lembap agar bibit tumbuh, tetapi tidak tergenang sampai bibit hanyut.",
      (h) => {
        const skor =
          h.hujan < 2
            ? 50 + norm(h.hujan, 0, 2) * 25
            : h.hujan <= 20
              ? 100 - norm(h.hujan, 12, 20) * 20
              : 80 - norm(h.hujan, 20, 55) * 75;
        const alasan =
          h.hujan < 2
            ? "Tanah cenderung kering — bibit perlu penyiraman tambahan."
            : h.hujan <= 20
              ? `Hujan ${h.hujan.toFixed(1)} mm — kelembapan tanah mendukung.`
              : `Hujan ${h.hujan.toFixed(0)} mm — bibit berisiko hanyut atau tergenang.`;
        return { skor, alasan };
      },
    ),
  ];
}

/* ── Catatan khusus untuk komoditas yang dipilih ──────────────────── */

export type CatatanPetani = {
  komoditas: string;
  ikon: string;
  pesan: string;
  nada: "tenang" | "perhatian";
};

export function susunCatatanPetani(
  kondisi: Kondisi,
  risiko: RisikoPetani[],
): CatatanPetani[] {
  const out: CatatanPetani[] = [];

  for (const r of risiko) {
    const k = r.komoditas;
    const pesan: string[] = [];

    if (r.fase === "berbunga" && (kondisi.hujan24j >= 15 || kondisi.hembusanMaks >= 40)) {
      pesan.push(
        `Sedang berbunga saat hujan ${kondisi.hujan24j.toFixed(0)} mm dan hembusan ${Math.round(kondisi.hembusanMaks)} km/jam. Bunga dan bakal buah paling mudah rontok pada tahap ini.`,
      );
    }
    if (r.fase === "panen" && kondisi.hujan72j >= 25) {
      pesan.push(
        `Menjelang panen dengan perkiraan hujan ${kondisi.hujan72j.toFixed(0)} mm dalam tiga hari. Pertimbangkan memajukan panen bila hasil sudah cukup tua, dan siapkan tempat pengeringan terlindung.`,
      );
    }
    if (k.peka.kelembapan >= 0.8 && kondisi.kelembapan >= 85) {
      pesan.push(
        `Kelembapan ${kondisi.kelembapan}% sudah tinggi, dan ${k.nama.toLowerCase()} termasuk yang paling cepat terserang penyakit jamur. Perhatikan jarak tanam dan buang bagian yang mulai busuk.`,
      );
    }
    if (k.peka.kekeringan >= 0.75 && kondisi.hariKeringBerturut >= 7) {
      pesan.push(
        `Sudah ${kondisi.hariKeringBerturut} hari tanpa hujan. ${k.nama} termasuk yang cepat merasakan kekurangan air — atur pengairan pada pagi atau sore.`,
      );
    }
    if (k.id === "karet" && kondisi.hujan24j >= 5) {
      pesan.push(
        "Hujan pagi membuat getah tercampur air, sehingga penyadapan hari ini kemungkinan tidak maksimal.",
      );
    }

    if (pesan.length > 0) {
      out.push({
        komoditas: k.nama,
        ikon: k.ikon,
        pesan: pesan[0],
        nada: "perhatian",
      });
    }
  }

  if (out.length === 0) {
    out.push({
      komoditas: "Semua komoditas",
      ikon: "✅",
      pesan:
        "Tidak ada tekanan cuaca yang menonjol untuk komoditas dan fase yang Anda pilih saat ini.",
      nada: "tenang",
    });
  }

  return out;
}

export { KOMODITAS };
