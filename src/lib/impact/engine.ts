import type { PaketCuaca } from "@/lib/weather/types";

/**
 * Mesin dampak CuacaKita.
 *
 * Seluruh skor di sini DIHITUNG, bukan ditebak dan bukan dikarang model
 * bahasa. Tiap skor adalah jumlah berbobot dari beberapa faktor yang
 * dinormalkan, dan tiap faktor ikut dikembalikan lengkap dengan nilai
 * mentah, bobot, dan sumbangannya — sehingga angka apa pun di layar bisa
 * dibuka sampai ke asalnya.
 *
 * Arah skor: SEMAKIN TINGGI berarti SEMAKIN BESAR dampak atau risikonya.
 *
 * Batasan yang harus jujur disampaikan:
 * - Elevasi dipakai sebagai pendekatan kasar topografi. Elevasi bukan
 *   kemiringan lereng, dan bukan pengganti peta rawan bencana resmi.
 * - Ambang batas disusun dari klasifikasi curah hujan BMKG dan rentang
 *   kenyamanan ternak/tanaman yang lazim, bukan dari model tervalidasi.
 * - Hasilnya indikator analitis untuk membantu kewaspadaan, BUKAN
 *   peringatan dini resmi.
 */

export type Tingkat = "Rendah" | "Sedang" | "Tinggi" | "Sangat Tinggi";

export type Faktor = {
  nama: string;
  /** Nilai mentah yang terbaca dari data cuaca. */
  nilai: number;
  satuan: string;
  /** Bobot faktor ini dalam skor akhir (total pemicu selalu 1). */
  bobot: number;
  /** Sumbangan faktor ini ke skor akhir, 0–100. */
  kontribusi: number;
  penjelasan: string;
  /**
   * "pemicu" menaikkan skor secara langsung.
   * "pengali" hanya memperbesar atau meredam pemicu — ia tidak pernah
   * menaikkan skor sendirian. Topografi masuk kategori ini: lereng curam
   * tanpa hujan tetap berisiko rendah.
   */
  peran: "pemicu" | "pengali";
};

export type SektorId =
  | "pertanian"
  | "peternakan"
  | "perkebunan"
  | "transportasi"
  | "banjir"
  | "longsor";

export type SkorDampak = {
  id: SektorId;
  nama: string;
  skor: number;
  tingkat: Tingkat;
  ringkasan: string;
  faktor: Faktor[];
  rekomendasi: string[];
};

/* ── Perkakas ──────────────────────────────────────────────────────── */

const jepit = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Normalkan nilai ke 0–1 pada rentang [lo, hi]. Mendukung rentang terbalik. */
function norm(v: number, lo: number, hi: number) {
  if (hi === lo) return 0;
  return jepit((v - lo) / (hi - lo));
}

/** Jarak dari pita nyaman: 0 di dalam pita, naik ke 1 di tepi toleransi. */
function luarPita(v: number, bawah: number, atas: number, toleransi: number) {
  if (v >= bawah && v <= atas) return 0;
  const selisih = v < bawah ? bawah - v : v - atas;
  return jepit(selisih / toleransi);
}

export function tingkatDari(skor: number): Tingkat {
  if (skor < 25) return "Rendah";
  if (skor < 50) return "Sedang";
  if (skor < 75) return "Tinggi";
  return "Sangat Tinggi";
}

/* ── Ringkasan kondisi: satu-satunya tempat data cuaca dibaca ───────── */

export type Kondisi = {
  hujan24j: number;
  hujan72j: number;
  hujanMaksPerJam: number;
  hariHujanBerturut: number;
  /**
   * Curah hujan 72 jam TERAKHIR (bukan prakiraan). Menentukan seberapa
   * jenuh tanah sebelum hujan berikutnya turun — ini yang membedakan
   * hujan deras di tanah kering dari hujan deras di tanah yang sudah penuh.
   */
  hujanLalu72j: number;
  /** Hari berturut-turut tanpa hujan berarti, dihitung mundur dari hari ini. */
  hariKeringBerturut: number;
  suhu: number;
  suhuMaks: number;
  suhuMin: number;
  kelembapan: number;
  angin: number;
  hembusanMaks: number;
  visibilitasKm: number;
  elevasi: number;
  indeksUV: number;
};

