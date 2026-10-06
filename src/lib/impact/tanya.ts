import type { PaketCuaca } from "@/lib/weather/types";
import {
  hitungDariKondisi,
  SKENARIO,
  type Kondisi,
  type SkorDampak,
} from "./engine";
import { hitungRisikoKomoditas } from "./komoditas";

/**
 * "Tanya CuacaKita".
 *
 * Bukan chatbot, dan tidak memakai model bahasa. Ini daftar pertanyaan yang
 * memang sering ditanyakan orang, masing-masing dijawab oleh fungsi yang
 * membaca data yang sedang tampil di layar.
 *
 * Pilihan ini disengaja: jawabannya tidak akan pernah menyebut angka yang
 * tidak ada di sistem, selalu sama untuk data yang sama, dan setiap kalimat
 * bisa ditelusuri ke rumus yang menghasilkannya. Harganya adalah pengguna
 * tidak bisa mengetik pertanyaan bebas — dan untuk informasi cuaca yang
 * dipakai mengambil keputusan, itu pertukaran yang sepadan.
 */

export type Jawaban = {
  id: string;
  pertanyaan: string;
  /** Jawaban utama, satu sampai dua kalimat, tanpa istilah teknis. */
  ringkas: string;
  /** Angka pendukung agar pembaca bisa menilai sendiri, bukan sekadar percaya. */
  rincian: string[];
  tautan?: { label: string; href: string };
};

const mm = (v: number) => (v < 10 ? v.toFixed(1) : v.toFixed(0));

function namaHari(d: Date) {
  return d.toLocaleDateString("id-ID", { weekday: "long" });
}

