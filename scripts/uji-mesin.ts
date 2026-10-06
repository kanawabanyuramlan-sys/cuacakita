import { hitungDariKondisi, SKENARIO, type Kondisi } from "../src/lib/impact/engine";

const DASAR: Kondisi = {
  hujan24j: 2, hujan72j: 5, hujanMaksPerJam: 1, hariHujanBerturut: 0, hujanLalu72j: 4, hariKeringBerturut: 1,
  suhu: 28, suhuMaks: 31, suhuMin: 23, kelembapan: 70,
  angin: 10, hembusanMaks: 22, visibilitasKm: 15, elevasi: 50, indeksUV: 6,
};

const baris = (label: string, k: Kondisi) => {
  const s = Object.fromEntries(hitungDariKondisi(k).map((x) => [x.id, x.skor]));
  console.log(
    (label + "                                ").slice(0, 32),
    "tani", String(s.pertanian).padStart(3),
    "ternak", String(s.peternakan).padStart(3),
    "kebun", String(s.perkebunan).padStart(3),
    "transp", String(s.transportasi).padStart(3),
    "banjir", String(s.banjir).padStart(3),
    "longsor", String(s.longsor).padStart(3),
  );
};

console.log("\n=== DATARAN RENDAH (50 mdpl) ===");
baris("tenang", DASAR);
for (const [id, sk] of Object.entries(SKENARIO)) baris(id, sk.ubah(DASAR));

const GUNUNG: Kondisi = { ...DASAR, elevasi: 900 };
console.log("\n=== DAERAH TINGGI (900 mdpl) ===");
baris("tenang", GUNUNG);
for (const [id, sk] of Object.entries(SKENARIO)) baris(id, sk.ubah(GUNUNG));

const PESISIR: Kondisi = { ...DASAR, elevasi: 3 };
console.log("\n=== PESISIR (3 mdpl) ===");
baris("tenang", PESISIR);
baris("hujan-ekstrem-3-hari", SKENARIO["hujan-ekstrem-3-hari"].ubah(PESISIR));