export function ringkasKondisi(paket: PaketCuaca): Kondisi {
  const sekarang = new Date(paket.sekarang.waktu).getTime();
  const jam = (dariJam: number, sampaiJam: number) =>
    paket.perJam.filter((j) => {
      const t = new Date(j.waktu).getTime();
      return (
        t >= sekarang + dariJam * 3600 * 1000 &&
        t < sekarang + sampaiJam * 3600 * 1000
      );
    });

  const jumlah = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const maks = (xs: number[]) => (xs.length ? Math.max(...xs) : 0);

  const j24 = jam(0, 24);
  const j72 = jam(0, 72);
  const lalu72 = jam(-72, 0);

  const hariIni = paket.harian.find((h) =>
    paket.sekarang.waktu.startsWith(h.tanggal),
  );
  const indeksHariIni = hariIni ? paket.harian.indexOf(hariIni) : 0;
  const kedepanHarian = paket.harian.slice(indeksHariIni);
  const laluHarian = paket.harian.slice(0, indeksHariIni);

  // Hari hujan berturut-turut yang diprakirakan, mulai hari ini.
  // Ambang 5 mm: gerimis 1 mm bukan "hari hujan" yang bermakna bagi tanah.
  let berturut = 0;
  for (const h of kedepanHarian) {
    if (h.presipitasi >= 5) berturut++;
    else break;
  }

  // Hari kering berturut-turut, dihitung MUNDUR dari hari ini.
  let kering = 0;
  for (let i = laluHarian.length - 1; i >= 0; i--) {
    if (laluHarian[i].presipitasi < 1) kering++;
    else break;
  }
  if (laluHarian.length === 0 && (hariIni?.presipitasi ?? 0) < 1) kering = 1;

  return {
    hujan24j: jumlah(j24.map((j) => j.presipitasi)),
    hujan72j: jumlah(j72.map((j) => j.presipitasi)),
    hujanMaksPerJam: maks(j24.map((j) => j.presipitasi)),
    hariHujanBerturut: berturut,
    hujanLalu72j: jumlah(lalu72.map((j) => j.presipitasi)),
    hariKeringBerturut: kering,
    suhu: paket.sekarang.suhu,
    suhuMaks: hariIni?.suhuMaks ?? paket.sekarang.suhu,
    suhuMin: hariIni?.suhuMin ?? paket.sekarang.suhu,
    kelembapan: paket.sekarang.kelembapan,
    angin: paket.sekarang.anginKecepatan,
    hembusanMaks: Math.max(
      paket.sekarang.anginHembusan,
      hariIni?.anginHembusanMaks ?? 0,
    ),
    visibilitasKm:
      paket.sekarang.visibilitas != null
        ? paket.sekarang.visibilitas / 1000
        : 24,
    elevasi: paket.lokasi.elevasi ?? 50,
    indeksUV: paket.sekarang.indeksUV ?? hariIni?.indeksUVMaks ?? 0,
  };
}

/* ── Penyusun skor ─────────────────────────────────────────────────── */

type Bahan = { nama: string; nilai: number; satuan: string; bobot: number; n: number; penjelasan: string };

function susun(bahan: Bahan[]): { skor: number; faktor: Faktor[] } {
  const faktor: Faktor[] = bahan.map((b) => ({
    nama: b.nama,
    nilai: Math.round(b.nilai * 10) / 10,
    satuan: b.satuan,
    bobot: b.bobot,
    kontribusi: Math.round(b.n * b.bobot * 100),
    penjelasan: b.penjelasan,
    peran: "pemicu",
  }));
  const skor = Math.round(jepit(bahan.reduce((a, b) => a + b.n * b.bobot, 0)) * 100);
  return { skor, faktor };
}

