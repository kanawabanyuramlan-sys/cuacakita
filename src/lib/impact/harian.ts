import type { PaketCuaca } from "@/lib/weather/types";
import type { Kondisi } from "./engine";

/**
 * Hal-hal yang benar-benar ditemui warga sehari-hari.
 *
 * Semuanya dihitung dari prakiraan per jam yang sudah ada — tidak ada
 * sumber data baru, dan tidak ada yang dikarang. Yang baru hanyalah
 * SUDUT PANDANGNYA: bukan "curah hujan 12 mm", melainkan "hujan jatuh
 * tepat saat jam pulang kerja".
 */

export type NilaiJendela = "baik" | "hati-hati" | "hindari";

export type JendelaAktivitas = {
  id: string;
  nama: string;
  ikon: string;
  jamMulai: number;
  jamSelesai: number;
  hujanMm: number;
  intensitasMaks: number;
  suhuRata: number;
  nilai: NilaiJendela;
  pesan: string;
  /** Kosong bila jendelanya sudah lewat hari ini. */
  sudahLewat: boolean;
};

const AKTIVITAS: {
  id: string;
  nama: string;
  ikon: string;
  mulai: number;
  selesai: number;
  /** Seberapa terganggu aktivitas ini oleh hujan, 0–1. */
  peka: number;
  pesanBaik: string;
}[] = [
  {
    id: "berangkat",
    nama: "Berangkat kerja & sekolah",
    ikon: "🛵",
    mulai: 6,
    selesai: 8,
    peka: 0.9,
    pesanBaik: "Perjalanan pagi diperkirakan kering.",
  },
  {
    id: "jemur",
    nama: "Menjemur pakaian",
    ikon: "👕",
    mulai: 9,
    selesai: 15,
    peka: 1,
    pesanBaik: "Waktu menjemur cukup panjang dan kering.",
  },
  {
    id: "pulang-sekolah",
    nama: "Jam pulang sekolah",
    ikon: "🎒",
    mulai: 12,
    selesai: 14,
    peka: 0.9,
    pesanBaik: "Anak pulang sekolah tanpa hujan.",
  },
  {
    id: "pulang-kerja",
    nama: "Jam pulang kerja",
    ikon: "🚗",
    mulai: 16,
    selesai: 19,
    peka: 0.95,
    pesanBaik: "Perjalanan pulang diperkirakan lancar dari sisi cuaca.",
  },
  {
    id: "olahraga",
    nama: "Olahraga di luar",
    ikon: "🏃",
    mulai: 5,
    selesai: 7,
    peka: 0.8,
    pesanBaik: "Pagi ini nyaman untuk lari atau jalan kaki.",
  },
  {
    id: "dagang",
    nama: "Dagang sore & malam",
    ikon: "🍢",
    mulai: 17,
    selesai: 21,
    peka: 0.85,
    pesanBaik: "Sore dan malam diperkirakan kering, pembeli cenderung keluar.",
  },
];

export function susunJendelaHarian(paket: PaketCuaca): JendelaAktivitas[] {
  const sekarang = new Date(paket.sekarang.waktu);
  const tanggalHariIni = paket.sekarang.waktu.slice(0, 10);

  const jamHariIni = paket.perJam.filter((j) =>
    j.waktu.startsWith(tanggalHariIni),
  );
  if (jamHariIni.length === 0) return [];

  return AKTIVITAS.map((a) => {
    const dalam = jamHariIni.filter((j) => {
      const h = new Date(j.waktu).getHours();
      return h >= a.mulai && h < a.selesai;
    });

    const hujanMm = dalam.reduce((s, j) => s + j.presipitasi, 0);
    const intensitasMaks = dalam.length
      ? Math.max(...dalam.map((j) => j.presipitasi))
      : 0;
    const suhuRata = dalam.length
      ? dalam.reduce((s, j) => s + j.suhu, 0) / dalam.length
      : 0;

    const berat = hujanMm * a.peka;
    const nilai: NilaiJendela =
      berat >= 4 || intensitasMaks >= 4
        ? "hindari"
        : berat >= 0.8
          ? "hati-hati"
          : "baik";

    let pesan: string;
    if (nilai === "baik") {
      pesan = a.pesanBaik;
    } else if (a.id === "jemur") {
      pesan =
        nilai === "hindari"
          ? `Hujan diperkirakan turun saat jam jemur, sekitar ${hujanMm.toFixed(1)} mm. Jemuran berisiko kehujanan.`
          : `Ada kemungkinan gerimis pada jam jemur. Sebaiknya jangan ditinggal pergi jauh.`;
    } else if (nilai === "hindari") {
      pesan = `Hujan cukup deras diperkirakan pada jam ini, puncaknya ${intensitasMaks.toFixed(1)} mm per jam. Siapkan jas hujan dan beri waktu lebih.`;
    } else {
      pesan = `Kemungkinan hujan ringan pada jam ini. Bawa payung untuk berjaga.`;
    }

    return {
      id: a.id,
      nama: a.nama,
      ikon: a.ikon,
      jamMulai: a.mulai,
      jamSelesai: a.selesai,
      hujanMm: Math.round(hujanMm * 10) / 10,
      intensitasMaks: Math.round(intensitasMaks * 10) / 10,
      suhuRata: Math.round(suhuRata * 10) / 10,
      nilai,
      pesan,
      sudahLewat: sekarang.getHours() >= a.selesai,
    };
  });
}

