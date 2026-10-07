/** Mengulang kota yang gagal HANYA karena dibatasi laju BMKG, lalu
 *  menggabungkannya ke src/data/wilayah.json. Jalankan sesudah
 *  bangun-wilayah.mjs bila ada laporan "dibatasi laju BMKG". */
import { readFile, writeFile } from "node:fs/promises";

const WIL = "https://www.emsifa.com/api-wilayah-indonesia/api";
const BMKG = "https://api.bmkg.go.id/publik/prakiraan-cuaca";
const KEPALA = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Referer: "https://www.bmkg.go.id/",
  Accept: "application/json",
};
const ULANG = [["17", "REJANG LEBONG"], ["33", "MAGELANG"], ["94", "BIAK NUMFOR"]];

const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
const rapikan = (s) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bDki\b/g, "DKI");

function kandidat(ppkk) {
  const out = [];
  for (const kec of ["01", "02", "03", "04", "05"])
    for (const desa of ["1001", "2001", "1002"])
      out.push(`${ppkk.slice(0, 2)}.${ppkk.slice(2, 4)}.${kec}.${desa}`);
  return out;
}

async function coba(adm4) {
  for (let i = 0; i <= 3; i++) {
    try {
      const r = await fetch(`${BMKG}?adm4=${adm4}`, { headers: KEPALA });
      if (r.status === 403 || r.status === 429) { await jeda(3000 * (i + 1)); continue; }
      if (!r.ok) return null;
      const j = await r.json();
      return j?.lokasi?.desa && Array.isArray(j?.data) ? j.lokasi : null;
    } catch { await jeda(2000 * (i + 1)); }
  }
  return null;
}

const berkas = JSON.parse(await readFile("src/data/wilayah.json", "utf8"));
const ada = new Set(berkas.kota.map((k) => k.nama.toLowerCase()));
const provinsi = Object.fromEntries(
  (await (await fetch(`${WIL}/provinces.json`)).json()).map((p) => [p.id, rapikan(p.name)]),
);

let tambah = 0;
for (const [idProv, nama] of ULANG) {
  if (ada.has(rapikan(nama).toLowerCase())) { console.log(`  lewati ${nama} (sudah ada)`); continue; }
  const kabList = await (await fetch(`${WIL}/regencies/${idProv}.json`)).json();
  const kab =
    kabList.find((k) => k.name === `KOTA ${nama}`) ??
    kabList.find((k) => k.name === `KABUPATEN ${nama}`) ??
    kabList.find((k) => k.name.includes(nama));
  if (!kab) { console.log(`  ${nama}: tidak ada di daftar wilayah`); continue; }

  let dapat = null;
  for (const adm4 of kandidat(kab.id)) {
    const lok = await coba(adm4);
    await jeda(1200);
    if (lok) { dapat = { adm4, lok }; break; }
  }
  if (!dapat) { console.log(`  ${nama}: tetap gagal`); continue; }

  berkas.kota.push({
    nama: rapikan(nama),
    tipe: kab.name.startsWith("KOTA") ? "kota" : "kabupaten",
    provinsi: provinsi[idProv],
    lat: dapat.lok.lat,
    lon: dapat.lok.lon,
    adm4: dapat.adm4,
    wilayahBMKG: `${rapikan(dapat.lok.desa)}, ${rapikan(dapat.lok.kecamatan)}, ${rapikan(dapat.lok.kotkab)}`,
  });
  tambah++;
  console.log(`  ok  ${nama} -> ${dapat.adm4}`);
}

berkas.kota.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
berkas.jumlah = berkas.kota.length;
berkas.dibuatPada = new Date().toISOString();
await writeFile("src/data/wilayah.json", JSON.stringify(berkas, null, 2), "utf8");
console.log(`\n+${tambah} kota, total ${berkas.jumlah}`);