/**
 * Skor = (pemicu cuaca) × (kerentanan wilayah).
 *
 * Dipakai untuk banjir dan longsor, karena keduanya butuh DUA hal sekaligus:
 * pemicu berupa hujan, dan wilayah yang memang rentan. Menjumlahkan topografi
 * sebagai faktor mandiri membuat daerah pegunungan selalu tampak berisiko
 * walau kering — itu keliru dan akan membuat peringatan kehilangan arti.
 *
 * Pengali dibatasi pada rentang [dasar, 1] agar wilayah yang kurang rentan
 * tetap tidak pernah dianggap nol risiko saat hujan ekstrem turun.
 */
function susunBerkerentanan(
  pemicu: Bahan[],
  kerentanan: Omit<Bahan, "bobot">,
  dasar = 0.4,
): { skor: number; faktor: Faktor[] } {
  const totalPemicu = jepit(pemicu.reduce((a, b) => a + b.n * b.bobot, 0));
  const pengali = dasar + (1 - dasar) * jepit(kerentanan.n);
  const skor = Math.round(totalPemicu * pengali * 100);

  const faktor: Faktor[] = pemicu.map((b) => ({
    nama: b.nama,
    nilai: Math.round(b.nilai * 10) / 10,
    satuan: b.satuan,
    bobot: b.bobot,
    kontribusi: Math.round(b.n * b.bobot * pengali * 100),
    penjelasan: b.penjelasan,
    peran: "pemicu",
  }));

  faktor.push({
    nama: kerentanan.nama,
    nilai: Math.round(kerentanan.nilai * 10) / 10,
    satuan: kerentanan.satuan,
    bobot: 0,
    kontribusi: Math.round(pengali * 100),
    penjelasan: kerentanan.penjelasan,
    peran: "pengali",
  });

  return { skor, faktor };
}

/* ── Enam sektor ───────────────────────────────────────────────────── */

function pertanian(k: Kondisi): SkorDampak {
  const { skor, faktor } = susun([
    { nama: "Curah hujan 24 jam", nilai: k.hujan24j, satuan: "mm", bobot: 0.25, n: norm(k.hujan24j, 5, 60),
      penjelasan: "Hujan berlebih berpotensi mengganggu panen dan membuat lahan tergenang." },
    { nama: "Intensitas hujan tertinggi", nilai: k.hujanMaksPerJam, satuan: "mm/jam", bobot: 0.12, n: norm(k.hujanMaksPerJam, 2, 20),
      penjelasan: "Hujan deras singkat dapat merebahkan tanaman dan merontokkan bunga." },
    { nama: "Kelembapan udara", nilai: k.kelembapan, satuan: "%", bobot: 0.15, n: norm(k.kelembapan, 70, 95),
      penjelasan: "Kelembapan tinggi meningkatkan risiko penyakit jamur pada tanaman." },
    { nama: "Kecepatan angin", nilai: k.angin, satuan: "km/jam", bobot: 0.13, n: norm(k.angin, 20, 55),
      penjelasan: "Angin kencang berpotensi merebahkan padi dan merusak tanaman muda." },
    { nama: "Suhu di luar pita ideal", nilai: k.suhuMaks, satuan: "°C", bobot: 0.15, n: luarPita(k.suhuMaks, 24, 32, 8),
      penjelasan: "Suhu di luar 24–32 °C dapat menekan pertumbuhan dan pengisian bulir." },
    { nama: "Hari kering berturut-turut", nilai: k.hariKeringBerturut, satuan: "hari", bobot: 0.2, n: norm(k.hariKeringBerturut, 2, 10) * (k.suhuMaks > 32 ? 1 : 0.7),
      penjelasan: "Rentetan hari tanpa hujan menekan ketersediaan air tanah, dan makin berat bila suhu tinggi." },
  ]);

  const rekomendasi: string[] = [];
  if (k.hujan24j > 30) rekomendasi.push("Tunda panen bila memungkinkan dan pastikan saluran drainase lahan tidak tersumbat.");
  if (k.kelembapan > 85) rekomendasi.push("Pantau gejala penyakit jamur, terutama pada tanaman yang rapat.");
  if (k.angin > 30) rekomendasi.push("Perkuat penyangga pada tanaman tinggi dan tanaman muda.");
  if (k.hujan24j < 2 && k.suhuMaks > 33) rekomendasi.push("Jadwalkan pengairan pada pagi atau sore untuk menekan penguapan.");
  if (rekomendasi.length === 0) rekomendasi.push("Kondisi relatif aman untuk aktivitas pertanian rutin.");

  return {
    id: "pertanian", nama: "Pertanian", skor, tingkat: tingkatDari(skor), faktor, rekomendasi,
    ringkasan:
      skor >= 50
        ? "Kondisi cuaca berpotensi mengganggu aktivitas tanam dan panen."
        : "Kondisi cuaca belum menunjukkan gangguan berarti bagi aktivitas pertanian.",
  };
}

