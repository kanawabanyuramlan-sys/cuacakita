import type { Kondisi, SkorDampak } from "./engine";
import type { PaketCuaca } from "@/lib/weather/types";
import { klasifikasiHujanHarian } from "@/lib/weather/wmo";

/**
 * Penyusun ringkasan "Apa yang sedang terjadi?".
 *
 * Kalimat di sini DIRANGKAI dari angka, bukan dihasilkan model bahasa.
 * Konsekuensinya disengaja: jawabannya selalu sama untuk data yang sama,
 * bisa diperiksa ulang, dan tidak mungkin menyebut angka yang tidak ada
 * di sistem. Setiap kalimat juga membawa angka pendukungnya supaya
 * pembaca bisa menilai sendiri, bukan sekadar percaya.
 */

export type Sorotan = {
  judul: string;
  isi: string;
  nada: "tenang" | "perhatian" | "waspada";
};

export type Insight = {
  ringkasan: string;
  sorotan: Sorotan[];
  prioritas: { nama: string; skor: number; tingkat: string }[];
};

/** Pembulatan milimeter yang konsisten dengan kartu metrik: satu desimal
 *  selama angkanya kecil, bulat setelah melewati 10 mm. */
function mm(v: number) {
  return v < 10 ? v.toFixed(1) : v.toFixed(0);
}

function arah(derajat: number) {
  const mata = ["utara", "timur laut", "timur", "tenggara", "selatan", "barat daya", "barat", "barat laut"];
  return mata[Math.round(derajat / 45) % 8];
}

export function susunInsight(
  paket: PaketCuaca,
  kondisi: Kondisi,
  sektor: SkorDampak[],
): Insight {
  const s = paket.sekarang;
  const prioritas = [...sektor]
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 4)
    .map((x) => ({ nama: x.nama, skor: x.skor, tingkat: x.tingkat }));

  const hujan = klasifikasiHujanHarian(kondisi.hujan24j);
  const tertinggi = prioritas[0];

  /* — Ringkasan utama — */
  const bagian: string[] = [];
  bagian.push(
    `Saat ini ${s.labelCuaca.toLowerCase()} di ${paket.lokasi.nama}, ${Math.round(s.suhu)} °C dengan kelembapan ${s.kelembapan}%.`,
  );

  if (kondisi.hujan24j >= 0.5) {
    bagian.push(
      `Dalam 24 jam ke depan diprakirakan ${hujan.label.toLowerCase()} sekitar ${mm(kondisi.hujan24j)} mm, dengan puncak ${mm(kondisi.hujanMaksPerJam)} mm per jam.`,
    );
  } else if (kondisi.hariKeringBerturut >= 3) {
    bagian.push(
      `Sudah ${kondisi.hariKeringBerturut} hari berturut-turut tanpa hujan berarti di wilayah ini.`,
    );
  } else {
    bagian.push("Hujan berarti belum diprakirakan dalam 24 jam ke depan.");
  }

  if (kondisi.hujanLalu72j >= 20) {
    bagian.push(
      `Tiga hari terakhir sudah turun ${mm(kondisi.hujanLalu72j)} mm, sehingga tanah kemungkinan masih basah saat hujan berikutnya datang.`,
    );
  }

  bagian.push(
    tertinggi && tertinggi.skor >= 25
      ? `Dampak yang paling perlu diperhatikan adalah ${tertinggi.nama.toLowerCase()} pada tingkat ${tertinggi.tingkat.toLowerCase()}.`
      : "Belum ada sektor yang menunjukkan tekanan berarti dari kondisi cuaca saat ini.",
  );

  /* — Sorotan — */
  const sorotan: Sorotan[] = [];

  if (kondisi.hujanMaksPerJam >= 10) {
    sorotan.push({
      judul: "Hujan deras dalam waktu singkat",
      isi: `Puncak intensitas ${mm(kondisi.hujanMaksPerJam)} mm per jam berpotensi melampaui kemampuan saluran air dan membuat jalan tergenang.`,
      nada: "waspada",
    });
  }

  if (kondisi.visibilitasKm < 4) {
    sorotan.push({
      judul: "Jarak pandang menurun",
      isi: `Jarak pandang sekitar ${kondisi.visibilitasKm.toFixed(1)} km. Risiko perjalanan meningkat, terutama menjelang gelap.`,
      nada: "perhatian",
    });
  }

  if (kondisi.hembusanMaks >= 45) {
    sorotan.push({
      judul: "Hembusan angin kuat",
      isi: `Hembusan hingga ${kondisi.hembusanMaks.toFixed(0)} km/jam dari ${arah(s.anginArah)}. Berisiko bagi sepeda motor, atap ringan, dan tanaman tinggi.`,
      nada: "perhatian",
    });
  }

  if (kondisi.hariHujanBerturut >= 3) {
    sorotan.push({
      judul: `Hujan diprakirakan ${kondisi.hariHujanBerturut} hari berturut-turut`,
      isi: "Hujan berkepanjangan menyulitkan pengeringan hasil panen dan membuat lereng semakin jenuh air.",
      nada: "waspada",
    });
  }

  if (kondisi.hariKeringBerturut >= 7) {
    sorotan.push({
      judul: `Kering ${kondisi.hariKeringBerturut} hari berturut-turut`,
      isi: "Ketersediaan air tanah menurun. Tanaman semusim dan ternak paling cepat merasakan dampaknya.",
      nada: "perhatian",
    });
  }

  if (kondisi.indeksUV >= 8) {
    sorotan.push({
      judul: "Indeks UV tinggi",
      isi: `Indeks UV mencapai ${kondisi.indeksUV.toFixed(0)}. Pekerja lapangan sebaiknya menghindari paparan langsung pada tengah hari.`,
      nada: "perhatian",
    });
  }

  if (sorotan.length === 0) {
    sorotan.push({
      judul: "Tidak ada kondisi yang menonjol",
      isi: "Seluruh indikator cuaca berada dalam rentang biasa untuk wilayah ini. Aktivitas sehari-hari cenderung dapat berjalan normal.",
      nada: "tenang",
    });
  }

  return { ringkasan: bagian.join(" "), sorotan, prioritas };
}
