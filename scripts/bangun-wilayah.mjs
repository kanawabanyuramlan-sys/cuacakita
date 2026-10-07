/**
 * Membangun src/data/wilayah.json — kota besar Indonesia beserta kode
 * wilayah BMKG tingkat desa/kelurahan (adm4).
 *
 * BMKG hanya melayani tingkat adm4, jadi tiap kota butuh satu kelurahan
 * perwakilan. Skrip ini TIDAK mengarang kode: setiap kandidat diuji ke
 * BMKG dan hanya yang menjawab dengan data yang ditulis.
 *
 * Catatan penting: BMKG membatasi laju permintaan. Percobaan dengan jeda
 * pendek membuat kota yang sebenarnya valid tampak gagal. Karena itu
 * kandidat dibangun secara deterministik (sedikit permintaan) dan tiap
 * kegagalan diulang dengan jeda yang membesar.
 *
 * Jalankan ulang bila daftar kota berubah:  node scripts/bangun-wilayah.mjs
 */

import { writeFile, mkdir } from "node:fs/promises";

const WIL = "https://www.emsifa.com/api-wilayah-indonesia/api";
const BMKG = "https://api.bmkg.go.id/publik/prakiraan-cuaca";
const KEPALA = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Referer: "https://www.bmkg.go.id/",
  Accept: "application/json",
};

