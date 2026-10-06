import Link from "next/link";
import { Info } from "lucide-react";
import { Kerangka } from "@/components/shell/kerangka";
import { DaftarKomoditas } from "@/components/komoditas/daftar-komoditas";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { muatHalaman } from "@/server/cuaca";
import { hitungRisikoKomoditas, tekananCuaca } from "@/lib/impact/komoditas";
import { SKENARIO } from "@/lib/impact/engine";
import { susunPeringatan } from "@/lib/impact/peringatan";
import { LOKASI_BAWAAN } from "@/lib/lokasi";

export const revalidate = 900;

export async function generateMetadata(props: PageProps<"/komoditas">) {
  const sp = await props.searchParams;
  const kota = typeof sp.kota === "string" ? sp.kota : LOKASI_BAWAAN;
  return { title: `Komoditas Terdampak di ${kota}` };
}

export default async function KomoditasPage(props: PageProps<"/komoditas">) {
  const sp = await props.searchParams;
  const diminta = typeof sp.kota === "string" ? sp.kota : LOKASI_BAWAAN;

  let data;
  try {
    data = await muatHalaman(diminta);
  } catch {
    return (
      <Kerangka kota={diminta}>
        <div className="flex min-h-[60vh] items-center justify-center px-5 py-16">
          <Card className="max-w-md p-8 text-center">
            <h1 className="text-[20px] font-extrabold tracking-tight text-ink">
              Data cuaca tidak dapat diambil
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Penilaian komoditas sepenuhnya bergantung pada kondisi cuaca,
              jadi halaman ini dibiarkan kosong daripada menampilkan angka yang
              tidak berdasar.
            </p>
            <ButtonLink href="/dashboard" variant="primary" size="md" className="mt-6">
              Kembali ke ringkasan
            </ButtonLink>
          </Card>
        </div>
      </Kerangka>
    );
  }

  const { cuaca, kondisi, sektor } = data;
  const namaKota = data.kota?.nama ?? cuaca.lokasi.nama;
  const risiko = hitungRisikoKomoditas(kondisi);
  const tekanan = tekananCuaca(kondisi);

  // Pengandaian dihitung di server dari rumus yang sama persis, bukan
  // angka yang dikarang untuk membuat halaman terlihat ramai.
  const skenario = SKENARIO["hujan-ekstrem-3-hari"];
  const risikoAndai = hitungRisikoKomoditas(skenario.ubah(kondisi));

  const daftarTekanan = [
    { nama: "Hujan berlebih", nilai: tekanan.hujanBerlebih },
    { nama: "Udara lembap", nilai: tekanan.kelembapan },
    { nama: "Angin kencang", nilai: tekanan.angin },
    { nama: "Suhu tinggi", nilai: tekanan.panas },
    { nama: "Kering berkepanjangan", nilai: tekanan.kekeringan },
  ].sort((a, b) => b.nilai - a.nilai);

  const jumlahPeringatan = susunPeringatan(cuaca, kondisi, sektor).length;
  const jam = new Date(cuaca.diambilPada).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Kerangka
      kota={namaKota}
      diperbaruiPada={jam}
      jumlahPeringatan={jumlahPeringatan}
    >
      <div className="space-y-3">
        <div className="px-1 pt-2">
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
            Komoditas yang perlu diperhatikan
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
            Dua belas komoditas pertanian dan perkebunan dinilai terhadap cuaca
            di {namaKota} saat ini. Urutannya dari yang paling perlu
            diperhatikan.
          </p>
        </div>

        {/* Tekanan cuaca yang sedang berlangsung — menjelaskan asal urutannya */}
        <Card className="p-5">
          <h2 className="text-[14px] font-extrabold tracking-tight text-ink">
            Tekanan cuaca saat ini
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
            Lima hal di bawah inilah yang menekan tanaman. Setiap komoditas
            punya kepekaan berbeda terhadap masing-masingnya — itulah yang
            membuat urutannya berbeda-beda.
          </p>
          <ul className="mt-3.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {daftarTekanan.map((t) => (
              <li key={t.nama} className="rounded-tile bg-surface-2 p-3">
                <p className="text-[11.5px] font-semibold text-ink-3">{t.nama}</p>
                <p className="mt-1 text-[17px] font-extrabold leading-none tabular-nums text-ink">
                  {Math.round(t.nilai * 100)}
                  <span className="ml-0.5 text-[10.5px] font-semibold text-ink-3">
                    /100
                  </span>
                </p>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-pill bg-line"
                  role="meter"
                  aria-valuenow={Math.round(t.nilai * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t.nama}
                >
                  <div
                    className="h-full rounded-pill bg-brand-500"
                    style={{ width: `${Math.max(t.nilai * 100, 2)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <DaftarKomoditas
          risiko={risiko}
          risikoAndai={risikoAndai}
          namaSkenario={skenario.nama}
          keteranganSkenario={skenario.keterangan}
          kota={namaKota}
        />

        {/* Batasan, ditulis sejelas isinya */}
        <Card className="flex gap-3 p-5">
          <Info className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={2.25} aria-hidden />
          <div className="text-[12px] leading-relaxed text-ink-2">
            <p>
              <strong className="font-bold text-ink">
                Bagaimana angka ini dihitung.
              </strong>{" "}
              Lima tekanan cuaca di atas dikalikan dengan kepekaan tiap
              komoditas, lalu diambil tekanan yang paling berat — bukan
              dirata-ratakan. Satu masalah besar sudah cukup menggagalkan
              panen, dan merata-ratakannya dengan empat faktor yang sedang
              tenang justru akan menyembunyikannya.
            </p>
            <p className="mt-2">
              <strong className="font-bold text-ink">Batasannya.</strong> Nilai
              kepekaan komoditas disusun dari pengetahuan budidaya yang umum
              diketahui, <em>bukan</em> dari model agronomi yang sudah
              tervalidasi lapangan. Varietas, umur tanaman, jenis tanah, dan
              pengelolaan kebun sangat memengaruhi hasil sebenarnya. Anggap ini
              pengingat untuk memeriksa lahan, bukan pengganti penyuluh
              pertanian.
            </p>
            <p className="mt-2">
              Data cuaca {cuaca.sumber.nama}, diambil pukul {jam}.{" "}
              <Link href="/dashboard" className="font-bold text-brand-700 hover:underline">
                Kembali ke ringkasan
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </Kerangka>
  );
}
