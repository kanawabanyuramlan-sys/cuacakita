import Link from "next/link";
import { BellOff, Phone, ShieldAlert, TriangleAlert, Users } from "lucide-react";
import { Kerangka } from "@/components/shell/kerangka";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { muatHalaman } from "@/server/cuaca";
import { muatPeta, type TitikPeta } from "@/server/peta";
import {
  PENAFIAN_PERINGATAN,
  susunPeringatan,
  type Peringatan,
} from "@/lib/impact/peringatan";
import { LOKASI_BAWAAN } from "@/lib/lokasi";

export const revalidate = 900;

export async function generateMetadata(props: PageProps<"/peringatan">) {
  const sp = await props.searchParams;
  const kota = typeof sp.kota === "string" ? sp.kota : LOKASI_BAWAAN;
  return { title: `Peringatan ${kota}` };
}

/** Kota lain yang indikatornya sedang tinggi, dari data peta nasional. */
function kotaBerindikasi(titik: TitikPeta[]) {
  return titik
    .map((t) => {
      const alasan: string[] = [];
      if (t.skor.banjir >= 50) alasan.push(`genangan ${t.skor.banjir}`);
      if (t.skor.longsor >= 50) alasan.push(`longsor ${t.skor.longsor}`);
      if (t.skor.transportasi >= 50) alasan.push(`perjalanan ${t.skor.transportasi}`);
      if (t.hujan24j >= 50) alasan.push(`hujan ${t.hujan24j.toFixed(0)} mm`);
      if (t.suhuMaks >= 35) alasan.push(`suhu ${Math.round(t.suhuMaks)} °C`);
      if (t.hembusanMaks >= 45) alasan.push(`angin ${t.hembusanMaks} km/j`);
      return { titik: t, alasan };
    })
    .filter((x) => x.alasan.length > 0)
    // Yang paling banyak alasannya lebih dulu, lalu yang indikator
    // bencananya paling tinggi.
    .sort(
      (a, b) =>
        b.alasan.length - a.alasan.length ||
        Math.max(b.titik.skor.banjir, b.titik.skor.longsor) -
          Math.max(a.titik.skor.banjir, a.titik.skor.longsor),
    )
    .slice(0, 8);
}

