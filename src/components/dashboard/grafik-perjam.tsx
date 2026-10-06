"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame } from "@/components/charts/chart-frame";
import type { JamCuaca } from "@/lib/weather/types";

/**
 * Suhu dan curah hujan sengaja dipisah menjadi DUA grafik.
 *
 * Menumpuknya pada satu bidang dengan dua sumbu Y akan menciptakan
 * keterkaitan yang tidak ada di datanya — penyelarasan kedua skala itu
 * sepenuhnya sewenang-wenang. Dua grafik yang berbagi sumbu waktu yang
 * sama menyampaikan hal yang sama tanpa menyesatkan.
 */

const SUHU = "var(--viz-suhu)";
const HUJAN = "var(--viz-hujan)";

type Titik = {
  jam: string;
  label: string;
  suhu: number;
  hujan: number;
  peluang: number | null;
};

function siapkan(perJam: JamCuaca[], mulai: string): Titik[] {
  const t0 = new Date(mulai).getTime();
  return perJam
    .filter((j) => {
      const t = new Date(j.waktu).getTime();
      return t >= t0 && t < t0 + 24 * 3600 * 1000;
    })
    .map((j) => {
      const d = new Date(j.waktu);
      return {
        jam: j.waktu,
        label: `${String(d.getHours()).padStart(2, "0")}.00`,
        suhu: Math.round(j.suhu * 10) / 10,
        hujan: Math.round(j.presipitasi * 10) / 10,
        peluang: j.peluangHujan,
      };
    });
}

function TipSuhu({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-tile border border-line bg-surface px-3 py-2 shadow-card">
      <p className="text-[12px] font-bold text-ink">{label}</p>
      <p className="mt-0.5 text-[12px] text-ink-2">
        <span className="font-bold tabular-nums text-ink">{payload[0].value}</span> °C
      </p>
    </div>
  );
}

function TipHujan({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number; payload?: Titik }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-tile border border-line bg-surface px-3 py-2 shadow-card">
      <p className="text-[12px] font-bold text-ink">{label}</p>
      <p className="mt-0.5 text-[12px] text-ink-2">
        <span className="font-bold tabular-nums text-ink">{payload[0].value}</span> mm
      </p>
      {p?.peluang != null ? (
        <p className="text-[11.5px] text-ink-3">Peluang hujan {p.peluang}%</p>
      ) : null}
    </div>
  );
}

const sumbuX = {
  dataKey: "label",
  tickLine: false,
  interval: 2,
  axisLine: { stroke: "var(--viz-axis)", strokeWidth: 1 },
  tick: { fill: "var(--viz-ink-3)", fontSize: 11, fontWeight: 600 },
  dy: 6,
} as const;

export function GrafikPerJam({
  perJam,
  mulai,
}: {
  perJam: JamCuaca[];
  mulai: string;
}) {
  const data = siapkan(perJam, mulai);
  const totalHujan = data.reduce((a, b) => a + b.hujan, 0);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-card border border-line bg-surface shadow-tile">
        <ChartFrame
          judul="Suhu 24 jam ke depan"
          keterangan="Prakiraan per jam"
          kolom={[
            { key: "label", label: "Jam" },
            { key: "suhu", label: "Suhu (°C)", numeric: true },
          ]}
          baris={data.map((d) => ({ label: d.label, suhu: d.suhu }))}
        >
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 14, right: 14, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="isiSuhu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SUHU} stopOpacity={0.16} />
                    <stop offset="100%" stopColor={SUHU} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
                <XAxis {...sumbuX} />
                <YAxis
                  width={34}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--viz-ink-3)", fontSize: 11 }}
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tickFormatter={(v: number) => `${Math.round(v)}°`}
                />
                <Tooltip
                  content={<TipSuhu />}
                  cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="suhu"
                  stroke={SUHU}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="url(#isiSuhu)"
                  dot={false}
                  activeDot={{
                    r: 4.5,
                    fill: SUHU,
                    stroke: "var(--viz-surface)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </div>

      <div className="rounded-card border border-line bg-surface shadow-tile">
        <ChartFrame
          judul="Curah hujan 24 jam ke depan"
          keterangan={`Total diprakirakan ${totalHujan.toFixed(1)} mm`}
          kolom={[
            { key: "label", label: "Jam" },
            { key: "hujan", label: "Hujan (mm)", numeric: true },
          ]}
          baris={data.map((d) => ({ label: d.label, hujan: d.hujan }))}
        >
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 14, right: 14, bottom: 4, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
                <XAxis {...sumbuX} />
                <YAxis
                  width={34}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--viz-ink-3)", fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<TipHujan />}
                  cursor={{ fill: "var(--viz-grid)", fillOpacity: 0.5 }}
                />
                <Bar
                  dataKey="hujan"
                  fill={HUJAN}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </div>
    </div>
  );
}