function peternakan(k: Kondisi): SkorDampak {
  // Pendekatan indeks suhu-kelembapan: panas DAN lembap jauh lebih menekan
  // ternak dibanding panas saja.
  const thi = 0.8 * k.suhuMaks + (k.kelembapan / 100) * (k.suhuMaks - 14.4) + 46.4;

  const { skor, faktor } = susun([
    { nama: "Indeks suhu–kelembapan", nilai: thi, satuan: "THI", bobot: 0.35, n: norm(thi, 72, 84),
      penjelasan: "Gabungan panas dan lembap menekan nafsu makan serta produksi ternak." },
    { nama: "Kelembapan udara", nilai: k.kelembapan, satuan: "%", bobot: 0.2, n: norm(k.kelembapan, 75, 95),
      penjelasan: "Kandang lembap memperbesar risiko gangguan pernapasan dan jamur." },
    { nama: "Curah hujan 24 jam", nilai: k.hujan24j, satuan: "mm", bobot: 0.2, n: norm(k.hujan24j, 10, 60),
      penjelasan: "Hujan membuat alas kandang basah dan mengganggu penyediaan pakan." },
    { nama: "Suhu minimum", nilai: k.suhuMin, satuan: "°C", bobot: 0.1, n: norm(22 - k.suhuMin, 0, 10),
      penjelasan: "Suhu malam yang rendah berisiko bagi ternak muda." },
    { nama: "Hembusan angin", nilai: k.hembusanMaks, satuan: "km/jam", bobot: 0.15, n: norm(k.hembusanMaks, 30, 70),
      penjelasan: "Angin kencang berpotensi merusak atap dan dinding kandang." },
  ]);

  const rekomendasi: string[] = [];
  if (thi > 78) rekomendasi.push("Tambah ventilasi dan pastikan air minum selalu tersedia; hindari memindahkan ternak saat siang.");
  if (k.kelembapan > 85) rekomendasi.push("Ganti alas kandang lebih sering agar tidak lembap berkepanjangan.");
  if (k.hujan24j > 30) rekomendasi.push("Periksa kebocoran atap dan amankan stok pakan dari air.");
  if (k.hembusanMaks > 45) rekomendasi.push("Periksa ikatan atap dan tutup sisi kandang yang terbuka.");
  if (rekomendasi.length === 0) rekomendasi.push("Kondisi cuaca relatif nyaman bagi ternak.");

  return {
    id: "peternakan", nama: "Peternakan", skor, tingkat: tingkatDari(skor), faktor, rekomendasi,
    ringkasan:
      skor >= 50
        ? "Cuaca berpotensi menekan kenyamanan ternak dan kondisi kandang."
        : "Kondisi kandang dan kenyamanan ternak cenderung terjaga.",
  };
}

