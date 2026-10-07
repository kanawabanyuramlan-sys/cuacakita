import { Clock, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { IkonCuaca } from "@/components/ui/ikon-cuaca";
import { LencanaTingkat } from "@/components/ui/tingkat";
import type { JamBerangkat, Persiapan, Singgahan } from "@/lib/impact/perjalanan";

/* ── Rangkaian kota sepanjang jalur ───────────────────────────────── */

export function DaftarSinggahan({
  singgahan,
  jarakTotal,
}: {
  singgahan: Singgahan[];
  jarakTotal: number;
}) {
  const tengah = singgahan.filter((s) => s.peran === "tengah").length;

  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
        Kondisi di sepanjang jalur
      </h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
        {tengah > 0
          ? `${tengah} kota yang dipantau berada dekat dengan garis antara kedua titik, dalam rentang ${jarakTotal} km.`
          : `Tidak ada kota pantauan lain yang dekat dengan garis sepanjang ${jarakTotal} km ini. Hanya kondisi di kedua ujung yang dapat ditampilkan.`}
      </p>

      <ol className="mt-4">
        {singgahan.map((s, i) => {
          const t = s.titik;
          const terakhir = i === singgahan.length - 1;
          return (
            <li key={t.nama} className="relative flex gap-3.5">
              {/* Garis penghubung antar-singgahan */}
              <div className="flex shrink-0 flex-col items-center">
                <span
                  className={cn(
                    "mt-1 size-3 rounded-full ring-4",
                    s.peran === "asal"
                      ? "bg-brand-600 ring-brand-100"
                      : s.peran === "tujuan"
                        ? "bg-[color:var(--color-tingkat-tinggi)] ring-tint-rose"
                        : "bg-ink-3 ring-surface-2",
                  )}
                  aria-hidden
                />
                {!terakhir ? (
                  <span className="w-0.5 flex-1 bg-line" aria-hidden />
                ) : null}
              </div>

              <div className={cn("min-w-0 flex-1", terakhir ? "pb-0" : "pb-5")}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[14px] font-extrabold text-ink">
                    {t.nama}
                  </span>
                  <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[10.5px] font-bold text-ink-3">
                    {s.peran === "asal"
                      ? "Titik awal"
                      : s.peran === "tujuan"
                        ? "Tujuan"
                        : `± ${s.dariAsal} km`}
                  </span>
                  <LencanaTingkat tingkat={s.tingkat} />
                  {s.peran === "tengah" && s.kedekatan === "dekat-jalur" ? (
                    <span className="rounded-pill bg-tint-sun px-2 py-0.5 text-[10px] font-bold text-tint-sun-ink">
                      Agak jauh dari garis
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5 flex items-center gap-2.5">
                  <IkonCuaca
                    kategori={t.kategori}
                    className="size-9 shrink-0"
                    diam
                  />
                  <p className="text-[12.5px] leading-snug text-ink-2">
                    {t.labelCuaca}, {t.suhu} °C · hujan {t.hujan24j} mm · angin{" "}
                    {t.hembusanMaks} km/jam
                    {s.peran === "tengah" ? (
                      <span className="text-ink-3">
                        {" "}
                        · {s.simpangan} km dari garis lurus
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 flex gap-2 rounded-tile bg-surface-2 p-3.5 text-[11.5px] leading-relaxed text-ink-2">
        <Info className="mt-0.5 size-3.5 shrink-0 text-ink-3" aria-hidden />
        <span>
          Kota di atas dipilih karena letaknya dekat dengan{" "}
          <strong className="font-bold text-ink">garis lurus</strong> antara
          asal dan tujuan — bukan karena CuacaKita tahu rute jalan yang Anda
          ambil. Yang ditandai{" "}
          <em className="not-italic font-bold text-ink">agak jauh dari garis</em>{" "}
          berada lebih dari 30 km dari garis itu, jadi belum tentu benar-benar
          Anda lewati; tetap ditampilkan karena sering menjadi jalur alternatif.
          Kondisi jalan dan kepadatan lalu lintas tidak dipantau sama sekali.
        </span>
      </p>
    </Card>
  );
}

/* ── Jendela waktu berangkat ──────────────────────────────────────── */

const gayaJam = {
  baik: "bg-tint-mint text-tint-mint-ink",
  sedang: "bg-tint-sun text-tint-sun-ink",
  buruk: "bg-tint-rose text-tint-rose-ink",
} as const;

export function WaktuBerangkat({
  jam,
  terbaik,
  kota,
}: {
  jam: JamBerangkat[];
  terbaik: { mulai: JamBerangkat; selesai: JamBerangkat; rata: number } | null;
  kota: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-tile bg-tint-sky text-tint-sky-ink">
          <Clock className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
            Waktu berangkat dari {kota}
          </h2>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-3">
            Dua puluh empat jam ke depan, dinilai dari cuaca di titik
            keberangkatan
          </p>
        </div>
      </div>

      {terbaik ? (
        <p className="mt-4 rounded-tile border border-[color:var(--color-tingkat-rendah)]/30 bg-tint-mint/40 p-3.5 text-[13px] leading-relaxed text-ink">
          <strong className="font-bold">
            Paling baik berangkat {terbaik.mulai.jam}–{terbaik.selesai.jam}.
          </strong>{" "}
          {terbaik.mulai.alasan}
        </p>
      ) : null}

      <ul className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {jam.map((j) => (
          <li
            key={j.waktu}
            title={`${j.jam} — ${j.alasan}`}
            className={cn(
              "min-w-[46px] flex-1 rounded-tile p-1.5 text-center",
              gayaJam[j.nilai],
            )}
          >
            <span className="block text-[9.5px] font-bold tabular-nums opacity-80">
              {j.jam.slice(0, 2)}
            </span>
            <span className="mt-0.5 block text-[12px] font-extrabold leading-none tabular-nums">
              {j.skor}
            </span>
            {j.malam ? (
              <span className="mt-0.5 block text-[8px] opacity-70" aria-hidden>
                ●
              </span>
            ) : (
              <span className="mt-0.5 block text-[8px] opacity-0" aria-hidden>
                ●
              </span>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[11px] leading-snug text-ink-3">
        Angka 0–100, makin tinggi makin mendukung. Titik kecil menandai jam
        gelap. Penilaian memakai cuaca di kota asal saja — perjalanan jauh
        melewati cuaca yang berganti, dan itu ditampilkan terpisah pada daftar
        jalur.
      </p>
    </Card>
  );
}

/* ── Daftar persiapan ─────────────────────────────────────────────── */

export function DaftarPersiapan({ persiapan }: { persiapan: Persiapan[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
        Yang perlu disiapkan
      </h2>
      <ul className="mt-3 space-y-2">
        {persiapan.map((p, i) => (
          <li
            key={p.teks}
            style={{ "--tunda": `${i * 50}ms` } as React.CSSProperties}
            className="muncul flex gap-3 rounded-tile bg-surface-2 p-3.5"
          >
            <span className="text-lg leading-none" aria-hidden>
              {p.ikon}
            </span>
            <span className="text-[12.5px] leading-relaxed text-ink-2">
              {p.teks}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
