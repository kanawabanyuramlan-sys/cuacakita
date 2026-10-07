/**
 * Menambah kota ke src/data/wilayah.json memakai wilayah.id.
 *
 * Mengapa sumber ini, bukan yang dipakai scripts/bangun-wilayah.mjs:
 * wilayah.id menyajikan data Permendagri yang masih dipelihara (lihat
 * `meta.updated_at` pada tiap tanggapan) DAN kodenya sudah berformat
 * titik, persis seperti yang diminta BMKG. Artinya kode desa tidak perlu
 * ditebak sama sekali — penyebab kegagalan terbesar pada skrip lama.
 *
 * Contoh nyata: Kota Batam tidak punya desa bernomor 1001; daftarnya
 * mulai dari 1002. Menebak pola "1001, 2001, 1002" akan terus meleset.
 *
 * Setiap kode tetap diuji ke BMKG sebelum ditulis. Tidak ada kode yang
 * masuk repositori tanpa pernah menjawab.
 *
 * Jalankan: node scripts/tambah-wilayah.mjs
 */

import { readFile, writeFile } from "node:fs/promises";

const WIL = "https://wilayah.id/api";
const BMKG = "https://api.bmkg.go.id/publik/prakiraan-cuaca";
const KEPALA = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Referer: "https://www.bmkg.go.id/",
  Accept: "application/json",
};

/** Kota yang gagal pada skrip lama, ditambah beberapa yang belum pernah dicoba. */
const SASARAN = [
  // Ejaan dan provinsi dikoreksi setelah ditelusuri di wilayah.id:
  // "Lubuklinggau" ternyata "Lubuk Linggau", "Fakfak" ternyata "Fak Fak",
  // dan Mimika kini berada di Papua Tengah (94) setelah pemekaran.
  ["16", "Lubuk Linggau"], ["92", "Fak Fak"], ["94", "Mimika"],
  ["74", "Bau"], ["96", "Sorong"], ["93", "Merauke"], ["95", "Jayawijaya"],
];

const jeda = (ms) => new Promise((r) => setTimeout(r, ms));

async function ambilJson(url, ulang = 2) {
  for (let i = 0; i <= ulang; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.json();
    } catch {
      /* dicoba lagi di bawah */
    }
    if (i < ulang) await jeda(900 * (i + 1));
  }
  return null;
}

/** Satu permintaan BMKG dengan percobaan ulang saat dibatasi laju. */
async function cobaBMKG(adm4, ulang = 3) {
  for (let i = 0; i <= ulang; i++) {
    try {
      const r = await fetch(`${BMKG}?adm4=${adm4}`, { headers: KEPALA });
      if (r.status === 403 || r.status === 429) {
        if (i < ulang) {
          await jeda(2500 * (i + 1));
          continue;
        }
        return { status: "dibatasi" };
      }
      if (!r.ok) return { status: "tidak-ada" };
      const j = await r.json();
      if (!j?.lokasi?.desa || !Array.isArray(j?.data)) return { status: "tidak-ada" };
      return { status: "ok", lokasi: j.lokasi };
    } catch {
      if (i < ulang) await jeda(2000 * (i + 1));
    }
  }
  return { status: "gagal" };
}

const berkas = JSON.parse(await readFile("src/data/wilayah.json", "utf8"));
const sudahAda = new Set(berkas.kota.map((k) => k.adm4));
const namaAda = new Set(berkas.kota.map((k) => k.nama.toLowerCase()));

const provinsi = Object.fromEntries(
  ((await ambilJson(`${WIL}/provinces.json`))?.data ?? []).map((p) => [
    p.code,
    p.name,
  ]),
);

let tambah = 0;
const gagal = [];

for (const [kodeProv, nama] of SASARAN) {
  if (namaAda.has(nama.toLowerCase())) {
    console.log(`  lewati ${nama} (sudah ada)`);
    continue;
  }

  const kabList = (await ambilJson(`${WIL}/regencies/${kodeProv}.json`))?.data;
  if (!kabList) {
    gagal.push(`${nama}: daftar kabupaten tidak terambil`);
    continue;
  }

  const cocok = nama.toLowerCase();
  const kab =
    kabList.find((k) => k.name.toLowerCase() === `kota ${cocok}`) ??
    kabList.find((k) => k.name.toLowerCase() === `kabupaten ${cocok}`) ??
    kabList.find((k) => k.name.toLowerCase().includes(cocok));
  if (!kab) {
    gagal.push(`${nama}: tidak ada di daftar wilayah`);
    continue;
  }

  const kecList = (await ambilJson(`${WIL}/districts/${kab.code}.json`))?.data;
  if (!kecList?.length) {
    gagal.push(`${nama}: daftar kecamatan kosong`);
    continue;
  }

  let dapat = null;
  let dibatasi = false;

  // Kode desa diambil apa adanya dari daftar, bukan ditebak.
  for (const kec of kecList.slice(0, 4)) {
    const desaList = (await ambilJson(`${WIL}/villages/${kec.code}.json`))?.data;
    if (!desaList?.length) continue;

    for (const desa of desaList.slice(0, 3)) {
      if (sudahAda.has(desa.code)) continue;
      const r = await cobaBMKG(desa.code);
      await jeda(900);
      if (r.status === "ok") {
        dapat = { adm4: desa.code, lokasi: r.lokasi };
        break;
      }
      if (r.status === "dibatasi") dibatasi = true;
    }
    if (dapat) break;
  }

  if (!dapat) {
    gagal.push(`${nama}: ${dibatasi ? "dibatasi laju BMKG" : "tidak ada kode diterima BMKG"}`);
    continue;
  }

  berkas.kota.push({
    nama: kab.name.replace(/^(Kota|Kabupaten)\s+/i, ""),
    tipe: kab.name.toLowerCase().startsWith("kota") ? "kota" : "kabupaten",
    provinsi: provinsi[kodeProv] ?? kodeProv,
    lat: dapat.lokasi.lat,
    lon: dapat.lokasi.lon,
    adm4: dapat.adm4,
    wilayahBMKG: `${dapat.lokasi.desa}, ${dapat.lokasi.kecamatan}, ${dapat.lokasi.kotkab}`,
  });
  sudahAda.add(dapat.adm4);
  namaAda.add(kab.name.replace(/^(Kota|Kabupaten)\s+/i, "").toLowerCase());
  tambah++;
  console.log(`  ok  ${nama} -> ${dapat.adm4}`);
}

berkas.kota.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
berkas.jumlah = berkas.kota.length;
berkas.dibuatPada = new Date().toISOString();
berkas.catatan =
  "Dihasilkan oleh scripts/bangun-wilayah.mjs dan scripts/tambah-wilayah.mjs. " +
  "Setiap adm4 sudah diuji langsung ke BMKG.";

await writeFile("src/data/wilayah.json", JSON.stringify(berkas, null, 2), "utf8");

console.log(`\n+${tambah} kota, total ${berkas.jumlah}`);
if (gagal.length) console.log(`Gagal (${gagal.length}):\n  ` + gagal.join("\n  "));