function perkebunan(k: Kondisi): SkorDampak {
  const { skor, faktor } = susun([
    { nama: "Curah hujan 72 jam", nilai: k.hujan72j, satuan: "mm", bobot: 0.25, n: norm(k.hujan72j, 20, 150),
      penjelasan: "Hujan berkepanjangan mengganggu pemanenan dan pengangkutan hasil kebun." },
    { nama: "Hari hujan berturut-turut", nilai: k.hariHujanBerturut, satuan: "hari", bobot: 0.17, n: norm(k.hariHujanBerturut, 1, 5),
      penjelasan: "Rentetan hari hujan menyulitkan penjemuran dan pengeringan hasil." },
    { nama: "Kelembapan udara", nilai: k.kelembapan, satuan: "%", bobot: 0.16, n: norm(k.kelembapan, 75, 95),
      penjelasan: "Lembap berkepanjangan memicu penyakit busuk buah dan jamur akar." },
    { nama: "Hembusan angin", nilai: k.hembusanMaks, satuan: "km/jam", bobot: 0.12, n: norm(k.hembusanMaks, 30, 70),
      penjelasan: "Angin kencang merontokkan buah dan mematahkan cabang." },
    { nama: "Suhu di luar pita ideal", nilai: k.suhuMaks, satuan: "°C", bobot: 0.12, n: luarPita(k.suhuMaks, 22, 31, 9),
      penjelasan: "Suhu ekstrem menekan pembungaan dan pembentukan buah." },
    { nama: "Hari kering berturut-turut", nilai: k.hariKeringBerturut, satuan: "hari", bobot: 0.18, n: norm(k.hariKeringBerturut, 3, 14),
      penjelasan: "Tanaman tahunan menanggung kekeringan lebih lama sebelum dapat pulih." },
  ]);

  const rekomendasi: string[] = [];
  if (k.hujan72j > 80) rekomendasi.push("Prioritaskan pengangkutan hasil sebelum jalan kebun semakin sulit dilalui.");
  if (k.hariHujanBerturut >= 3) rekomendasi.push("Siapkan pengeringan terlindung; penjemuran terbuka berpotensi gagal.");
  if (k.kelembapan > 85) rekomendasi.push("Tingkatkan pemantauan penyakit busuk buah pada tanaman menghasilkan.");
  if (rekomendasi.length === 0) rekomendasi.push("Kondisi mendukung aktivitas kebun seperti biasa.");

  return {
    id: "perkebunan", nama: "Perkebunan", skor, tingkat: tingkatDari(skor), faktor, rekomendasi,
    ringkasan:
      skor >= 50
        ? "Cuaca berpotensi mengganggu panen, pengeringan, dan pengangkutan hasil kebun."
        : "Aktivitas kebun cenderung dapat berjalan normal.",
  };
}

function transportasi(k: Kondisi): SkorDampak {
  const { skor, faktor } = susun([
    { nama: "Intensitas hujan tertinggi", nilai: k.hujanMaksPerJam, satuan: "mm/jam", bobot: 0.3, n: norm(k.hujanMaksPerJam, 1, 15),
      penjelasan: "Hujan deras membuat jalan licin dan jarak pengereman memanjang." },
    { nama: "Jarak pandang", nilai: k.visibilitasKm, satuan: "km", bobot: 0.3, n: 1 - norm(k.visibilitasKm, 1, 10),
      penjelasan: "Jarak pandang pendek menaikkan risiko kecelakaan, terutama saat gelap." },
    { nama: "Hembusan angin", nilai: k.hembusanMaks, satuan: "km/jam", bobot: 0.2, n: norm(k.hembusanMaks, 25, 70),
      penjelasan: "Hembusan kuat berbahaya bagi sepeda motor dan kendaraan tinggi." },
    { nama: "Curah hujan 24 jam", nilai: k.hujan24j, satuan: "mm", bobot: 0.2, n: norm(k.hujan24j, 10, 70),
      penjelasan: "Hujan terakumulasi berpotensi menimbulkan genangan di jalan." },
  ]);

  const rekomendasi: string[] = [];
  if (k.hujanMaksPerJam > 8) rekomendasi.push("Kurangi kecepatan dan tambah jarak aman; hindari menerobos genangan yang tidak terlihat dasarnya.");
  if (k.visibilitasKm < 4) rekomendasi.push("Nyalakan lampu utama dan hindari mendahului saat jarak pandang pendek.");
  if (k.hembusanMaks > 45) rekomendasi.push("Pengendara sepeda motor sebaiknya menunda perjalanan atau memilih rute terlindung.");
  if (rekomendasi.length === 0) rekomendasi.push("Kondisi perjalanan relatif aman; tetap berkendara sesuai batas kecepatan.");

  return {
    id: "transportasi", nama: "Transportasi", skor, tingkat: tingkatDari(skor), faktor, rekomendasi,
    ringkasan:
      skor >= 50
        ? "Risiko perjalanan meningkat; perlu kewaspadaan tambahan di jalan."
        : "Kondisi perjalanan cenderung normal.",
  };
}

