import { Anchor, Compass, Info, ShieldAlert, Waves } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import type { KondisiLaut } from "@/server/sources/laut";
import {
  KELAS_GELOMBANG,
  PENAFIAN_LAUT,
  type PenilaianLaut,
} from "@/lib/impact/nelayan";

const gayaNada = {
  aman: {
    kelas: "border-[color:var(--color-tingkat-rendah)]/30 bg-tint-mint/40",
    label: "Di bawah ambang peringatan",
  },
  waspada: {
    kelas: "border-[color:var(--color-tingkat-sedang)]/35 bg-tint-sun/40",
    label: "Perlu kehati-hatian",
  },
  bahaya: {
    kelas: "border-[color:var(--color-tingkat-tinggi)]/40 bg-tint-rose/35",
    label: "Melewati ambang perahu nelayan",
  },
} as const;

function arahMata(derajat: number) {
  const m = ["utara", "timur laut", "timur", "tenggara", "selatan", "barat daya", "barat", "barat laut"];
  return m[Math.round(derajat / 45) % 8];
}

export function PanelLaut({
  laut,
  nilai,
  kota,
}: {
  laut: KondisiLaut;
  nilai: PenilaianLaut;
  kota: string;
}) {
  const g = gayaNada[nilai.nada];

  return (
    <div className="space-y-3">
      {/* Ringkasan utama */}
      <section className={cn("muncul rounded-card border p-5 shadow-tile", g.kelas)}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-ink">
            <Waves className="size-3.5" strokeWidth={2.75} aria-hidden />
            {g.label}
          </span>
          <span className="text-[12px] font-semibold text-ink-2">
            Perairan {laut.jarakDariKota} km arah {laut.arah} dari {kota}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <p className="text-[12px] font-semibold text-ink-2">
              Tinggi gelombang
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-[40px] font-extrabold leading-none tracking-tight text-ink">
                {nilai.tinggi.toFixed(2)}
              </span>
              <span className="text-[15px] font-bold text-ink-3">m</span>
              <span className="rounded-pill bg-surface px-2.5 py-1 text-[12px] font-bold text-ink">
                {nilai.kelas}
              </span>
            </p>
          </div>

          <dl className="flex flex-wrap gap-x-5 gap-y-2">
            <div>
              <dt className="text-[11px] font-semibold text-ink-3">Angin</dt>
              <dd className="text-[15px] font-extrabold text-ink">
                {nilai.anginKnot.toFixed(0)}{" "}
                <span className="text-[11px] font-semibold text-ink-3">knot</span>
              </dd>
            </div>
            {nilai.tinggi > 0 ? (
              <div>
                <dt className="text-[11px] font-semibold text-ink-3">Arah gelombang</dt>
                <dd className="text-[15px] font-extrabold text-ink">
                  dari {arahMata(laut.arahGelombang)}
                </dd>
              </div>
            ) : null}
            {laut.periodeGelombang != null ? (
              <div>
                <dt className="text-[11px] font-semibold text-ink-3">Periode</dt>
                <dd className="text-[15px] font-extrabold text-ink">
                  {laut.periodeGelombang.toFixed(1)}{" "}
                  <span className="text-[11px] font-semibold text-ink-3">detik</span>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <p className="mt-4 text-[14px] leading-relaxed text-ink">
          {nilai.ringkas}
        </p>
      </section>

      {/* Ambang per jenis kapal */}
      <Card className="p-5">
        <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
          Ambang peringatan per jenis kapal
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
          Mengikuti tabel peringatan keselamatan pelayaran BMKG. Peringatan
          berlaku bila angin <strong className="font-bold text-ink">dan</strong>{" "}
          gelombang sama-sama melewati ambangnya.
        </p>

        <ul className="mt-3.5 space-y-2">
          {nilai.kapal.map((k) => (
            <li
              key={k.nama}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-tile border p-3.5",
                k.aman
                  ? "border-line bg-surface-2"
                  : "border-[color:var(--color-tingkat-tinggi)]/40 bg-tint-rose/30",
              )}
            >
              <span className="text-xl leading-none" aria-hidden>
                {k.ikon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-bold text-ink">
                    {k.nama}
                  </span>
                  <span
                    className={cn(
                      "rounded-pill px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide",
                      k.aman
                        ? "bg-tint-mint text-tint-mint-ink"
                        : "bg-[color:var(--color-tingkat-tinggi)] text-white",
                    )}
                  >
                    {k.aman ? "Di bawah ambang" : "Melewati ambang"}
                  </span>
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
                  {k.alasan}
                </p>
              </div>
              <span className="shrink-0 text-right text-[11px] font-semibold text-ink-3">
                {k.ambangAngin} knot
                <br />
                {k.ambangGelombang} m
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Tiga hari ke depan */}
      <Card className="p-5">
        <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
          Puncak gelombang tiga hari ke depan
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {nilai.puncakHarian.map((h, i) => {
            const d = new Date(h.tanggal);
            return (
              <li
                key={h.tanggal}
                style={{ "--tunda": `${i * 60}ms` } as React.CSSProperties}
                className="muncul rounded-tile bg-surface-2 p-3.5"
              >
                <p className="text-[11.5px] font-bold text-ink-3">
                  {i === 0
                    ? "Hari ini"
                    : d.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                      })}
                </p>
                <p className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[22px] font-extrabold leading-none tabular-nums text-ink">
                    {h.maksimum.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-semibold text-ink-3">m</span>
                </p>
                <p className="mt-1 text-[11.5px] font-semibold text-ink-2">
                  {h.kelas}
                </p>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Catatan tambahan */}
      {nilai.catatan.length > 0 ? (
        <Card className="p-5">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
            Yang perlu diperhatikan
          </h2>
          <ul className="mt-3 space-y-2">
            {nilai.catatan.map((c) => (
              <li key={c} className="flex gap-3 rounded-tile bg-surface-2 p-3.5">
                <Compass
                  className="mt-0.5 size-4 shrink-0 text-ink-3"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <span className="text-[12.5px] leading-relaxed text-ink-2">
                  {c}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* Skala BMKG, agar angka di atas punya konteks */}
      <Card className="p-5">
        <h2 className="text-[14px] font-extrabold tracking-tight text-ink">
          Skala tinggi gelombang BMKG
        </h2>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {KELAS_GELOMBANG.map((k, i) => {
            const bawah = i === 0 ? 0 : KELAS_GELOMBANG[i - 1].batas;
            const aktif = k.nama === nilai.kelas;
            return (
              <li
                key={k.nama}
                className={cn(
                  "rounded-tile px-3 py-2 text-center",
                  aktif
                    ? "bg-brand-600 text-white"
                    : "bg-surface-2 text-ink-2",
                )}
              >
                <span className="block text-[11.5px] font-bold">{k.nama}</span>
                <span className="block text-[10.5px] opacity-80">
                  {bawah}
                  {k.batas === Infinity ? "+ m" : `–${k.batas} m`}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Penafian */}
      <Card className="flex gap-3 border-brand-200 bg-brand-50/50 p-5">
        <ShieldAlert
          className="mt-0.5 size-5 shrink-0 text-brand-700"
          strokeWidth={2.25}
          aria-hidden
        />
        <div>
          <p className="text-[12.5px] leading-relaxed text-ink-2">
            {PENAFIAN_LAUT}
          </p>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-bold">
            <span className="inline-flex items-center gap-1.5 text-ink">
              <Anchor className="size-3.5" strokeWidth={2.75} aria-hidden />
              Darurat laut 115
            </span>
            <a
              href="https://maritim.bmkg.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 hover:underline"
            >
              maritim.bmkg.go.id
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}

/** Ditampilkan untuk kota yang bukan kota pesisir. */
export function BukanPesisir({ kota }: { kota: string }) {
  return (
    <Card className="flex flex-col items-center p-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-panel bg-surface-2 text-ink-3">
        <Info className="size-6" strokeWidth={2} aria-hidden />
      </span>
      <h2 className="mt-5 text-[18px] font-extrabold tracking-tight text-ink">
        {kota} bukan kota pesisir
      </h2>
      <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-2">
        Tidak ditemukan titik perairan dalam jangkauan sekitar 45 km dari {kota}, sehingga
        tidak ada data gelombang yang bisa ditampilkan. Pilih kota pesisir di
        kotak pencarian untuk melihat kondisi melaut di sana.
      </p>
    </Card>
  );
}
