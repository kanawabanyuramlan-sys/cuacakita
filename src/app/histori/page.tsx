import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Kerangka } from "@/components/shell/kerangka";
import { GrafikHistori } from "@/components/histori/grafik-histori";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { muatHistori, RENTANG, type Rentang } from "@/server/histori";
import { LOKASI_BAWAAN } from "@/lib/lokasi";

export const revalidate = 3600;

export const metadata = { title: "Histori Cuaca" };

function bacaRentang(v: unknown): Rentang {
  const n = Number(v);
  return (RENTANG as readonly number[]).includes(n) ? (n as Rentang) : 30;
}

function Banding({
  label,
  kini,
  lalu,
  satuan,
  naikItuBaik,
}: {
  label: string;
  kini: number;
  lalu: number;
  satuan: string;
  naikItuBaik?: boolean;
}) {
  const selisih = Math.round((kini - lalu) * 10) / 10;
  const persen = lalu !== 0 ? Math.round((selisih / lalu) * 100) : null;
  const netral = Math.abs(selisih) < 0.05;
  const Ikon = netral ? Minus : selisih > 0 ? ArrowUpRight : ArrowDownRight;
  const baik = naikItuBaik === undefined ? null : selisih > 0 === naikItuBaik;

  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-tile">
      <p className="text-[12.5px] font-semibold text-ink-2">{label}</p>
      <p className="mt-2 text-[26px] font-extrabold leading-none tracking-tight text-ink">
        {kini}
        <span className="ml-1 text-[12.5px] font-semibold text-ink-3">{satuan}</span>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-1 text-[12px] font-semibold">
        <span
          className={cn(
            "inline-flex items-center gap-0.5",
            netral
              ? "text-ink-3"
              : baik === null
                ? "text-ink-2"
                : baik
                  ? "text-[color:var(--color-tingkat-rendah)]"
                  : "text-[color:var(--color-tingkat-tinggi)]",
          )}
        >
          <Ikon className="size-3.5" strokeWidth={2.75} aria-hidden />
          {selisih > 0 ? "+" : ""}
          {selisih} {satuan}
          {persen !== null && !netral ? ` (${persen > 0 ? "+" : ""}${persen}%)` : ""}
        </span>
        <span className="font-medium text-ink-3">vs periode sebelumnya</span>
      </p>
      <p className="mt-1 text-[11px] text-ink-3">
        Periode sebelumnya: {lalu} {satuan}
      </p>
    </div>
  );
}

export default async function HistoriPage(props: PageProps<"/histori">) {
  const sp = await props.searchParams;
  const kota = typeof sp.kota === "string" ? sp.kota : LOKASI_BAWAAN;
  const rentang = bacaRentang(sp.rentang);

  let data;
  try {
    data = await muatHistori(kota, rentang);
  } catch {
    return (
      <Kerangka kota={kota}>
        <div className="flex min-h-[60vh] items-center justify-center px-5 py-16">
          <Card className="max-w-md p-8 text-center">
            <h1 className="text-[20px] font-extrabold tracking-tight text-ink">
              Histori tidak dapat dimuat
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Data historis untuk “{kota}” tidak berhasil diambil dari layanan
              cuaca.
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
    <Kerangka kota={data.kota}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4 px-1 pt-2">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
              Histori Cuaca
            </h1>
            <p className="mt-1 text-[13.5px] text-ink-2">
              {data.kota}, {data.provinsi} · {data.rentangHari} hari terakhir,
              dibandingkan dengan {data.rentangHari} hari sebelumnya
            </p>
          </div>

          <nav
            aria-label="Rentang waktu"
            className="flex gap-1 rounded-pill border border-line bg-surface p-1 shadow-tile"
          >
            {RENTANG.map((r) => (
              <Link
                key={r}
                href={`/histori?kota=${encodeURIComponent(data.kota)}&rentang=${r}`}
                aria-current={r === rentang ? "page" : undefined}
                className={cn(
                  "rounded-pill px-4 py-1.5 text-[13px] font-semibold transition-colors",
                  r === rentang
                    ? "bg-brand-600 text-white"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                {r} hari
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Banding
            label="Total curah hujan"
            kini={data.sekarang.hujan}
            lalu={data.sebelumnya.hujan}
            satuan="mm"
          />
          <Banding
            label="Rata-rata suhu"
            kini={data.sekarang.suhuRata}
            lalu={data.sebelumnya.suhuRata}
            satuan="°C"
          />
          <Banding
            label="Rata-rata kelembapan"
            kini={data.sekarang.kelembapanRata}
            lalu={data.sebelumnya.kelembapanRata}
            satuan="%"
          />
        </div>

        <GrafikHistori hari={data.hari} />

        <p className="px-1 pb-4 text-[11.5px] leading-relaxed text-ink-3">
          Sumber data Open-Meteo. Hari berjalan tidak ikut dihitung karena
          datanya belum lengkap dan akan terbaca seolah-olah curah hujannya
          anjlok. Periode pembanding memakai rentang yang sama panjang tepat
          sebelum periode berjalan.
        </p>
      </div>
    </Kerangka>
  );
}
