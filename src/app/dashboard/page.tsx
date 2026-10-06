import Link from "next/link";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { Topbar } from "@/components/dashboard/topbar";
import { KartuSekarang } from "@/components/dashboard/kartu-sekarang";
import { KartuSektor } from "@/components/dashboard/kartu-sektor";
import { GrafikPerJam } from "@/components/dashboard/grafik-perjam";
import { PanelBMKG, PanelInsight } from "@/components/dashboard/panel";
import { RantaiDampak } from "@/components/rantai-dampak";
import { Card, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { IkonCuaca } from "@/components/ui/ikon-cuaca";
import { muatHalaman } from "@/server/cuaca";
import { bangunRantai } from "@/lib/impact/rantai";
import { susunInsight } from "@/lib/impact/insight";
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

  const { cuaca, kondisi, sektor, bmkg, catatanBMKG } = data;
  const simpul = bangunRantai(kondisi, sektor, cuaca.sekarang.labelCuaca);
  const insight = susunInsight(cuaca, kondisi, sektor);
  const namaKota = data.kota?.nama ?? cuaca.lokasi.nama;

  const perluWaspada = sektor.filter((s) => s.skor >= 50);

  return (
    <div className="app-canvas min-h-screen">
      <Topbar kota={namaKota} />

      <main className="mx-auto max-w-[1500px] space-y-3 px-4 py-4 sm:px-6">
        {/* Peringatan, hanya muncul bila memang ada yang perlu diperhatikan */}
        {perluWaspada.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-card border border-[color:var(--color-tingkat-sedang)]/35 bg-tint-sun/45 p-4 sm:flex-row sm:items-center">
            <AlertTriangle
              className="size-5 shrink-0 text-[color:var(--color-tingkat-sedang)]"
              strokeWidth={2.5}
              aria-hidden
            />
            <p className="text-[13px] leading-relaxed text-ink-2">
              <strong className="font-bold text-ink">
                Perlu kewaspadaan:{" "}
                {perluWaspada.map((s) => s.nama.toLowerCase()).join(", ")}.
              </strong>{" "}
              Ini indikator analitis CuacaKita, bukan peringatan dini resmi.
              Untuk peringatan resmi, ikuti BMKG dan BPBD setempat.
            </p>
          </div>
        ) : null}

        {/* Kondisi sekarang + ringkasan */}
        <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
          <KartuSekarang paket={cuaca} kondisi={kondisi} />
          <PanelInsight insight={insight} />
        </div>

        {/* Grafik per jam */}
        <GrafikPerJam perJam={cuaca.perJam} mulai={cuaca.sekarang.waktu} />

        {/* Prakiraan harian */}
        <Card>
          <CardHeader
            title="Prakiraan tujuh hari"
            subtitle="Open-Meteo · suhu minimum dan maksimum, total hujan harian"
          />
          <div className="flex gap-2 overflow-x-auto px-5 pb-5">
            {cuaca.harian.slice(0, 7).map((h) => {
              const d = new Date(h.tanggal);
              return (
                <div
                  key={h.tanggal}
                  className="flex min-w-[104px] flex-1 flex-col items-center gap-2 rounded-tile border border-line bg-surface-2 p-3.5 text-center"
                >
                  <span className="text-[11.5px] font-bold text-ink-3">
                    {d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" })}
                  </span>
                  <IkonCuaca kategori={h.kategori} className="size-12" />
                  <span className="text-[10.5px] leading-tight text-ink-3">
                    {h.labelCuaca}
                  </span>
                  <span className="text-[13px] font-extrabold tabular-nums text-ink">
                    {Math.round(h.suhuMaks)}°
                    <span className="ml-1 font-semibold text-ink-3">
                      {Math.round(h.suhuMin)}°
                    </span>
                  </span>
                  <span className="rounded-pill bg-tint-sky px-2 py-0.5 text-[10.5px] font-bold text-tint-sky-ink">
                    {h.presipitasi.toFixed(1)} mm
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Rantai dampak */}
        <Card id="rantai" className="p-5">
          <h2 className="text-[17px] font-extrabold tracking-tight text-ink">
            Rantai dampak
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
            Dari kondisi cuaca di atas, ke sektor yang terdampak, sampai ke
            kegiatan warga. Klik tiap simpul untuk melihat dasar angkanya.
          </p>
          <RantaiDampak simpul={simpul} className="mt-5" />
        </Card>

        {/* Skor dampak per sektor */}
        <section id="dampak" className="scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1 pb-3 pt-2">
            <div>
              <h2 className="text-[20px] font-extrabold tracking-tight text-ink">
                Dampak per sektor
              </h2>
              <p className="mt-1 text-[13px] text-ink-2">
                Skor 0–100, makin tinggi makin besar dampaknya. Setiap kartu
                bisa dibuka sampai ke faktor penyusunnya.
              </p>
            </div>
            <span className="rounded-pill border border-line bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-ink-3 shadow-tile">
              Indikator analitis, bukan peringatan resmi
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {sektor.map((s) => (
              <KartuSektor key={s.id} sektor={s} />
            ))}
          </div>
        </section>

        {/* BMKG */}
        <PanelBMKG bmkg={bmkg} catatan={catatanBMKG} />

        {/* Penutup */}
        <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5 text-[12px] leading-relaxed text-ink-3 sm:flex-row sm:items-center">
          <ShieldAlert className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
          <p>
            Data cuaca {cuaca.sumber.nama}, model diperbarui{" "}
            {new Date(cuaca.diambilPada).toLocaleString("id-ID", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
            . Elevasi {cuaca.lokasi.elevasi?.toFixed(0)} mdpl dipakai sebagai
            pendekatan kasar topografi, bukan data kemiringan lereng. CuacaKita
            adalah platform analisis informasi — untuk peringatan resmi, rujuk
            BMKG dan BPBD.
          </p>
        </div>
      </main>
    </div>
  );
}

function HalamanGagal({ kota }: { kota: string }) {
  return (
    <div className="app-canvas flex min-h-screen flex-col">
      <Topbar kota={kota} />
      <main className="flex flex-1 items-center justify-center px-5 py-20">
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
            <ButtonLink href={`/dashboard?kota=${encodeURIComponent(LOKASI_BAWAAN)}`} variant="primary" size="md">
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
      </main>
    </div>
  );
}
