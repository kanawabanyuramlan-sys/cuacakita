import Link from "next/link";
import { ArrowRight, RefreshCw, ShieldAlert } from "lucide-react";
import { Kerangka, StripLangsung } from "@/components/shell/kerangka";
import { TombolCetak } from "@/components/shell/tombol-cetak";
import { PemilihLokasi } from "@/components/dashboard/pemilih-lokasi";
import { KartuSaran } from "@/components/dashboard/kartu-saran";
import {
  DampakRingkas,
  DetailCuaca,
  PrakiraanRingkas,
} from "@/components/dashboard/panel-kanan";
import { KartuSektor } from "@/components/dashboard/kartu-sektor";
import { GrafikPerJam } from "@/components/dashboard/grafik-perjam";
import { PanelBMKG, PanelInsight } from "@/components/dashboard/panel";
import { TanyaCuacaKita } from "@/components/dashboard/tanya";
import { PetaRingkas } from "@/components/peta/peta-pembungkus";
import { RantaiDampak } from "@/components/rantai-dampak";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { muatHalaman } from "@/server/cuaca";
import { muatPeta, type TitikPeta } from "@/server/peta";
import { bangunRantai } from "@/lib/impact/rantai";
import { susunInsight } from "@/lib/impact/insight";
import { susunSaran } from "@/lib/impact/saran";
import { susunTanya } from "@/lib/impact/tanya";
import { susunPeringatan } from "@/lib/impact/peringatan";
import { LOKASI_BAWAAN } from "@/lib/lokasi";

export const revalidate = 900;

