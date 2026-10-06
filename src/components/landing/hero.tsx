import { ArrowUpRight, Droplets, MapPin, Wind } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { IkonCuaca } from "@/components/ui/ikon-cuaca";
import { LencanaTingkat } from "@/components/ui/tingkat";
import type { DataHalaman } from "@/server/cuaca";

/**
 * Hero menampilkan cuaca yang BENAR-BENAR sedang berlangsung, bukan angka
 * hiasan. Kalau pengambilan data gagal, kartunya diganti pesan jujur —
 * tidak pernah diisi angka karangan supaya halaman tetap terlihat penuh.
 */
export function Hero({ data }: { data: DataHalaman | null }) {
  return (
    <section className="night-sky relative overflow-hidden bg-night pb-20 pt-32 sm:pt-36">
      {/* Awan yang melintas perlahan di latar */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="animate-awan absolute left-0 top-[18%] h-20 w-48 rounded-full bg-white/[0.04] blur-2xl" />
        <div
          className="animate-awan absolute left-0 top-[52%] h-16 w-64 rounded-full bg-white/[0.03] blur-2xl"
          style={{ animationDelay: "-18s", animationDuration: "56s" }}
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
        {/* Kolom teks */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold text-white/75 backdrop-blur-sm">
            <span className="size-1.5 animate-pulse rounded-full bg-zest" aria-hidden />
            Data cuaca langsung · Open-Meteo &amp; BMKG
          </span>

          <h1 className="mt-6 text-[clamp(2.4rem,6vw,4.1rem)] font-extrabold leading-[1.03] tracking-[-0.035em] text-white">
            Tahu Cuacanya,
            <br />
            <span className="font-display font-normal italic text-white/85">
              Paham
            </span>{" "}
            Dampaknya.
          </h1>

          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/55 text-balance-pretty sm:text-base">
            Hujan bukan hanya angka milimeter. CuacaKita menelusuri ke mana
            hujan itu bermuara — ke sawah, ke pasokan, ke jalan, ke lereng, dan
            akhirnya ke kegiatan warga sehari-hari.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/dashboard" variant="zest" size="lg">
              Cek Cuaca
              <ArrowUpRight className="size-4" strokeWidth={2.75} aria-hidden />
            </ButtonLink>
            <ButtonLink href="/dashboard#dampak" variant="night" size="lg">
              Lihat Dampak
            </ButtonLink>
            <ButtonLink href="/peta" variant="night" size="lg">
              Buka Peta
            </ButtonLink>
          </div>
        </div>

        {/* Kartu kaca berisi kondisi nyata */}
        <div className="relative">
          {data ? <KartuLangsung data={data} /> : <KartuGagal />}
        </div>
      </div>
    </section>
  );
}

function KartuLangsung({ data }: { data: DataHalaman }) {
  const { cuaca, sektor } = data;
  const s = cuaca.sekarang;
  const teratas = [...sektor].sort((a, b) => b.skor - a.skor).slice(0, 3);

  return (
    <div className="kaca-gelap rounded-panel p-6 shadow-float sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/70">
          <MapPin className="size-3.5" strokeWidth={2.5} aria-hidden />
          {cuaca.lokasi.nama}
          {cuaca.lokasi.provinsi ? (
            <span className="text-white/35">· {cuaca.lokasi.provinsi}</span>
          ) : null}
        </span>
        <span className="rounded-pill bg-white/10 px-2 py-0.5 text-[10.5px] font-bold text-white/60">
          {cuaca.lokasi.elevasi?.toFixed(0)} mdpl
        </span>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <IkonCuaca kategori={s.kategori} siang={s.siang} className="size-20 shrink-0" />
        <div className="min-w-0">
          <p className="text-[clamp(2.6rem,7vw,3.6rem)] font-extrabold leading-none tracking-tight text-white">
            {Math.round(s.suhu)}
            <span className="align-top text-[0.45em]">°C</span>
          </p>
          <p className="mt-1 truncate text-[14px] font-semibold text-white/75">
            {s.labelCuaca}
          </p>
          <p className="text-[12.5px] text-white/45">
            Terasa seperti {Math.round(s.terasaSeperti)}°C
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-tile bg-white/5 px-3.5 py-2.5">
          <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-white/45">
            <Droplets className="size-3" strokeWidth={2.5} aria-hidden />
            Kelembapan
          </dt>
          <dd className="mt-0.5 text-[16px] font-extrabold text-white">
            {s.kelembapan}%
          </dd>
        </div>
        <div className="rounded-tile bg-white/5 px-3.5 py-2.5">
          <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-white/45">
            <Wind className="size-3" strokeWidth={2.5} aria-hidden />
            Angin
          </dt>
          <dd className="mt-0.5 text-[16px] font-extrabold text-white">
            {Math.round(s.anginKecepatan)}{" "}
            <span className="text-[11px] font-semibold text-white/50">km/j</span>
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">
          Dampak paling perlu diperhatikan
        </p>
        <ul className="mt-2.5 space-y-2">
          {teratas.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-3">
              <span className="truncate text-[13px] font-semibold text-white/80">
                {x.nama}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[13px] font-extrabold tabular-nums text-white">
                  {x.skor}
                </span>
                <LencanaTingkat tingkat={x.tingkat} gelap />
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-[11px] leading-snug text-white/35">
        Diperbarui {new Date(data.cuaca.diambilPada).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        WIB · skor adalah indikator analitis, bukan peringatan resmi.
      </p>
    </div>
  );
}

function KartuGagal() {
  return (
    <div className="kaca-gelap rounded-panel p-7 shadow-float">
      <p className="text-[15px] font-bold text-white">
        Data cuaca sedang tidak dapat diambil
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-white/55">
        Layanan cuaca tidak menjawab saat halaman ini dimuat. Tidak ada angka
        yang ditampilkan di sini karena CuacaKita tidak mengisi kekosongan data
        dengan perkiraan sendiri.
      </p>
      <ButtonLink href="/dashboard" variant="night" size="md" className="mt-5">
        Coba buka dashboard
      </ButtonLink>
    </div>
  );
}