const SASARAN = [
  // Aceh
  ["11", "BANDA ACEH"], ["11", "LHOKSEUMAWE"], ["11", "ACEH UTARA"], ["11", "ACEH TENGAH"],
  // Sumatera Utara
  ["12", "MEDAN"], ["12", "BINJAI"], ["12", "PEMATANG SIANTAR"], ["12", "SIBOLGA"],
  ["12", "DELI SERDANG"], ["12", "KARO"], ["12", "SIMALUNGUN"],
  // Sumatera Barat
  ["13", "PADANG"], ["13", "BUKITTINGGI"], ["13", "PARIAMAN"], ["13", "AGAM"], ["13", "SOLOK"],
  // Riau & Kepri
  ["14", "PEKANBARU"], ["14", "DUMAI"], ["14", "KAMPAR"], ["14", "INDRAGIRI HILIR"],
  ["21", "BATAM"], ["21", "TANJUNG PINANG"], ["21", "BINTAN"],
  // Jambi, Sumsel, Bengkulu, Lampung, Babel
  ["15", "JAMBI"], ["15", "MUARO JAMBI"], ["15", "KERINCI"],
  ["16", "PALEMBANG"], ["16", "LUBUK LINGGAU"], ["16", "OGAN KOMERING ILIR"], ["16", "BANYUASIN"],
  ["17", "BENGKULU"], ["17", "REJANG LEBONG"],
  ["18", "BANDAR LAMPUNG"], ["18", "METRO"], ["18", "LAMPUNG SELATAN"], ["18", "LAMPUNG TENGAH"],
  ["19", "PANGKAL PINANG"], ["19", "BELITUNG"],
  // DKI Jakarta
  ["31", "JAKARTA PUSAT"], ["31", "JAKARTA SELATAN"], ["31", "JAKARTA TIMUR"],
  ["31", "JAKARTA BARAT"], ["31", "JAKARTA UTARA"],
  // Jawa Barat
  ["32", "BANDUNG"], ["32", "BOGOR"], ["32", "BEKASI"], ["32", "DEPOK"], ["32", "CIMAHI"],
  ["32", "CIREBON"], ["32", "TASIKMALAYA"], ["32", "SUKABUMI"], ["32", "BANJAR"],
  ["32", "GARUT"], ["32", "CIANJUR"], ["32", "KARAWANG"], ["32", "SUBANG"], ["32", "INDRAMAYU"],
  ["32", "MAJALENGKA"], ["32", "KUNINGAN"], ["32", "PANGANDARAN"], ["32", "PURWAKARTA"],
  // Jawa Tengah
  ["33", "SEMARANG"], ["33", "SURAKARTA"], ["33", "SALATIGA"], ["33", "MAGELANG"],
  ["33", "PEKALONGAN"], ["33", "TEGAL"], ["33", "BREBES"], ["33", "CILACAP"],
  ["33", "BANYUMAS"], ["33", "KUDUS"], ["33", "JEPARA"], ["33", "PATI"], ["33", "REMBANG"],
  ["33", "KLATEN"], ["33", "BOYOLALI"], ["33", "WONOSOBO"], ["33", "PURWOREJO"], ["33", "KEBUMEN"],
  // DI Yogyakarta
  ["34", "YOGYAKARTA"], ["34", "SLEMAN"], ["34", "BANTUL"], ["34", "GUNUNG KIDUL"], ["34", "KULON PROGO"],
  // Jawa Timur
  ["35", "SURABAYA"], ["35", "MALANG"], ["35", "KEDIRI"], ["35", "MADIUN"], ["35", "BLITAR"],
  ["35", "PASURUAN"], ["35", "PROBOLINGGO"], ["35", "MOJOKERTO"], ["35", "BATU"],
  ["35", "SIDOARJO"], ["35", "GRESIK"], ["35", "LAMONGAN"], ["35", "TUBAN"], ["35", "BANYUWANGI"],
  ["35", "JEMBER"], ["35", "LUMAJANG"], ["35", "BOJONEGORO"], ["35", "PAMEKASAN"], ["35", "SUMENEP"],
  // Banten
  ["36", "SERANG"], ["36", "TANGERANG"], ["36", "CILEGON"], ["36", "PANDEGLANG"], ["36", "LEBAK"],
  // Bali & Nusa Tenggara
  ["51", "DENPASAR"], ["51", "BADUNG"], ["51", "BULELENG"], ["51", "GIANYAR"], ["51", "TABANAN"],
  ["52", "MATARAM"], ["52", "BIMA"], ["52", "SUMBAWA"], ["52", "LOMBOK TIMUR"],
  ["53", "KUPANG"], ["53", "ENDE"], ["53", "SIKKA"], ["53", "MANGGARAI BARAT"], ["53", "SUMBA TIMUR"],
  // Kalimantan
  ["61", "PONTIANAK"], ["61", "SINGKAWANG"], ["61", "KETAPANG"], ["61", "SAMBAS"],
  ["62", "PALANGKA RAYA"], ["62", "KOTAWARINGIN TIMUR"], ["62", "KAPUAS"],
  ["63", "BANJARMASIN"], ["63", "BANJARBARU"], ["63", "KOTABARU"], ["63", "TANAH LAUT"],
  ["64", "SAMARINDA"], ["64", "BALIKPAPAN"], ["64", "BONTANG"], ["64", "KUTAI KARTANEGARA"],
  ["65", "TARAKAN"], ["65", "BULUNGAN"],
  // Sulawesi
  ["71", "MANADO"], ["71", "BITUNG"], ["71", "TOMOHON"], ["71", "MINAHASA"],
  ["72", "PALU"], ["72", "DONGGALA"], ["72", "POSO"], ["72", "BANGGAI"],
  ["73", "MAKASSAR"], ["73", "PARE-PARE"], ["73", "PALOPO"], ["73", "GOWA"], ["73", "BONE"],
  ["73", "BULUKUMBA"], ["73", "MAROS"],
  ["74", "KENDARI"], ["74", "BAU-BAU"], ["74", "KOLAKA"],
  ["75", "GORONTALO"], ["76", "MAMUJU"], ["76", "POLEWALI MANDAR"],
  // Maluku & Papua
  ["81", "AMBON"], ["81", "MALUKU TENGAH"], ["81", "TUAL"],
  ["82", "TERNATE"], ["82", "TIDORE KEPULAUAN"],
  ["91", "SORONG"], ["91", "MANOKWARI"], ["91", "FAKFAK"],
  ["94", "JAYAPURA"], ["94", "MERAUKE"], ["94", "MIMIKA"], ["94", "BIAK NUMFOR"], ["94", "NABIRE"],
];

const jeda = (ms) => new Promise((r) => setTimeout(r, ms));

const ambil = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

const rapikan = (s) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bDki\b/g, "DKI");

/**
 * Kandidat adm4 untuk satu kabupaten/kota, diurutkan dari pola yang paling
 * sering dipakai. Kelurahan biasanya bernomor 1001+, desa 2001+.
 */
