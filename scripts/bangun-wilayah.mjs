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
  ["11", "BANDA ACEH"], ["12", "MEDAN"], ["13", "PADANG"], ["14", "PEKANBARU"],
  ["15", "JAMBI"], ["16", "PALEMBANG"], ["17", "BENGKULU"],
  ["18", "BANDAR LAMPUNG"], ["19", "PANGKAL PINANG"], ["21", "BATAM"],
  ["31", "JAKARTA PUSAT"], ["31", "JAKARTA SELATAN"],
  ["32", "BANDUNG"], ["32", "BOGOR"], ["32", "BEKASI"], ["32", "GARUT"],
  ["32", "CIANJUR"], ["32", "CIREBON"],
  ["33", "SEMARANG"], ["33", "SURAKARTA"], ["33", "BREBES"], ["33", "MAGELANG"],
  ["34", "YOGYAKARTA"], ["34", "SLEMAN"],
  ["35", "SURABAYA"], ["35", "MALANG"], ["35", "BANYUWANGI"], ["35", "JEMBER"],
  ["36", "SERANG"], ["36", "TANGERANG"],
  ["51", "DENPASAR"], ["52", "MATARAM"], ["53", "KUPANG"],
  ["61", "PONTIANAK"], ["62", "PALANGKA RAYA"], ["63", "BANJARMASIN"],
  ["64", "SAMARINDA"], ["64", "BALIKPAPAN"],
  ["71", "MANADO"], ["72", "PALU"], ["73", "MAKASSAR"], ["74", "KENDARI"],
  ["75", "GORONTALO"], ["81", "AMBON"], ["91", "JAYAPURA"],
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
