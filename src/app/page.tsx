import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import {
  BagianModul,
  BagianRantai,
  BagianSumber,
} from "@/components/landing/bagian";
import { LandingFooter } from "@/components/landing/footer";
import { muatHalaman, type DataHalaman } from "@/server/cuaca";
import { bangunRantai } from "@/lib/impact/rantai";
import { LOKASI_BAWAAN } from "@/lib/lokasi";

// Halaman dibangun ulang tiap 15 menit, mengikuti irama pembaruan
// Open-Meteo. Pengunjung mendapat HTML yang sudah jadi, tetapi angkanya
// tidak pernah lebih lama dari satu siklus model.
export const revalidate = 900;

export default async function Beranda() {
  let data: DataHalaman | null = null;
  try {
    data = await muatHalaman(LOKASI_BAWAAN);
  } catch {
    // Halaman tetap tampil tanpa angka, bukan dengan angka karangan.
    data = null;
  }

  const simpul = data
    ? bangunRantai(data.kondisi, data.sektor, data.cuaca.sekarang.labelCuaca)
    : null;

  return (
    <>
      <LandingNav />
      <main className="flex-1">
        <Hero data={data} />
        <div className="app-canvas">
          <BagianRantai simpul={simpul} />
          <BagianModul />
          <BagianSumber />
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