function kandidat(ppkk) {
  const pp = ppkk.slice(0, 2);
  const kk = ppkk.slice(2, 4);
  const out = [];
  for (const kec of ["01", "02", "03", "04", "05"]) {
    for (const desa of ["1001", "2001", "1002"]) {
      out.push(`${pp}.${kk}.${kec}.${desa}`);
    }
  }
  return out;
}

/** Satu permintaan BMKG dengan percobaan ulang saat dibatasi laju. */
async function cobaBMKG(adm4, ulang = 2) {
  for (let i = 0; i <= ulang; i++) {
    try {
      const r = await fetch(`${BMKG}?adm4=${adm4}`, { headers: KEPALA });
      if (r.status === 403 || r.status === 429) {
        // Dibatasi laju, bukan kode salah — tunggu lebih lama lalu ulangi.
        if (i < ulang) {
          await jeda(1500 * (i + 1));
          continue;
        }
        return { status: "dibatasi" };
      }
      if (!r.ok) return { status: "tidak-ada" };
      const j = await r.json();
      if (!j?.lokasi?.desa || !Array.isArray(j?.data)) return { status: "tidak-ada" };
      return { status: "ok", lokasi: j.lokasi };
    } catch {
      if (i < ulang) await jeda(1200 * (i + 1));
    }
  }
  return { status: "gagal" };
}

async function main() {
  const provinsi = Object.fromEntries(
    (await ambil(`${WIL}/provinces.json`)).map((p) => [p.id, rapikan(p.name)]),
  );

  const hasil = [];
  const gagal = [];

  for (const [idProv, nama] of SASARAN) {
    let kabList;
    try {
      kabList = await ambil(`${WIL}/regencies/${idProv}.json`);
    } catch {
      gagal.push(`${nama}: daftar kabupaten gagal diambil`);
      continue;
    }

    const kab =
      kabList.find((k) => k.name === `KOTA ${nama}`) ??
      kabList.find((k) => k.name === `KABUPATEN ${nama}`) ??
      kabList.find((k) => k.name.includes(nama));
    if (!kab) {
      gagal.push(`${nama}: tidak ada di daftar wilayah`);
      continue;
    }

    let ketemu = null;
    let dibatasi = false;
    for (const adm4 of kandidat(kab.id)) {
      const r = await cobaBMKG(adm4);
      await jeda(650); // sopan terhadap BMKG
      if (r.status === "ok") {
        ketemu = { adm4, lokasi: r.lokasi };
        break;
      }
      if (r.status === "dibatasi") dibatasi = true;
    }

    if (!ketemu) {
      gagal.push(`${nama}: ${dibatasi ? "dibatasi laju BMKG" : "tidak ada adm4 cocok"}`);
      continue;
    }

    hasil.push({
      nama: rapikan(nama),
      tipe: kab.name.startsWith("KOTA") ? "kota" : "kabupaten",
      provinsi: provinsi[idProv],
      lat: ketemu.lokasi.lat,
      lon: ketemu.lokasi.lon,
      adm4: ketemu.adm4,
      wilayahBMKG: `${rapikan(ketemu.lokasi.desa)}, ${rapikan(ketemu.lokasi.kecamatan)}, ${rapikan(ketemu.lokasi.kotkab)}`,
    });
    process.stdout.write(`  ok  ${nama} -> ${ketemu.adm4}\n`);
  }

  hasil.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  await mkdir("src/data", { recursive: true });
  await writeFile(
    "src/data/wilayah.json",
    JSON.stringify(
      {
        catatan:
          "Dihasilkan oleh scripts/bangun-wilayah.mjs. Setiap adm4 sudah diuji langsung ke BMKG.",
        dibuatPada: new Date().toISOString(),
        jumlah: hasil.length,
        kota: hasil,
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`\nBerhasil: ${hasil.length} kota -> src/data/wilayah.json`);
  if (gagal.length) console.log(`Gagal (${gagal.length}):\n  ` + gagal.join("\n  "));
}

main().catch((e) => {
  console.error("Gagal total:", e);
  process.exit(1);
});
