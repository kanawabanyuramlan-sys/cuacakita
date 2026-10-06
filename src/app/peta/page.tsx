import { Kerangka } from "@/components/shell/kerangka";
import { Peta } from "@/components/peta/peta-pembungkus";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { muatPeta } from "@/server/peta";
import { LOKASI_BAWAAN } from "@/lib/lokasi";

export const revalidate = 900;

export const metadata = { title: "Peta Cuaca & Risiko" };

export default async function PetaPage() {
  let data;
  try {
    data = await muatPeta();
  } catch {
    return (
      <Kerangka kota={LOKASI_BAWAAN}>
        <div className="flex min-h-[60vh] items-center justify-center px-5 py-16">
          <Card className="max-w-md p-8 text-center">
            <h1 className="text-[20px] font-extrabold tracking-tight text-ink">
              Peta tidak dapat dimuat
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Data cuaca untuk seluruh kota tidak berhasil diambil. Peta sengaja
              tidak ditampilkan setengah terisi, karena titik yang hilang akan
              terbaca seolah-olah wilayah itu aman.
            </p>
            <ButtonLink href="/dashboard" variant="primary" size="md" className="mt-6">
              Kembali ke dashboard
            </ButtonLink>
          </Card>
        </div>
      </Kerangka>
    );
  }

  return (
    <Kerangka kota={LOKASI_BAWAAN}>
      <div className="space-y-3">
        <div className="px-1 pt-2">
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
            Peta Cuaca &amp; Risiko
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
            Indikator dampak untuk {data.titik.length} kota di Indonesia,
            dihitung dari prakiraan cuaca masing-masing titik. Pilih lapisan di
            sebelah kanan untuk mengganti besaran yang ditampilkan.
          </p>
        </div>

        <Peta titik={data.titik} diambilPada={data.diambilPada} />
      </div>
    </Kerangka>
  );
}
