"use client";

import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { TitikPeta } from "@/server/peta";

/* ── Peta dasar yang dapat dipilih ─────────────────────────────────── */

export type IdPeta = "standar" | "medan" | "satelit";

export const PETA_DASAR: Record<
  IdPeta,
  { nama: string; url: string; atribusi: string; maxZoom: number }
> = {
  standar: {
    nama: "Standar",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    atribusi:
      '&copy; Kontributor <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  medan: {
    nama: "Medan",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    atribusi:
      'Peta medan &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA), data &copy; Kontributor OpenStreetMap',
    maxZoom: 17,
  },
  satelit: {
    nama: "Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    atribusi: "Citra &copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 18,
  },
};

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
  | "suhu"
  | "angin";

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
  {
    id: "angin",
    nama: "Arah angin",
    satuan: "km/j",
    keterangan: "Arah dan kecepatan angin saat ini",
    awam: "Panah menunjuk ke arah angin BERTIUP. Makin panjang dan gelap, makin kencang.",
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
  if (lapisan === "angin") return t.hembusanMaks;
  return t.skor[lapisan];
}

export function batasLapisan(lapisan: IdLapisan) {
  if (lapisan === "hujan") return [0.5, 5, 20, 50];
  if (lapisan === "suhu") return [24, 27, 30, 33];
  // Ambang angin mengikuti titik-titik yang punya arti nyata: 28 km/jam
  // mulai mengganggu sepeda motor, 45 adalah ambang peringatan BMKG untuk
  // perahu nelayan, 60 mulai merusak atap ringan.
  if (lapisan === "angin") return [15, 28, 45, 60];
  return [25, 50, 75, 90];
}

/**
 * Panah angin sebagai divIcon.
 *
 * `anginArah` adalah arah angin BERASAL (konvensi meteorologi), jadi
 * panahnya diputar 180 derajat agar menunjuk ke arah angin BERTIUP —
 * itulah yang dibayangkan orang saat melihat panah di peta. Keduanya
 * sering tertukar, dan arah yang terbalik lebih buruk daripada tidak ada
 * panah sama sekali.
 */
function ikonAngin(arahDari: number, kelas: number, kencang: boolean) {
  const putar = (arahDari + 180) % 360;
  const panjang = 11 + kelas * 3;
  const ukuran = 44;
  const t = ukuran / 2;
  const warna = ["#5598e7", "#2a78d6", "#256abf", "#184f95", "#0d366b"][kelas];

  return L.divIcon({
    className: "panah-angin",
    iconSize: [ukuran, ukuran],
    iconAnchor: [t, t],
    // Panah digambar dua kali: lapisan putih tebal di bawah, warna di
    // atasnya. Tanpa halo ini, panah biru lenyap di atas laut biru pada
    // peta Medan dan Satelit — persis yang terjadi saat pertama diuji.
    html: `<svg width="${ukuran}" height="${ukuran}" viewBox="0 0 ${ukuran} ${ukuran}"
        style="transform: rotate(${putar}deg); overflow: visible">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <g stroke="#ffffff" stroke-width="${kencang ? 6.4 : 5.6}" opacity="0.95">
            <line x1="${t}" y1="${t + panjang}" x2="${t}" y2="${t - panjang}" />
            <path d="M${t - 5} ${t - panjang + 6} L${t} ${t - panjang} L${t + 5} ${t - panjang + 6}" />
          </g>
          <g stroke="${warna}" stroke-width="${kencang ? 3.2 : 2.4}">
            <line class="alir" x1="${t}" y1="${t + panjang}" x2="${t}" y2="${t - panjang}" />
            <path d="M${t - 5} ${t - panjang + 6} L${t} ${t - panjang} L${t + 5} ${t - panjang + 6}" />
          </g>
        </g>
        <circle cx="${t}" cy="${t + panjang}" r="2.6" fill="${warna}"
                stroke="#ffffff" stroke-width="1.6" />
      </svg>`,
  });
}

const MATA_ANGIN = [
  "utara", "timur laut", "timur", "tenggara",
  "selatan", "barat daya", "barat", "barat laut",
];

function arahMata(derajat: number) {
  return MATA_ANGIN[Math.round(derajat / 45) % 8];
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
  petaDasar = "standar",
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
  petaDasar?: IdPeta;
}) {
  const info = LAPISAN.find((l) => l.id === lapisan)!;
  const dasar = PETA_DASAR[petaDasar];

  return (
    <MapContainer
      center={pusat}
      zoom={zoom}
      scrollWheelZoom={zoomRoda}
      style={{ height: tinggi, width: "100%" }}
      className="z-0"
    >
      {/* Ketiga sumber ubin bebas dipakai tanpa kunci API. CartoDB dan
          Mapbox kini mewajibkan kunci, yang berarti peta akan mati begitu
          kuncinya tidak terpasang di lingkungan penilaian. */}
      <TileLayer
        key={petaDasar}
        attribution={dasar.atribusi}
        url={dasar.url}
        maxZoom={dasar.maxZoom}
      />

      {lapisan === "angin"
        ? titik.map((t) => {
            const kelas = kelasDari(t.hembusanMaks, "angin");
            return (
              <Marker
                key={t.nama + t.lat}
                position={[t.lat, t.lon]}
                icon={ikonAngin(t.anginArah, kelas, sorot === t.nama)}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <span className="text-[12px] font-bold">
                    {t.nama}: {t.angin} km/j, hembusan {t.hembusanMaks} km/j
                    <br />
                    dari {arahMata(t.anginArah)}
                  </span>
                </Tooltip>
              </Marker>
            );
          })
        : null}

      {lapisan === "angin"
        ? null
        : titik.map((t) => {
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