function banjir(k: Kondisi): SkorDampak {
  const { skor, faktor } = susunBerkerentanan(
    [
      { nama: "Curah hujan 24 jam", nilai: k.hujan24j, satuan: "mm", bobot: 0.38, n: norm(k.hujan24j, 20, 100),
        penjelasan: "Klasifikasi BMKG menyebut di atas 50 mm per hari sebagai hujan lebat." },
      { nama: "Intensitas hujan tertinggi", nilai: k.hujanMaksPerJam, satuan: "mm/jam", bobot: 0.26, n: norm(k.hujanMaksPerJam, 5, 25),
        penjelasan: "Hujan deras dalam waktu singkat melampaui kemampuan saluran air." },
      { nama: "Curah hujan 72 jam ke depan", nilai: k.hujan72j, satuan: "mm", bobot: 0.2, n: norm(k.hujan72j, 40, 180),
        penjelasan: "Hujan yang masih akan turun menambah beban saluran yang sudah terisi." },
      { nama: "Hujan 72 jam terakhir", nilai: k.hujanLalu72j, satuan: "mm", bobot: 0.16, n: norm(k.hujanLalu72j, 20, 120),
        penjelasan: "Tanah yang sudah jenuh membuat hujan berikutnya lebih banyak mengalir di permukaan." },
    ],
    { nama: "Kerentanan dataran rendah", nilai: k.elevasi, satuan: "mdpl", n: 1 - norm(k.elevasi, 5, 150),
      penjelasan: "Dataran rendah lebih sulit mengalirkan air keluar, sehingga memperbesar dampak hujan yang sama." },
  );

  const rekomendasi: string[] = [];
  if (skor >= 50) rekomendasi.push("Pantau informasi resmi BMKG dan BPBD setempat; siapkan barang penting di tempat yang lebih tinggi.");
  if (k.hujan24j > 50) rekomendasi.push("Bersihkan saluran air di sekitar rumah dari sampah dan endapan.");
  if (k.elevasi < 25 && k.hujan24j > 30) rekomendasi.push("Wilayah rendah: perhatikan kenaikan muka air di saluran terdekat.");
  if (rekomendasi.length === 0) rekomendasi.push("Belum terlihat indikasi genangan berarti dari kondisi cuaca saat ini.");

  return {
    id: "banjir", nama: "Banjir & Genangan", skor, tingkat: tingkatDari(skor), faktor, rekomendasi,
    ringkasan:
      skor >= 50
        ? "Indikator menunjukkan potensi genangan meningkat; perlu kewaspadaan."
        : "Indikator potensi genangan masih rendah.",
  };
}

function longsor(k: Kondisi): SkorDampak {
  const { skor, faktor } = susunBerkerentanan(
    [
      { nama: "Curah hujan 72 jam ke depan", nilai: k.hujan72j, satuan: "mm", bobot: 0.35, n: norm(k.hujan72j, 40, 180),
        penjelasan: "Hujan beberapa hari berturut-turut adalah pemicu longsor yang paling umum." },
      { nama: "Hujan 72 jam terakhir", nilai: k.hujanLalu72j, satuan: "mm", bobot: 0.23, n: norm(k.hujanLalu72j, 20, 120),
        penjelasan: "Lereng yang sudah basah jauh lebih mudah bergerak saat hujan berikutnya turun." },
      { nama: "Hari hujan berturut-turut", nilai: k.hariHujanBerturut, satuan: "hari", bobot: 0.2, n: norm(k.hariHujanBerturut, 1, 5),
        penjelasan: "Tanah yang terus basah kehilangan daya ikat antar-butirannya." },
      { nama: "Intensitas hujan tertinggi", nilai: k.hujanMaksPerJam, satuan: "mm/jam", bobot: 0.22, n: norm(k.hujanMaksPerJam, 5, 25),
        penjelasan: "Hujan deras menambah beban air pada lereng secara tiba-tiba." },
    ],
    { nama: "Kerentanan lahan berlereng", nilai: k.elevasi, satuan: "mdpl", n: norm(k.elevasi, 100, 800),
      penjelasan: "Ketinggian dipakai sebagai pendekatan kasar kemiringan lahan — bukan data lereng sebenarnya, dan bukan pengganti peta rawan bencana resmi." },
  );

  const rekomendasi: string[] = [];
  if (skor >= 50) rekomendasi.push("Perhatikan tanda awal seperti retakan tanah, mata air keruh baru, atau tiang yang miring.");
  if (k.hariHujanBerturut >= 3 && k.elevasi > 200) rekomendasi.push("Hindari beraktivitas di bawah tebing dan lereng terjal saat hujan berlangsung.");
  if (skor >= 75) rekomendasi.push("Ikuti arahan BPBD setempat dan kenali jalur evakuasi terdekat.");
  if (rekomendasi.length === 0) rekomendasi.push("Indikator risiko longsor masih rendah pada kondisi saat ini.");

  return {
    id: "longsor", nama: "Longsor", skor, tingkat: tingkatDari(skor), faktor, rekomendasi,
    ringkasan:
      skor >= 50
        ? "Indikator risiko longsor meningkat, terutama pada wilayah berlereng."
        : "Indikator risiko longsor masih rendah.",
  };
}

