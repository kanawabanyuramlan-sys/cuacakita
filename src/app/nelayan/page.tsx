import { Kerangka } from "@/components/shell/kerangka";
import { BukanPesisir, PanelLaut } from "@/components/nelayan/panel-laut";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { muatHalaman } from "@/server/cuaca";
import { cariKondisiLaut } from "@/server/sources/laut";
import { nilaiKondisiLaut } from "@/lib/impact/nelayan";
import { susunPeringatan } from "@/lib/impact/peringatan";
import { LOKASI_BAWAAN } from "@/lib/lokasi";

export const revalidate = 900;

export async function generateMetadata(props: PageProps<"/nelayan">) {
  const sp = await props.searchParams;
  const kota = typeof sp.kota === "string" ? sp.kota : LOKASI_BAWAAN;
  return { title: `Kondisi Laut · ${kota}` };
}

export default async function NelayanPage(props: PageProps<"/nelayan">) {
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
              Penilaian kondisi melaut membutuhkan data angin, dan tanpa itu
              halaman ini dibiarkan kosong. Untuk keputusan melaut, jangan
              bergantung pada satu sumber — rujuk BMKG Maritim.
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
  const jumlahPeringatan = susunPeringatan(cuaca, kondisi, sektor).length;
  const jam = new Date(cuaca.diambilPada).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Perairan terdekat dicari saat permintaan, bukan disimpan di berkas
  // wilayah: satu permintaan multi-koordinat sudah cukup, dan hasilnya
  // selalu mengikuti data terbaru.
  const laut = await cariKondisiLaut(cuaca.lokasi.lat, cuaca.lokasi.lon);
  const nilai = laut ? nilaiKondisiLaut(laut, kondisi) : null;

  return (
    <Kerangka
      kota={namaKota}
      diperbaruiPada={jam}
      jumlahPeringatan={jumlahPeringatan}
    >
      <div className="space-y-3">
        <div className="px-1 pt-2">
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
            Kondisi Laut
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
            Tinggi gelombang di perairan terdekat {namaKota}, dinilai terhadap
            ambang keselamatan pelayaran BMKG per jenis kapal.
          </p>
        </div>

        {laut && nilai ? (
          <PanelLaut laut={laut} nilai={nilai} kota={namaKota} />
        ) : (
          <BukanPesisir kota={namaKota} />
        )}
      </div>
    </Kerangka>
  );
}