/* ── Hal lain yang sering ditemui ─────────────────────────────────── */

export type HalUmum = {
  id: string;
  ikon: string;
  judul: string;
  isi: string;
  nada: "tenang" | "perhatian";
};

export function susunHalUmum(
  paket: PaketCuaca,
  kondisi: Kondisi,
  jendela: JendelaAktivitas[],
): HalUmum[] {
  const out: HalUmum[] = [];

  /* Macet saat hujan — pernyataan umum, BUKAN klaim tentang ruas jalan
     tertentu. CuacaKita tidak punya data lalu lintas. */
  const pulangKerja = jendela.find((j) => j.id === "pulang-kerja");
  const berangkat = jendela.find((j) => j.id === "berangkat");
  const jamPadatHujan = [berangkat, pulangKerja].filter(
    (j) => j && j.nilai !== "baik",
  );
  if (jamPadatHujan.length > 0) {
    out.push({
      id: "macet",
      ikon: "🚦",
      judul: "Hujan bertepatan dengan jam sibuk",
      isi: `Hujan diperkirakan turun pada ${jamPadatHujan
        .map((j) => j!.nama.toLowerCase())
        .join(" dan ")}. Lalu lintas umumnya melambat saat hujan karena kendaraan berkurang kecepatannya dan sebagian pengendara motor berteduh. Beri tambahan waktu perjalanan. CuacaKita tidak memantau kondisi jalan — untuk kepadatan sesungguhnya, gunakan aplikasi peta dengan lalu lintas langsung.`,
      nada: "perhatian",
    });
  }

  /* Jentik nyamuk — genangan sisa hujan pada suhu hangat */
  const hangatLembap =
    kondisi.suhuMaks >= 26 &&
    kondisi.suhuMin >= 20 &&
    kondisi.kelembapan >= 70;
  if (kondisi.hujanLalu72j >= 15 && hangatLembap) {
    out.push({
      id: "nyamuk",
      ikon: "🦟",
      judul: "Genangan sisa hujan berpotensi jadi sarang jentik",
      isi: `Dalam tiga hari terakhir turun ${kondisi.hujanLalu72j.toFixed(0)} mm hujan, dengan suhu hangat dan udara lembap. Kombinasi ini mempercepat perkembangan jentik nyamuk. Periksa bak mandi, talang air, pot bunga, dan wadah bekas di sekitar rumah dalam beberapa hari ke depan.`,
      nada: "perhatian",
    });
  }

  /* Listrik padam — petir atau angin kencang */
  const adaBadai = paket.perJam
    .slice(0, 24)
    .some((j) => j.kategori === "badai");
  if (adaBadai || kondisi.hembusanMaks >= 50) {
    out.push({
      id: "listrik",
      ikon: "💡",
      judul: "Kemungkinan gangguan listrik meningkat",
      isi: adaBadai
        ? "Badai petir diperkirakan terjadi dalam sehari ke depan. Petir dan angin kencang adalah penyebab paling umum gangguan listrik sementara. Ada baiknya mengisi daya ponsel lebih awal dan mencabut peralatan elektronik yang sensitif."
        : `Hembusan angin diperkirakan mencapai ${Math.round(kondisi.hembusanMaks)} km/jam. Angin sekuat ini kadang menjatuhkan dahan ke kabel listrik. Isi daya ponsel lebih awal sebagai persiapan.`,
      nada: "perhatian",
    });
  }

  /* Perubahan suhu tajam — keluhan kesehatan yang lazim */
  const bedaSuhu = kondisi.suhuMaks - kondisi.suhuMin;
  if (bedaSuhu >= 11) {
    out.push({
      id: "kesehatan",
      ikon: "🤧",
      judul: "Selisih suhu siang dan malam cukup besar",
      isi: `Siang ini diperkirakan ${Math.round(kondisi.suhuMaks)} °C, sedangkan malam turun sampai ${Math.round(kondisi.suhuMin)} °C — selisih ${Math.round(bedaSuhu)} derajat. Perubahan sebesar ini sering diikuti keluhan batuk dan pilek, terutama pada anak dan lansia. Siapkan selimut atau jaket untuk malam hari.`,
      nada: "perhatian",
    });
  }

  /* Air keruh setelah hujan deras */
  if (kondisi.hujan24j >= 40) {
    out.push({
      id: "air",
      ikon: "🚰",
      judul: "Air sumur dan sungai berpotensi keruh",
      isi: "Hujan deras membawa lumpur dan material permukaan ke sumber air. Air sumur dangkal dan sungai sering keruh satu sampai dua hari setelahnya. Endapkan dan masak air hingga mendidih sebelum diminum, atau siapkan persediaan air bersih lebih awal.",
      nada: "perhatian",
    });
  }

  if (out.length === 0) {
    out.push({
      id: "tenang",
      ikon: "✅",
      judul: "Tidak ada gangguan umum yang diperkirakan",
      isi: "Cuaca hari ini tidak menunjukkan hal-hal yang biasanya merepotkan: tidak bertepatan dengan jam sibuk, tidak ada badai, dan selisih suhu siang-malam masih wajar.",
      nada: "tenang",
    });
  }

  return out;
}