/* ── Keluaran utama ────────────────────────────────────────────────── */

/**
 * Menghitung keenam sektor dari sebuah kondisi.
 *
 * Dipisahkan dari `hitungDampak` supaya kondisi bisa datang dari mana saja —
 * bukan hanya dari prakiraan nyata. Inilah yang menggerakkan simulasi
 * skenario ("bagaimana kalau hujan deras tiga hari berturut-turut?") tanpa
 * perlu memalsukan data cuaca.
 */
export function hitungDariKondisi(kondisi: Kondisi): SkorDampak[] {
  return [
    pertanian(kondisi),
    peternakan(kondisi),
    perkebunan(kondisi),
    transportasi(kondisi),
    banjir(kondisi),
    longsor(kondisi),
  ];
}

export function hitungDampak(paket: PaketCuaca): {
  kondisi: Kondisi;
  sektor: SkorDampak[];
} {
  const kondisi = ringkasKondisi(paket);
  return { kondisi, sektor: hitungDariKondisi(kondisi) };
}

/** Skenario siap pakai untuk menjawab "bagaimana kalau …". */
export const SKENARIO = {
  "hujan-ekstrem-3-hari": {
    nama: "Hujan lebat tiga hari berturut-turut",
    keterangan: "Curah hujan 80 mm/hari selama tiga hari, puncak 18 mm/jam.",
    ubah: (k: Kondisi): Kondisi => ({
      ...k,
      hujan24j: 80,
      hujan72j: 240,
      hujanMaksPerJam: 18,
      hariHujanBerturut: 3,
      kelembapan: Math.max(k.kelembapan, 92),
      visibilitasKm: Math.min(k.visibilitasKm, 2.5),
      hembusanMaks: Math.max(k.hembusanMaks, 45),
    }),
  },
  "kemarau-panjang": {
    nama: "Kering dan panas berkepanjangan",
    keterangan: "Dua minggu tanpa hujan, suhu maksimum 36 °C, kelembapan rendah.",
    ubah: (k: Kondisi): Kondisi => ({
      ...k,
      hujan24j: 0,
      hujan72j: 0,
      hujanMaksPerJam: 0,
      hariHujanBerturut: 0,
      hujanLalu72j: 0,
      hariKeringBerturut: 14,
      suhuMaks: 36,
      suhu: 34,
      kelembapan: 42,
    }),
  },
  "angin-kencang": {
    nama: "Angin kencang disertai hujan",
    keterangan: "Hembusan hingga 65 km/jam dengan hujan sedang.",
    ubah: (k: Kondisi): Kondisi => ({
      ...k,
      hembusanMaks: 65,
      angin: 42,
      hujan24j: Math.max(k.hujan24j, 35),
      hujan72j: Math.max(k.hujan72j, 60),
      hujanMaksPerJam: Math.max(k.hujanMaksPerJam, 9),
      visibilitasKm: Math.min(k.visibilitasKm, 5),
    }),
  },
} as const;

export type IdSkenario = keyof typeof SKENARIO;