export function susunTanya(
  paket: PaketCuaca,
  kondisi: Kondisi,
  sektor: SkorDampak[],
): Jawaban[] {
  const skor = (id: string) => sektor.find((s) => s.id === id)?.skor ?? 0;
  const hariIni = new Date(paket.sekarang.waktu).toISOString().slice(0, 10);
  const kedepan = paket.harian.filter((h) => h.tanggal >= hariIni);
  const besok = kedepan[1];
  const jawaban: Jawaban[] = [];

  /* 1 — Besok hujan tidak? */
  if (besok) {
    const d = new Date(besok.tanggal);
    const adaHujan = besok.presipitasi >= 1;
    jawaban.push({
      id: "besok",
      pertanyaan: "Besok hujan atau tidak?",
      ringkas: adaHujan
        ? `Besok (${namaHari(d)}) kemungkinan hujan, diperkirakan sekitar ${mm(besok.presipitasi)} mm sepanjang hari. ${besok.presipitasi >= 20 ? "Jumlah itu tergolong cukup banyak." : "Jumlah itu tergolong ringan sampai sedang."}`
        : `Besok (${namaHari(d)}) diperkirakan tidak turun hujan berarti. Langit ${besok.labelCuaca.toLowerCase()}.`,
      rincian: [
        `Suhu besok ${Math.round(besok.suhuMin)}–${Math.round(besok.suhuMaks)} °C`,
        besok.peluangHujanMaks != null
          ? `Peluang hujan tertinggi ${besok.peluangHujanMaks}%`
          : `Perkiraan cuaca: ${besok.labelCuaca}`,
        `Angin hingga ${Math.round(besok.anginHembusanMaks)} km/jam`,
      ],
    });
  }

  /* 2 — Aman tidak naik motor? */
  const t = skor("transportasi");
  jawaban.push({
    id: "motor",
    pertanyaan: "Aman tidak kalau naik motor hari ini?",
    ringkas:
      t >= 50
        ? "Sebaiknya ditunda bila bisa. Jalan berpotensi licin dan pandangan terbatas, dua hal yang paling berbahaya bagi pengendara motor."
        : t >= 25
          ? "Masih aman, tetapi pelankan laju dan jaga jarak. Ada sedikit hal yang perlu diwaspadai."
          : "Aman seperti biasa. Tidak ada kondisi cuaca yang menambah risiko berkendara hari ini.",
    rincian: [
      `Hujan paling deras diperkirakan ${mm(kondisi.hujanMaksPerJam)} mm per jam`,
      `Jarak pandang sekitar ${kondisi.visibilitasKm.toFixed(1)} km`,
      `Hembusan angin hingga ${Math.round(kondisi.hembusanMaks)} km/jam`,
    ],
    tautan: { label: "Lihat rincian perjalanan", href: "#dampak" },
  });

  /* 3 — Kapan waktu paling kering hari ini? */
  const t0 = new Date(paket.sekarang.waktu).getTime();
  const sisaHariIni = paket.perJam.filter((j) => {
    const w = new Date(j.waktu).getTime();
    const jam = new Date(j.waktu).getHours();
    return w >= t0 && w <= t0 + 14 * 3600 * 1000 && jam >= 6 && jam <= 20;
  });
  if (sisaHariIni.length >= 3) {
    // Cari jendela tiga jam dengan hujan paling sedikit.
    let terbaik = { mulai: sisaHariIni[0], total: Infinity };
    for (let i = 0; i + 2 < sisaHariIni.length; i++) {
      const total =
        sisaHariIni[i].presipitasi +
        sisaHariIni[i + 1].presipitasi +
        sisaHariIni[i + 2].presipitasi;
      if (total < terbaik.total) terbaik = { mulai: sisaHariIni[i], total };
    }
    const d = new Date(terbaik.mulai.waktu);
    const jamMulai = String(d.getHours()).padStart(2, "0");
    const jamSelesai = String((d.getHours() + 3) % 24).padStart(2, "0");
    jawaban.push({
      id: "jendela-kering",
      pertanyaan: "Kapan waktu paling aman untuk keluar atau menjemur?",
      ringkas:
        terbaik.total < 0.5
          ? `Antara pukul ${jamMulai}.00 dan ${jamSelesai}.00 diperkirakan paling kering. Itu jendela terbaik hari ini.`
          : `Tidak ada waktu yang benar-benar kering hari ini. Yang paling ringan sekitar pukul ${jamMulai}.00–${jamSelesai}.00, dengan total hujan ${mm(terbaik.total)} mm.`,
      rincian: [
        `Dihitung dari prakiraan hujan tiap jam antara pukul 06.00 dan 20.00`,
        `Total hujan pada jendela itu ${mm(terbaik.total)} mm`,
        `Kelembapan saat ini ${kondisi.kelembapan}%`,
      ],
    });
  }

  /* 4 — Tanaman apa yang paling berisiko? */
  const risiko = hitungRisikoKomoditas(kondisi);
  const teratas = risiko[0];
  if (teratas) {
    jawaban.push({
      id: "tanaman",
      pertanyaan: "Tanaman apa yang paling berisiko sekarang?",
      ringkas:
        teratas.skor >= 25
          ? `${teratas.komoditas.nama} paling perlu diperhatikan. ${teratas.penyebab ? `Penyebab utamanya ${teratas.penyebab.nama.toLowerCase()} — ${teratas.penyebab.kalimat}.` : ""}`
          : "Tidak ada komoditas yang menonjol berisiko pada kondisi cuaca saat ini.",
      rincian: risiko
        .slice(0, 4)
        .map((r) => `${r.komoditas.nama}: ${r.skor} dari 100 (${r.tingkat})`),
      tautan: { label: "Lihat semua komoditas", href: "/komoditas" },
    });
  }

  /* 5 — Kenapa daerah ini berisiko banjir atau longsor? */
  const banjir = skor("banjir");
  const longsor = skor("longsor");
  const elev = kondisi.elevasi;
  jawaban.push({
    id: "kenapa-rawan",
    pertanyaan: "Kenapa daerah ini bisa berisiko banjir atau longsor?",
    ringkas:
      banjir === 0 && longsor === 0
        ? `Saat ini keduanya rendah karena pemicunya belum ada: hujan masih sedikit. Bentuk wilayah saja tidak membuat risiko naik — harus ada hujan yang memicunya.`
        : elev < 50
          ? `Wilayah ini berada di ${elev.toFixed(0)} meter di atas permukaan laut, tergolong dataran rendah, sehingga air lebih sulit mengalir keluar dan genangan lebih mudah terjadi saat hujan deras.`
          : elev > 400
            ? `Wilayah ini berada di ${elev.toFixed(0)} meter di atas permukaan laut. Daerah tinggi umumnya berlereng, dan lereng yang sudah basah lebih mudah bergerak saat hujan berikutnya turun.`
            : `Wilayah ini di ketinggian sedang (${elev.toFixed(0)} mdpl), jadi tidak termasuk paling rawan genangan maupun paling rawan longsor.`,
    rincian: [
      `Hujan 72 jam terakhir ${mm(kondisi.hujanLalu72j)} mm — menentukan seberapa jenuh tanah`,
      `Hujan 72 jam ke depan ${mm(kondisi.hujan72j)} mm`,
      `Skor banjir ${banjir}, skor longsor ${longsor}`,
      "Rumusnya: pemicu hujan dikalikan kerentanan wilayah, bukan dijumlahkan",
    ],
    tautan: { label: "Lihat peta risiko", href: "/peta" },
  });

  /* 6 — Simulasi: bagaimana kalau hujan deras tiga hari? */
  const sk = SKENARIO["hujan-ekstrem-3-hari"];
  const andai = hitungDariKondisi(sk.ubah(kondisi));
  const naikTerbesar = andai
    .map((a) => ({ nama: a.nama, kini: skor(a.id), nanti: a.skor }))
    .sort((a, b) => b.nanti - a.nanti)
    .slice(0, 3);
  jawaban.push({
    id: "andai-hujan",
    pertanyaan: "Bagaimana kalau hujan deras tiga hari berturut-turut?",
    ringkas: `Kalau itu terjadi di ${paket.lokasi.nama}, yang paling terpukul adalah ${naikTerbesar
      .map((x) => x.nama.toLowerCase())
      .join(", ")}. Ini perhitungan pengandaian, bukan prakiraan.`,
    rincian: [
      sk.keterangan,
      ...naikTerbesar.map(
        (x) => `${x.nama}: ${x.kini} → ${x.nanti} dari 100`,
      ),
      `Bentuk wilayah ikut diperhitungkan: ${elev.toFixed(0)} mdpl`,
    ],
  });

  return jawaban;
}
