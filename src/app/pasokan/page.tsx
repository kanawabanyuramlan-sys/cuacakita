import Link from "next/link";
import { ArrowDown, CircleHelp, Info } from "lucide-react";
import { Kerangka } from "@/components/shell/kerangka";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { BilahSkor, LencanaTingkat } from "@/components/ui/tingkat";
import { cn } from "@/lib/cn";
import { muatHalaman } from "@/server/cuaca";
import { susunRantaiPasokan } from "@/lib/impact/pasokan";
import { penjelasanKeyakinan, type Keyakinan } from "@/lib/impact/rantai";
import { susunPeringatan } from "@/lib/impact/peringatan";
import { LOKASI_BAWAAN } from "@/lib/lokasi";

export const revalidate = 900;

export async function generateMetadata(props: PageProps<"/pasokan">) {
  const sp = await props.searchParams;
  const kota = typeof sp.kota === "string" ? sp.kota : LOKASI_BAWAAN;
  return { title: `Pasokan & Harga di ${kota}` };
}

const gayaKeyakinan: Record<Keyakinan, { label: string; kelas: string }> = {
  terukur: { label: "Terukur", kelas: "bg-tint-mint text-tint-mint-ink" },
  turunan: { label: "Turunan", kelas: "bg-tint-sky text-tint-sky-ink" },
  indikatif: { label: "Indikatif", kelas: "bg-tint-sun text-tint-sun-ink" },
};

export default async function PasokanPage(props: PageProps<"/pasokan">) {
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
              Seluruh rantai di halaman ini dihitung dari kondisi cuaca, jadi
              tanpa datanya tidak ada yang bisa ditampilkan.
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
  const { langkah, komoditasTeratas } = susunRantaiPasokan(
    kondisi,
    sektor,
    namaKota,
  );
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
            Dari cuaca ke harga
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
            Lima langkah dari hujan sampai ke harga di pasar. Perhatikan label
            keyakinan di tiap langkah — semakin ke bawah, semakin banyak hal di
            luar cuaca yang ikut menentukan.
          </p>
        </div>

        {/* Rantai berjenjang */}
        <ol className="space-y-0">
          {langkah.map((l, i) => (
            <li key={l.id}>
              <Card
                style={{ "--tunda": `${i * 90}ms` } as React.CSSProperties}
                className={cn(
                  "muncul p-5",
                  l.keyakinan === "indikatif" &&
                    "border-[color:var(--color-tingkat-sedang)]/40 bg-tint-sun/25",
                )}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-tile bg-surface-2 text-2xl"
                    aria-hidden
                  >
                    {l.ikon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
                        Langkah {i + 1}
                      </span>
                      <h2 className="text-[16px] font-extrabold tracking-tight text-ink">
                        {l.label}
                      </h2>
                      <LencanaTingkat tingkat={l.tingkat} />
                      <span
                        className={cn(
                          "rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          gayaKeyakinan[l.keyakinan].kelas,
                        )}
                      >
                        {gayaKeyakinan[l.keyakinan].label}
                      </span>
                    </div>

                    <p className="mt-2 text-[14px] font-semibold leading-snug text-ink">
                      {l.judul}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                      {l.penjelasan}
                    </p>

                    <dl className="mt-3.5 grid gap-2 sm:grid-cols-3">
                      {l.rincian.map((r) => (
                        <div key={r.label} className="rounded-tile bg-surface-2 p-2.5">
                          <dt className="text-[11px] font-semibold text-ink-3">
                            {r.label}
                          </dt>
                          <dd className="mt-0.5 text-[13px] font-bold text-ink">
                            {r.nilai}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <p className="mt-3 flex gap-2 text-[11.5px] leading-snug text-ink-3">
                      <CircleHelp className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {penjelasanKeyakinan[l.keyakinan]}
                    </p>
                  </div>

                  <div className="w-full shrink-0 sm:w-36">
                    <p className="text-right text-[30px] font-extrabold leading-none tabular-nums text-ink">
                      {l.nilai}
                      <span className="ml-1 text-[12px] font-semibold text-ink-3">
                        /100
                      </span>
                    </p>
                    <BilahSkor
                      skor={l.nilai}
                      tingkat={l.tingkat}
                      label={l.label}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Yang tidak diketahui CuacaKita — hanya pada langkah Harga */}
                {l.diluarJangkauan ? (
                  <div className="mt-4 rounded-tile border border-line bg-surface p-4">
                    <p className="text-[12.5px] font-extrabold text-ink">
                      Yang tidak diketahui CuacaKita
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
                      Hal-hal berikut sering lebih menentukan harga daripada
                      cuaca, dan tidak satu pun terhubung ke sistem ini:
                    </p>
                    <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                      {l.diluarJangkauan.map((x) => (
                        <li
                          key={x}
                          className="flex gap-2 text-[12px] leading-snug text-ink-2"
                        >
                          <span
                            className="mt-1.5 size-1 shrink-0 rounded-full bg-[color:var(--color-tingkat-sedang)]"
                            aria-hidden
                          />
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>

              {i < langkah.length - 1 ? (
                <div className="flex justify-center py-1.5" aria-hidden>
                  <ArrowDown className="size-4 text-line-strong" strokeWidth={2.5} />
                </div>
              ) : null}
            </li>
          ))}
        </ol>

        {/* Komoditas yang paling menentukan */}
        <Card className="p-5">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
            Komoditas yang paling menekan rantai ini
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
            Bila pasokan tertekan, inilah komoditas yang paling mungkin menjadi
            penyebabnya pada kondisi cuaca sekarang.
          </p>
          <ul className="mt-3.5 space-y-2.5">
            {komoditasTeratas.map((r) => (
              <li key={r.komoditas.id} className="flex items-center gap-3">
                <span className="text-lg leading-none" aria-hidden>
                  {r.komoditas.ikon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink">
                    {r.komoditas.nama}
                  </span>
                  <BilahSkor
                    skor={r.skor}
                    tingkat={r.tingkat}
                    label={r.komoditas.nama}
                    className="mt-1"
                  />
                </span>
                <span className="shrink-0 text-[13px] font-extrabold tabular-nums text-ink">
                  {r.skor}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href={`/komoditas?kota=${encodeURIComponent(namaKota)}`}
            className="mt-4 inline-block text-[12.5px] font-bold text-brand-700 hover:underline"
          >
            Lihat seluruh komoditas
          </Link>
        </Card>

        <Card className="flex gap-3 p-5">
          <Info className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={2.25} aria-hidden />
          <p className="text-[12px] leading-relaxed text-ink-2">
            <strong className="font-bold text-ink">Sekali lagi, tegas:</strong>{" "}
            CuacaKita tidak terhubung ke data harga pasar mana pun dan tidak
            memperkirakan harga. Angka pada langkah Harga hanya menunjukkan
            arah tekanan dari sisi cuaca, dan tidak boleh dipakai sebagai dasar
            keputusan jual-beli. Untuk harga pangan terkini, rujuk Badan Pangan
            Nasional atau dinas perdagangan setempat. Data cuaca{" "}
            {cuaca.sumber.nama}, diambil pukul {jam}.
          </p>
        </Card>
      </div>
    </Kerangka>
  );
}
