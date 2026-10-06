"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame, Legenda } from "@/components/charts/chart-frame";
import type { HariHistori } from "@/server/histori";

const SUHU_MAKS = "var(--viz-suhu)";
const SUHU_MIN = "var(--viz-hujan)";
const HUJAN = "var(--viz-hujan)";

function label(t: string) {
  const d = new Date(t);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function Tip({
  active,
  payload,
  label: l,
  satuan,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  satuan: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-tile border border-line bg-surface px-3 py-2 shadow-card">
      <p className="text-[12px] font-bold text-ink">{l}</p>
      <ul className="mt-1 space-y-0.5">
        {payload.map((p) => (
          <li key={p.name} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-0.5 w-3 rounded-pill"
              style={{ backgroundColor: p.color }}
              aria-hidden
            />
            <span className="text-ink-2">{p.name}</span>
            <span className="ml-auto font-bold tabular-nums text-ink">
              {p.value} {satuan}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GrafikHistori({ hari }: { hari: HariHistori[] }) {
  const data = hari.map((h) => ({ ...h, label: label(h.tanggal) }));
  const jarak = Math.max(0, Math.floor(data.length / 7) - 1);

  const sumbuX = {
    dataKey: "label",
    tickLine: false,
    interval: jarak,
    axisLine: { stroke: "var(--viz-axis)", strokeWidth: 1 },
    tick: { fill: "var(--viz-ink-3)", fontSize: 11, fontWeight: 600 },
    dy: 6,
  } as const;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-card border border-line bg-surface shadow-tile">
        <ChartFrame
          judul="Curah hujan harian"
          keterangan={`${data.length} hari terakhir`}
          kolom={[
            { key: "label", label: "Tanggal" },
            { key: "hujan", label: "Hujan (mm)", numeric: true },
          ]}
          baris={data.map((d) => ({ label: d.label, hujan: d.hujan }))}
        >
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 14, right: 14, bottom: 4, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
                <XAxis {...sumbuX} />
                <YAxis
                  width={36}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--viz-ink-3)", fontSize: 11 }}
                />
                <Tooltip
                  content={<Tip satuan="mm" />}
                  cursor={{ fill: "var(--viz-grid)", fillOpacity: 0.5 }}
                />
                <Bar
                  dataKey="hujan"
                  name="Curah hujan"
                  fill={HUJAN}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </div>

      <div className="rounded-card border border-line bg-surface shadow-tile">
        <ChartFrame
          judul="Suhu harian"
          keterangan="Maksimum dan minimum"
          legenda={
            <Legenda
              items={[
                { label: "Suhu maksimum", color: SUHU_MAKS },
                { label: "Suhu minimum", color: SUHU_MIN },
              ]}
            />
          }
          kolom={[
            { key: "label", label: "Tanggal" },
            { key: "suhuMaks", label: "Maks (°C)", numeric: true },
            { key: "suhuMin", label: "Min (°C)", numeric: true },
          ]}
          baris={data.map((d) => ({
            label: d.label,
            suhuMaks: d.suhuMaks,
            suhuMin: d.suhuMin,
          }))}
        >
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 14, right: 14, bottom: 4, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--viz-grid)" strokeWidth={1} />
                <XAxis {...sumbuX} />
                <YAxis
                  width={36}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--viz-ink-3)", fontSize: 11 }}
                  tickFormatter={(v: number) => `${Math.round(v)}°`}
                />
                <Tooltip
                  content={<Tip satuan="°C" />}
                  cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="suhuMaks"
                  name="Suhu maksimum"
                  stroke={SUHU_MAKS}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4.5, stroke: "var(--viz-surface)", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="suhuMin"
                  name="Suhu minimum"
                  stroke={SUHU_MIN}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4.5, stroke: "var(--viz-surface)", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartFrame>
      </div>
    </div>
  );
}