function KartuPeringatan({ p, tunda }: { p: Peringatan; tunda: number }) {
  const penting = p.tingkat === "Penting";
  return (
    <article
      style={{ "--tunda": `${tunda}ms` } as React.CSSProperties}
      className={cn(
        "muncul kartu-angkat rounded-card border p-5 shadow-tile",
        penting
          ? "border-[color:var(--color-tingkat-tinggi)]/40 bg-tint-rose/30"
          : "border-[color:var(--color-tingkat-sedang)]/40 bg-tint-sun/35",
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="text-2xl leading-none" aria-hidden>
          {p.ikon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15.5px] font-extrabold tracking-tight text-ink">
              {p.judul}
            </h2>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide text-white",
                penting
                  ? "bg-[color:var(--color-tingkat-tinggi)]"
                  : "bg-[color:var(--color-tingkat-sedang)]",
              )}
            >
              <TriangleAlert className="size-3" strokeWidth={3} aria-hidden />
              {p.tingkat}
            </span>
          </div>

          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{p.isi}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="rounded-pill bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-ink-2">
              {p.dasar}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-3">
              <Users className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              {p.untuk.join(" · ")}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function PeringatanPage(props: PageProps<"/peringatan">) {
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
              Peringatan tidak dapat dihitung
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Data cuaca untuk “{diminta}” tidak berhasil diambil. Halaman ini
              dikosongkan — menampilkan “tidak ada peringatan” padahal datanya
              tidak ada akan jauh lebih berbahaya daripada tidak menampilkan
              apa pun.
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
  const peringatan = susunPeringatan(cuaca, kondisi, sektor);

  let lain: ReturnType<typeof kotaBerindikasi> = [];
  try {
    lain = kotaBerindikasi((await muatPeta()).titik).filter(
      (x) => x.titik.nama !== namaKota,
    );
  } catch {
    lain = [];
  }

  const jumlahPeringatan = peringatan.length;
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
            Peringatan untuk {namaKota}
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
            {peringatan.length > 0
              ? `${peringatan.length} hal perlu diperhatikan dari kondisi cuaca saat ini.`
              : "Tidak ada kondisi cuaca yang melewati ambang perhatian saat ini."}
          </p>
        </div>

        {peringatan.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {peringatan.map((p, i) => (
              <KartuPeringatan key={p.id} p={p} tunda={i * 70} />
            ))}
          </div>
        ) : (
          <Card className="muncul flex flex-col items-center p-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-panel bg-tint-mint text-tint-mint-ink">
              <BellOff className="size-6" strokeWidth={2} aria-hidden />
            </span>
            <h2 className="mt-5 text-[18px] font-extrabold tracking-tight text-ink">
              Tidak ada peringatan di {namaKota}
            </h2>
            <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-2">
              Curah hujan, angin, suhu, dan jarak pandang semuanya berada dalam
              rentang biasa. Halaman ini akan terisi sendiri bila salah satunya
              melewati ambang perhatian.
            </p>
            <dl className="mt-6 grid w-full max-w-lg grid-cols-2 gap-2 text-left sm:grid-cols-4">
              {[
                { k: "Hujan 24 jam", v: `${kondisi.hujan24j.toFixed(1)} mm`, a: "ambang 50" },
                { k: "Hembusan angin", v: `${Math.round(kondisi.hembusanMaks)} km/j`, a: "ambang 45" },
                { k: "Suhu tertinggi", v: `${Math.round(kondisi.suhuMaks)} °C`, a: "ambang 35" },
                { k: "Jarak pandang", v: `${kondisi.visibilitasKm.toFixed(1)} km`, a: "ambang 2" },
              ].map((x) => (
                <div key={x.k} className="rounded-tile bg-surface-2 p-3">
                  <dt className="text-[11px] font-semibold text-ink-3">{x.k}</dt>
                  <dd className="mt-0.5 text-[14px] font-extrabold text-ink">{x.v}</dd>
                  <dd className="text-[10.5px] text-ink-3">{x.a}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}

        {/* Wilayah lain yang indikatornya sedang tinggi */}
        {lain.length > 0 ? (
          <Card className="p-5">
            <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
              Kota lain yang indikatornya sedang tinggi
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
              Dari {lain.length} kota lain yang dipantau. Berguna bila Anda punya
              keluarga, lahan, atau rencana perjalanan ke sana.
            </p>
            <ul className="mt-3.5 grid gap-2 sm:grid-cols-2">
              {lain.map((x, i) => (
                <li
                  key={x.titik.nama}
                  style={{ "--tunda": `${i * 50}ms` } as React.CSSProperties}
                  className="muncul"
                >
                  <Link
                    href={`/peringatan?kota=${encodeURIComponent(x.titik.nama)}`}
                    className="kartu-angkat flex items-center gap-3 rounded-tile border border-line bg-surface p-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-ink">
                        {x.titik.nama}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-3">
                        {x.titik.provinsi} · {x.alasan.join(" · ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11.5px] font-bold text-brand-700">
                      Lihat
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {/* Penafian — ditaruh menonjol, bukan disembunyikan di kaki halaman */}
        <Card className="flex gap-3 border-brand-200 bg-brand-50/50 p-5">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-brand-700" strokeWidth={2.25} aria-hidden />
          <div>
            <p className="text-[13px] leading-relaxed text-ink-2">
              {PENAFIAN_PERINGATAN}
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-bold text-ink">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5" strokeWidth={2.75} aria-hidden />
                Darurat 112
              </span>
              <a
                href="https://www.bmkg.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 hover:underline"
              >
                bmkg.go.id
              </a>
              <a
                href="https://bnpb.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 hover:underline"
              >
                bnpb.go.id
              </a>
            </p>
          </div>
        </Card>
      </div>
    </Kerangka>
  );
}
