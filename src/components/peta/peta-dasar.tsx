"use client";

import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { TitikPeta } from "@/server/peta";

/**
 * Peta dasar yang dipakai bersama halaman Peta Risiko dan dashboard.
 *
 * Warna titik memakai ramp satu warna (terang → gelap) karena yang
 * disandikan adalah BESARAN, bukan identitas. Ukuran titik ikut membesar
 * supaya nilainya tetap terbaca pada cetakan hitam-putih dan bagi pembaca
 * dengan buta warna — warna tidak pernah menjadi satu-satunya pembawa makna.
 */

export type IdLapisan =
  | "banjir"
  | "longsor"
  | "transportasi"
  | "pertanian"
  | "hujan"
  | "suhu";

export const LAPISAN: {
  id: IdLapisan;
  nama: string;
  satuan: string;
  keterangan: string;
  /** Penjelasan untuk pengunjung yang belum akrab dengan istilahnya. */
  awam: string;
}[] = [
  {
    id: "banjir",
    nama: "Banjir",
    satuan: "skor",
    keterangan: "Indikator potensi genangan",
    awam: "Seberapa besar kemungkinan air menggenang di jalan dan permukiman.",
  },
  {
    id: "longsor",
    nama: "Longsor",
    satuan: "skor",
    keterangan: "Indikator risiko pada lahan berlereng",
    awam: "Seberapa rawan tanah di daerah berbukit bergerak setelah hujan.",
  },
  {
    id: "transportasi",
    nama: "Perjalanan",
    satuan: "skor",
    keterangan: "Risiko perjalanan",
    awam: "Seberapa berisiko berkendara karena jalan licin atau pandangan terbatas.",
  },
  {
    id: "pertanian",
    nama: "Pertanian",
    satuan: "skor",
    keterangan: "Tekanan pada aktivitas tanam dan panen",
    awam: "Seberapa terganggu kegiatan bertani oleh cuaca saat ini.",
  },
  {
    id: "hujan",
    nama: "Curah hujan",
    satuan: "mm",
    keterangan: "Total 24 jam ke depan",
    awam: "Berapa banyak hujan yang diperkirakan turun sehari ke depan.",
  },
  {
    id: "suhu",
    nama: "Suhu",
    satuan: "°C",
    keterangan: "Suhu udara saat ini",
    awam: "Panas atau sejuknya udara saat ini.",
  },
];

const RAMP = [
  "var(--viz-seq-1)",
  "var(--viz-seq-2)",
  "var(--viz-seq-3)",
  "var(--viz-seq-4)",
  "var(--viz-seq-5)",
];

export function nilaiTitik(t: TitikPeta, lapisan: IdLapisan) {
  if (lapisan === "hujan") return t.hujan24j;
  if (lapisan === "suhu") return t.suhu;
  return t.skor[lapisan];
}

export function batasLapisan(lapisan: IdLapisan) {
  if (lapisan === "hujan") return [0.5, 5, 20, 50];
  if (lapisan === "suhu") return [24, 27, 30, 33];
  return [25, 50, 75, 90];
}

function kelasDari(nilai: number, lapisan: IdLapisan) {
  const b = batasLapisan(lapisan);
  let i = 0;
  while (i < b.length && nilai >= b[i]) i++;
  return i;
}

export function Legenda({ lapisan }: { lapisan: IdLapisan }) {
  const info = LAPISAN.find((l) => l.id === lapisan)!;
  const b = batasLapisan(lapisan);
  const label = [
    `< ${b[0]}`,
    `${b[0]}–${b[1]}`,
    `${b[1]}–${b[2]}`,
    `${b[2]}–${b[3]}`,
    `≥ ${b[3]}`,
  ];

  return (
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
              {label[i]}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-[150px] text-[10px] leading-snug text-ink-3">
        Titik makin besar dan gelap berarti nilainya makin tinggi.
      </p>
    </div>
  );
}

export function PetaDasar({
  titik,
  lapisan,
  pusat,
  zoom = 5,
  tinggi,
  sorot,
  zoomRoda = true,
}: {
  titik: TitikPeta[];
  lapisan: IdLapisan;
  pusat: [number, number];
  zoom?: number;
  tinggi: string;
  /** Nama kota yang sedang dilihat — diberi cincin pembeda. */
  sorot?: string;
  /**
   * Matikan untuk peta yang tertanam di tengah halaman. Peta yang menelan
   * roda mouse membuat halaman tidak bisa digulir saat kursor melintasinya
   * — gangguan kecil yang sangat terasa di dashboard yang panjang.
   */
  zoomRoda?: boolean;
}) {
  const info = LAPISAN.find((l) => l.id === lapisan)!;

  return (
    <MapContainer
      center={pusat}
      zoom={zoom}
      scrollWheelZoom={zoomRoda}
      style={{ height: tinggi, width: "100%" }}
      className="z-0"
    >
      {/* Ubin standar OpenStreetMap: bebas dipakai tanpa kunci API.
          CartoDB dan Mapbox kini mewajibkan kunci, yang berarti peta akan
          mati begitu kuncinya tidak terpasang di lingkungan penilaian. */}
      <TileLayer
        attribution='&copy; Kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {titik.map((t) => {
        const nilai = nilaiTitik(t, lapisan);
        const kelas = kelasDari(nilai, lapisan);
        const disorot = sorot === t.nama;
        return (
          <CircleMarker
            key={t.nama + t.lat}
            center={[t.lat, t.lon]}
            radius={(disorot ? 10 : 7) + kelas * 2.4}
            pathOptions={{
              color: disorot ? "var(--color-brand-700)" : "#ffffff",
              weight: disorot ? 3 : 2,
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
                  {t.labelCuaca}, {t.suhu} °C · hujan 24 jam {t.hujan24j} mm
                </p>
                <dl className="mt-2 space-y-0.5">
                  {(
                    [
                      ["Banjir", t.skor.banjir],
                      ["Longsor", t.skor.longsor],
                      ["Perjalanan", t.skor.transportasi],
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
  );
}
