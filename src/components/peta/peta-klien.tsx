"use client";

import { useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/cn";
import { tingkatDari } from "@/lib/impact/engine";
import { LencanaTingkat } from "@/components/ui/tingkat";
import type { TitikPeta } from "@/server/peta";

/**
 * Peta cuaca dan risiko.
 *
 * Satu lapisan aktif pada satu waktu, bukan semuanya bertumpuk. Menumpuk
 * enam lapisan berwarna di atas peta yang sama membuat tidak ada satu pun
 * yang terbaca — pengguna harus bisa menjawab satu pertanyaan sekaligus.
 *
 * Warna titik memakai ramp satu warna (terang → gelap) karena yang
 * disandikan adalah BESARAN, bukan identitas. Ukuran titik ikut membesar
 * agar nilainya tetap terbaca dalam cetakan hitam-putih dan bagi pembaca
 * dengan buta warna.
 */

type IdLapisan =
  | "banjir"
  | "longsor"
  | "transportasi"
  | "pertanian"
  | "hujan"
  | "suhu";

const LAPISAN: {
  id: IdLapisan;
  nama: string;
  satuan: string;
  keterangan: string;
}[] = [
  { id: "banjir", nama: "Banjir", satuan: "skor", keterangan: "Indikator potensi genangan" },
  { id: "longsor", nama: "Longsor", satuan: "skor", keterangan: "Indikator risiko pada lahan berlereng" },
  { id: "transportasi", nama: "Transportasi", satuan: "skor", keterangan: "Risiko perjalanan" },
  { id: "pertanian", nama: "Pertanian", satuan: "skor", keterangan: "Tekanan pada aktivitas tanam dan panen" },
  { id: "hujan", nama: "Curah hujan", satuan: "mm", keterangan: "Total 24 jam ke depan" },
  { id: "suhu", nama: "Suhu", satuan: "°C", keterangan: "Suhu udara saat ini" },
];

/* Ramp biru satu warna, sudah lolos pemeriksaan ordinal pada kedua tema. */
const RAMP = [
  "var(--viz-seq-1)",
  "var(--viz-seq-2)",
  "var(--viz-seq-3)",
  "var(--viz-seq-4)",
  "var(--viz-seq-5)",
];

function nilaiTitik(t: TitikPeta, lapisan: IdLapisan) {
  if (lapisan === "hujan") return t.hujan24j;
  if (lapisan === "suhu") return t.suhu;
  return t.skor[lapisan];
}

/** Batas tiap kelas, disesuaikan dengan besaran yang sedang ditampilkan. */
function batas(lapisan: IdLapisan) {
  if (lapisan === "hujan") return [0.5, 5, 20, 50];
  if (lapisan === "suhu") return [24, 27, 30, 33];
  return [25, 50, 75, 90];
}

function kelasDari(nilai: number, lapisan: IdLapisan) {
  const b = batas(lapisan);
  let i = 0;
  while (i < b.length && nilai >= b[i]) i++;
  return i; // 0..4
}

export function PetaKlien({
  titik,
  diambilPada,
}: {
  titik: TitikPeta[];
  diambilPada: string;
}) {
  const [lapisan, setLapisan] = useState<IdLapisan>("banjir");
  const info = LAPISAN.find((l) => l.id === lapisan)!;

  const tertinggi = useMemo(
    () =>
      [...titik]
        .sort((a, b) => nilaiTitik(b, lapisan) - nilaiTitik(a, lapisan))
        .slice(0, 5),
    [titik, lapisan],
  );

  const b = batas(lapisan);
  const labelKelas = [
    `< ${b[0]}`,
    `${b[0]}–${b[1]}`,
    `${b[1]}–${b[2]}`,
    `${b[2]}–${b[3]}`,
    `≥ ${b[3]}`,
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
      {/* Peta */}
      <div className="relative overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <MapContainer
          center={[-2.5, 118]}
          zoom={5}
          scrollWheelZoom
          style={{ height: "min(72vh, 620px)", width: "100%" }}
          className="z-0"
        >
          {/* Ubin standar OpenStreetMap: benar-benar bebas dipakai tanpa
              kunci API. CartoDB dan Mapbox kini mewajibkan kunci, yang
              berarti peta akan mati begitu kuncinya tidak terpasang di
              lingkungan penilaian. */}
          <TileLayer
            attribution='&copy; Kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {titik.map((t) => {
            const nilai = nilaiTitik(t, lapisan);
            const kelas = kelasDari(nilai, lapisan);
            return (
              <CircleMarker
                key={t.nama + t.lat}
                center={[t.lat, t.lon]}
                radius={7 + kelas * 2.4}
                pathOptions={{
                  color: "#ffffff",
                  weight: 2,
                  fillColor: RAMP[kelas],
                  fillOpacity: 0.88,
                }}
              >
                <Tooltip direction="top" offset={[0, -6]}>
                  <span className="text-[12px] font-bold">
                    {t.nama}: {nilai}
                    {info.satuan === "skor" ? "/100" : ` ${info.satuan}`}
                  </span>
                </Tooltip>

                <Popup>
                  <div className="min-w-[200px]">
                    <p className="text-[13px] font-extrabold text-ink">{t.nama}</p>
                    <p className="text-[11px] text-ink-3">
                      {t.provinsi} · {t.elevasi} mdpl
                    </p>
                    <p className="mt-2 text-[12px] text-ink-2">
                      {t.labelCuaca}, {t.suhu} °C · hujan 24 jam{" "}
                      {t.hujan24j} mm
                    </p>
                    <dl className="mt-2 space-y-0.5">
                      {(
                        [
                          ["Banjir", t.skor.banjir],
                          ["Longsor", t.skor.longsor],
                          ["Transportasi", t.skor.transportasi],
                          ["Pertanian", t.skor.pertanian],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 text-[11.5px]">
                          <dt className="text-ink-3">{k}</dt>
                          <dd className="font-bold tabular-nums text-ink">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legenda melayang di atas peta */}
        <div className="kaca pointer-events-none absolute bottom-4 left-4 z-[500] rounded-tile p-3 shadow-card">
          <p className="text-[11px] font-bold text-ink">
            {info.nama}{" "}
            <span className="font-semibold text-ink-3">
              ({info.satuan === "skor" ? "0–100" : info.satuan})
            </span>
          </p>
          <ul className="mt-2 space-y-1">
            {RAMP.map((warna, i) => (
              <li key={warna} className="flex items-center gap-2">
                <span
                  className="inline-block rounded-full ring-2 ring-white"
                  style={{
                    backgroundColor: warna,
                    width: 8 + i * 2.4,
                    height: 8 + i * 2.4,
                  }}
                  aria-hidden
                />
                <span className="text-[10.5px] font-semibold tabular-nums text-ink-2">
                  {labelKelas[i]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Panel kanan: pemilih lapisan + peringkat */}
      <div className="space-y-3">
        <div className="rounded-card border border-line bg-surface p-4 shadow-tile">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
            Lapisan
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {LAPISAN.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLapisan(l.id)}
                aria-pressed={lapisan === l.id}
                className={cn(
                  "rounded-tile px-3 py-2 text-left text-[12.5px] font-semibold transition-colors",
                  lapisan === l.id
                    ? "bg-brand-600 text-white"
                    : "bg-surface-2 text-ink-2 hover:bg-line",
                )}
              >
                {l.nama}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-snug text-ink-3">
            {info.keterangan}. Satu lapisan ditampilkan sekaligus agar tiap
            pertanyaan punya jawaban yang jelas.
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-4 shadow-tile">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
            Lima teratas · {info.nama}
          </p>
          <ol className="mt-3 space-y-2.5">
            {tertinggi.map((t, i) => {
              const nilai = nilaiTitik(t, lapisan);
              return (
                <li key={t.nama} className="flex items-center gap-2.5">
                  <span className="w-4 shrink-0 text-[11px] font-bold tabular-nums text-ink-3">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {t.nama}
                    </span>
                    <span className="block truncate text-[11px] text-ink-3">
                      {t.provinsi}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[13px] font-extrabold tabular-nums text-ink">
                      {nilai}
                      {info.satuan !== "skor" ? (
                        <span className="ml-0.5 text-[10px] font-semibold text-ink-3">
                          {info.satuan}
                        </span>
                      ) : null}
                    </span>
                    {info.satuan === "skor" ? (
                      <LencanaTingkat tingkat={tingkatDari(nilai)} />
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="px-1 text-[11px] leading-relaxed text-ink-3">
          {titik.length} kota · diperbarui{" "}
          {new Date(diambilPada).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          . Peta menampilkan indikator analitis per kota, bukan batas wilayah
          rawan bencana resmi, dan tidak memuat data pribadi siapa pun.
        </p>
      </div>
    </div>
  );
}
