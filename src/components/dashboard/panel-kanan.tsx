import Link from "next/link";
import { ArrowUpRight, Droplets, Gauge, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IkonCuaca } from "@/components/ui/ikon-cuaca";
import { BilahSkor, LencanaTingkat } from "@/components/ui/tingkat";
import type { PaketCuaca } from "@/lib/weather/types";
import type { Kondisi, SkorDampak } from "@/lib/impact/engine";

/* ── Ringkasan cuaca saat ini ──────────────────────────────────────── */

export function DetailCuaca({
  paket,
  kondisi,
}: {
  paket: PaketCuaca;
  kondisi: Kondisi;
}) {
  const s = paket.sekarang;

  const metrik = [
    { ikon: Droplets, label: "Kelembapan", nilai: `${s.kelembapan}%` },
    {
      ikon: Wind,
      label: "Angin",
      nilai: `${Math.round(s.anginKecepatan)} km/j`,
    },
    { ikon: Gauge, label: "Tekanan", nilai: `${Math.round(s.tekanan)} hPa` },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
          Cuaca sekarang
        </h2>
        <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[10.5px] font-bold text-ink-3">
          {new Date(s.waktu).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          waktu setempat
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <IkonCuaca
          kategori={s.kategori}
          siang={s.siang}
          className="size-16 shrink-0"
        />
        <div className="min-w-0">
          <p className="flex items-start text-[42px] font-extrabold leading-none tracking-tight text-ink">
            {Math.round(s.suhu)}
            <span className="mt-1 ml-0.5 text-[16px] font-bold text-ink-3">°C</span>
          </p>
          <p className="mt-1 truncate text-[14px] font-bold text-ink">
            {s.labelCuaca}
          </p>
          <p className="text-[12px] text-ink-3">
            Terasa seperti {Math.round(s.terasaSeperti)}°C
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {metrik.map((m) => {
          const Ikon = m.ikon;
          return (
            <div key={m.label} className="rounded-tile bg-surface-2 p-2.5">
              <dt className="flex items-center gap-1 text-[10.5px] font-semibold text-ink-3">
                <Ikon className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
                {m.label}
              </dt>
              <dd className="mt-1 text-[14px] font-extrabold leading-none text-ink">
                {m.nilai}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-3 text-[11.5px] leading-snug text-ink-3">
        Hujan sehari ke depan {kondisi.hujan24j.toFixed(1)} mm · jarak pandang{" "}
        {kondisi.visibilitasKm.toFixed(1)} km · elevasi{" "}
        {paket.lokasi.elevasi?.toFixed(0)} mdpl
      </p>
    </Card>
  );
}

/* ── Prakiraan tujuh hari, bentuk ringkas ──────────────────────────── */

export function PrakiraanRingkas({ paket }: { paket: PaketCuaca }) {
  const hariIni = new Date(paket.sekarang.waktu).toISOString().slice(0, 10);
  const hari = paket.harian
    .filter((h) => h.tanggal >= hariIni)
    .slice(0, 7);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
          Tujuh hari ke depan
        </h2>
        <Link
          href="/histori"
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-brand-700 hover:underline"
        >
          Riwayat
          <ArrowUpRight className="size-3" strokeWidth={2.75} aria-hidden />
        </Link>
      </div>

      <ul className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {hari.map((h, i) => {
          const d = new Date(h.tanggal);
          return (
            <li
              key={h.tanggal}
              className={
                i === 0
                  ? "flex min-w-[62px] flex-1 flex-col items-center gap-1 rounded-tile bg-brand-50 p-2 text-center"
                  : "flex min-w-[62px] flex-1 flex-col items-center gap-1 rounded-tile bg-surface-2 p-2 text-center"
              }
            >
              <span className="text-[10.5px] font-bold text-ink-3">
                {i === 0
                  ? "Hari ini"
                  : d.toLocaleDateString("id-ID", { weekday: "short" })}
              </span>
              <IkonCuaca kategori={h.kategori} className="size-8" />
              <span className="text-[12.5px] font-extrabold leading-none text-ink">
                {Math.round(h.suhuMaks)}°
              </span>
              <span className="text-[10px] font-semibold leading-none text-ink-3">
                {Math.round(h.suhuMin)}°
              </span>
              {h.presipitasi >= 0.5 ? (
                <span className="text-[9.5px] font-bold leading-none text-[color:var(--viz-hujan)]">
                  {h.presipitasi.toFixed(0)} mm
                </span>
              ) : (
                <span className="text-[9.5px] leading-none text-ink-3">—</span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ── Tiga dampak teratas, bentuk ringkas ───────────────────────────── */

export function DampakRingkas({ sektor }: { sektor: SkorDampak[] }) {
  const atas = [...sektor].sort((a, b) => b.skor - a.skor).slice(0, 4);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
            Yang paling terpengaruh
          </h2>
          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">
            Semakin tinggi angkanya, semakin besar pengaruh cuaca saat ini
          </p>
        </div>
        <Link
          href="#dampak"
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-brand-700 hover:underline"
        >
          Rincian
          <ArrowUpRight className="size-3" strokeWidth={2.75} aria-hidden />
        </Link>
      </div>

      <ul className="mt-3.5 space-y-3">
        {atas.map((s) => (
          <li key={s.id}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[13px] font-semibold text-ink">
                {s.nama}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[13px] font-extrabold tabular-nums text-ink">
                  {s.skor}
                </span>
                <LencanaTingkat tingkat={s.tingkat} />
              </span>
            </div>
            <BilahSkor
              skor={s.skor}
              tingkat={s.tingkat}
              label={s.nama}
              className="mt-1.5"
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}