export async function generateMetadata(props: PageProps<"/dashboard">) {
  const sp = await props.searchParams;
  const kota = typeof sp.kota === "string" ? sp.kota : LOKASI_BAWAAN;
  return { title: `Cuaca & Dampak ${kota}` };
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const sp = await props.searchParams;
  const diminta = typeof sp.kota === "string" ? sp.kota : LOKASI_BAWAAN;

  let data;
  try {
    data = await muatHalaman(diminta);
  } catch {
    return <HalamanGagal kota={diminta} />;
  }

  // Peta bersifat pelengkap: kegagalannya tidak boleh menjatuhkan dashboard.
  let titikPeta: TitikPeta[] = [];
  try {
    titikPeta = (await muatPeta()).titik;
  } catch {
    titikPeta = [];
  }

  const { cuaca, kondisi, sektor, bmkg, catatanBMKG } = data;
  const simpul = bangunRantai(kondisi, sektor, cuaca.sekarang.labelCuaca);
  const insight = susunInsight(cuaca, kondisi, sektor);
  const saran = susunSaran(cuaca, kondisi, sektor);
  const tanya = susunTanya(cuaca, kondisi, sektor);
  const namaKota = data.kota?.nama ?? cuaca.lokasi.nama;
  const perluWaspada = sektor.filter((s) => s.skor >= 50);

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
      strip={
        <StripLangsung
          mendesak={saran.nada === "waspada"}
          pesan={
            <>
              <strong className="font-bold text-ink">{saran.judul}</strong>{" "}
              <Link
                href="#dampak"
                className="inline-flex items-center gap-0.5 font-bold text-brand-700 hover:underline"
              >
                Lihat rincian
                <ArrowRight className="size-3" strokeWidth={2.75} aria-hidden />
              </Link>
            </>
          }
          kanan={
            <>
              <PemilihLokasi terpilih={namaKota} />
              <TombolCetak />
            </>
          }
        />
      }
    >
      <div className="space-y-3">
        {/* Ringkasan bahasa sehari-hari — bagian pertama yang dibaca */}
        <KartuSaran saran={saran} kota={namaKota} />

        {/* Peta di kiri, rincian di kanan — susunan utama seperti referensi */}
        <div
          style={{ "--tunda": "110ms" } as React.CSSProperties}
          className="muncul grid gap-3 xl:grid-cols-[1.55fr_1fr]"
        >
          <div className="space-y-3">
            {titikPeta.length > 0 ? (
              <PetaRingkas
                titik={titikPeta}
                pusat={[cuaca.lokasi.lat, cuaca.lokasi.lon]}
                sorot={namaKota}
                jumlahPeringatan={perluWaspada.length}
              />
            ) : (
              <Card className="flex h-64 items-center justify-center p-6 text-center">
                <p className="text-[13px] leading-relaxed text-ink-3">
                  Peta sedang tidak dapat dimuat. Angka di halaman ini tetap
                  berasal dari data cuaca yang berhasil diambil.
                </p>
              </Card>
            )}

            <GrafikPerJam perJam={cuaca.perJam} mulai={cuaca.sekarang.waktu} />
          </div>

          <div className="space-y-3">
            <DetailCuaca paket={cuaca} kondisi={kondisi} />
            <PrakiraanRingkas paket={cuaca} />
            <DampakRingkas sektor={sektor} />
          </div>
        </div>

        {/* Rantai dampak */}
        <Card
          id="rantai"
          style={{ "--tunda": "190ms" } as React.CSSProperties}
          className="muncul p-5"
        >
          <h2 className="text-[17px] font-extrabold tracking-tight text-ink">
            Dari cuaca, ke mana saja pengaruhnya?
          </h2>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-2">
            Hujan tidak berhenti di langit. Ikuti alurnya dari kiri ke kanan —
            klik salah satu kotak untuk tahu dari mana angkanya berasal.
          </p>
          <RantaiDampak simpul={simpul} className="mt-5" />
        </Card>

        {/* Rincian enam sektor */}
        <section
          id="dampak"
          style={{ "--tunda": "260ms" } as React.CSSProperties}
          className="muncul scroll-mt-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-3 px-1 pb-3 pt-2">
            <div>
              <h2 className="text-[19px] font-extrabold tracking-tight text-ink">
                Rincian enam bidang
              </h2>
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-2">
                Angka 0–100: makin tinggi, makin besar pengaruh cuaca. Buka
                “Lihat dasar perhitungan” pada tiap kartu untuk melihat
                faktornya satu per satu.
              </p>
            </div>
            <span className="rounded-pill border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-ink-3">
              Indikator analitis, bukan peringatan resmi
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {sektor.map((s) => (
              <KartuSektor key={s.id} sektor={s} />
            ))}
          </div>
        </section>

        {/* Tanya jawab + penjelasan panjang */}
        <div
          style={{ "--tunda": "330ms" } as React.CSSProperties}
          className="muncul grid gap-3 xl:grid-cols-2"
        >
          <TanyaCuacaKita jawaban={tanya} />
          <div className="space-y-3">
            <PanelInsight insight={insight} />
            <PanelBMKG bmkg={bmkg} catatan={catatanBMKG} />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 text-[12px] leading-relaxed text-ink-3 sm:flex-row sm:items-center">
          <ShieldAlert className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
          <p>
            Data cuaca {cuaca.sumber.nama}, diambil pukul {jam}. Elevasi{" "}
            {cuaca.lokasi.elevasi?.toFixed(0)} mdpl dipakai sebagai pendekatan
            kasar topografi, bukan data kemiringan lereng. CuacaKita adalah
            platform analisis informasi — untuk peringatan resmi, rujuk BMKG dan
            BPBD setempat. Dalam keadaan darurat, hubungi 112.
          </p>
        </div>
      </div>
    </Kerangka>
  );
}

function HalamanGagal({ kota }: { kota: string }) {
  return (
    <Kerangka kota={kota}>
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-16">
        <Card className="max-w-md p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-panel bg-surface-2 text-ink-3">
            <RefreshCw className="size-6" strokeWidth={2} aria-hidden />
          </span>
          <h1 className="mt-5 text-[20px] font-extrabold tracking-tight text-ink">
            Data cuaca tidak dapat diambil
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
            Layanan cuaca tidak menjawab untuk lokasi “{kota}”. Halaman ini
            sengaja dibiarkan kosong — CuacaKita tidak mengisi kekosongan data
            dengan angka perkiraan sendiri.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <ButtonLink
              href={`/dashboard?kota=${encodeURIComponent(LOKASI_BAWAAN)}`}
              variant="primary"
              size="md"
            >
              Coba lokasi bawaan
            </ButtonLink>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-pill border border-line-strong px-5 text-sm font-semibold text-ink transition-colors hover:border-brand-400 hover:text-brand-700"
            >
              Kembali ke beranda
            </Link>
          </div>
        </Card>
      </div>
    </Kerangka>
  );
}
