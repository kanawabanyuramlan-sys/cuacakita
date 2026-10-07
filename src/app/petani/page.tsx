import { Kerangka } from "@/components/shell/kerangka";
import { ModePetani } from "@/components/petani/mode-petani";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { muatHalaman } from "@/server/cuaca";
import { susunJadwalKerja } from "@/lib/impact/petani";
import { susunPeringatan } from "@/lib/impact/peringatan";
import { LOKASI_BAWAAN } from "@/lib/lokasi";

export const revalidate = 900;

export async function generateMetadata(props: PageProps<"/petani">) {
  const sp = await props.searchParams;
  const kota = typeof sp.kota === "string" ? sp.kota : LOKASI_BAWAAN;
  return { title: `Mode Petani · ${kota}` };
}

export default async function PetaniPage(props: PageProps<"/petani">) {
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
              Jadwal kerja kebun sepenuhnya dihitung dari prakiraan per jam.
              Tanpa datanya, halaman ini dibiarkan kosong daripada memberi
              anjuran yang tidak berdasar.
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
  const jadwal = susunJadwalKerja(cuaca);
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
            Mode Petani
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
            Simpan komoditas yang Anda tanam beserta tahapnya, lalu lihat
            penilaian dan jadwal kerja kebun yang menyesuaikan diri dengan
            pilihan itu.
          </p>
        </div>

        <ModePetani kondisi={kondisi} jadwal={jadwal} kota={namaKota} />
      </div>
    </Kerangka>
  );
}
