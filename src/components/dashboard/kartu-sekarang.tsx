import {
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  Mountain,
  Sun,
  Wind,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { IkonCuaca } from "@/components/ui/ikon-cuaca";
import type { PaketCuaca } from "@/lib/weather/types";
import { klasifikasiHujanHarian } from "@/lib/weather/wmo";
import type { Kondisi } from "@/lib/impact/engine";

function arahMata(derajat: number) {
  const m = ["U", "TL", "T", "TG", "S", "BD", "B", "BL"];
  return m[Math.round(derajat / 45) % 8];
}

function Metrik({
  ikon: Ikon,
  label,
  nilai,
  satuan,
  catatan,
}: {
  ikon: typeof Wind;
  label: string;
  nilai: string;
  satuan?: string;
  catatan?: string;
}) {
  return (
    <div className="rounded-tile border border-line bg-surface-2 p-3.5">
      <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-3">
        <Ikon className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        {label}
      </p>
      <p className="mt-1.5 text-[18px] font-extrabold leading-none tracking-tight text-ink">
        {nilai}
        {satuan ? (
          <span className="ml-1 text-[11.5px] font-semibold text-ink-3">
            {satuan}
          </span>
        ) : null}
      </p>
      {catatan ? (
        <p className="mt-1 text-[11px] leading-snug text-ink-3">{catatan}</p>
      ) : null}
    </div>
  );
}

export function KartuSekarang({
  paket,
  kondisi,
}: {
  paket: PaketCuaca;
  kondisi: Kondisi;
}) {
  const s = paket.sekarang;
  const hujan = klasifikasiHujanHarian(kondisi.hujan24j);
  const uv = s.indeksUV ?? 0;
  const labelUV =
    uv < 3 ? "Rendah" : uv < 6 ? "Sedang" : uv < 8 ? "Tinggi" : uv < 11 ? "Sangat tinggi" : "Ekstrem";

  return (
    <Card className="overflow-hidden">
      {/* Kepala: kondisi utama di atas gradien langit */}
      <div className="relative bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[12.5px] font-semibold text-white/70">
              {paket.lokasi.wilayah ?? paket.lokasi.nama}
            </p>
            <p className="mt-0.5 text-[11.5px] text-white/50">
              {new Date(s.waktu).toLocaleString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span className="rounded-pill bg-white/15 px-2.5 py-1 text-[11px] font-bold">
            {paket.sumber.nama}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-5">
          <IkonCuaca
            kategori={s.kategori}
            siang={s.siang}
            className="size-24 shrink-0 drop-shadow-lg"
          />
          <div className="min-w-0">
            <p className="text-[clamp(3rem,9vw,4.2rem)] font-extrabold leading-none tracking-tight">
              {Math.round(s.suhu)}
              <span className="align-top text-[0.4em]">°C</span>
            </p>
            <p className="mt-1.5 text-[15px] font-bold">{s.labelCuaca}</p>
            <p className="text-[13px] text-white/65">
              Terasa seperti {Math.round(s.terasaSeperti)}°C · tutupan awan{" "}
              {s.tutupanAwan}%
            </p>
          </div>
        </div>
      </div>

      {/* Metrik rinci */}
      <div className="grid grid-cols-2 gap-2.5 p-5 sm:grid-cols-3">
        <Metrik
          ikon={CloudRain}
          label="Hujan 24 jam"
          nilai={kondisi.hujan24j.toFixed(1)}
          satuan="mm"
          catatan={hujan.label}
        />
        <Metrik
          ikon={Droplets}
          label="Kelembapan"
          nilai={String(s.kelembapan)}
          satuan="%"
        />
        <Metrik
          ikon={Wind}
          label="Angin"
          nilai={Math.round(s.anginKecepatan).toString()}
          satuan="km/j"
          catatan={`Dari ${arahMata(s.anginArah)} · hembusan ${Math.round(s.anginHembusan)}`}
        />
        <Metrik
          ikon={Gauge}
          label="Tekanan"
          nilai={Math.round(s.tekanan).toString()}
          satuan="hPa"
        />
        <Metrik
          ikon={Eye}
          label="Jarak pandang"
          nilai={
            s.visibilitas != null ? (s.visibilitas / 1000).toFixed(1) : "—"
          }
          satuan={s.visibilitas != null ? "km" : undefined}
        />
        <Metrik
          ikon={Sun}
          label="Indeks UV"
          nilai={s.indeksUV != null ? s.indeksUV.toFixed(1) : "—"}
          catatan={s.indeksUV != null ? labelUV : "Tidak tersedia"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-3 text-[11.5px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <Mountain className="size-3.5" strokeWidth={2.5} aria-hidden />
          Elevasi {paket.lokasi.elevasi?.toFixed(0)} mdpl
        </span>
        <span>
          Hujan 72 jam terakhir {kondisi.hujanLalu72j.toFixed(1)} mm
        </span>
        <span>
          {kondisi.hariKeringBerturut > 0
            ? `${kondisi.hariKeringBerturut} hari kering berturut-turut`
            : `${kondisi.hariHujanBerturut} hari hujan diprakirakan`}
        </span>
      </div>
    </Card>
  );
}
