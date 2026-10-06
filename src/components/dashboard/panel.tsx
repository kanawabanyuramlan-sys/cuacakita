import { AlertTriangle, BadgeCheck, CloudOff, Info, Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { IkonCuaca } from "@/components/ui/ikon-cuaca";
import { BilahSkor, LencanaTingkat } from "@/components/ui/tingkat";
import type { PrakiraanBMKG } from "@/lib/weather/types";
import type { Insight } from "@/lib/impact/insight";
import type { Tingkat } from "@/lib/impact/engine";

/* ── Prakiraan resmi BMKG ──────────────────────────────────────────── */

export function PanelBMKG({
  bmkg,
  catatan,
}: {
  bmkg: PrakiraanBMKG | null;
  catatan?: string;
}) {
  if (!bmkg) {
    return (
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-tile bg-surface-2 text-ink-3">
            <CloudOff className="size-4" strokeWidth={2.25} aria-hidden />
          </span>
          <div>
            <h3 className="text-[14px] font-bold text-ink">
              Prakiraan resmi BMKG belum tersedia
            </h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
              {catatan ??
                "Layanan BMKG tidak dapat dihubungi saat ini."}{" "}
              Angka pada halaman ini tetap berasal dari Open-Meteo dan tidak
              diisi perkiraan sendiri.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const entri = bmkg.entri.slice(0, 8);

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            Prakiraan resmi BMKG
            <span className="inline-flex items-center gap-1 rounded-pill bg-tint-mint px-2 py-0.5 text-[10.5px] font-bold text-tint-mint-ink">
              <BadgeCheck className="size-3" strokeWidth={2.75} aria-hidden />
              Resmi
            </span>
          </span>
        }
        subtitle={`${bmkg.lokasi.desa}, ${bmkg.lokasi.kecamatan}, ${bmkg.lokasi.kotkab}`}
      />

      <div className="flex gap-2 overflow-x-auto px-5 pb-4">
        {entri.map((e) => {
          const d = new Date(e.waktuLokal.replace(" ", "T"));
          return (
            <div
              key={e.waktuLokal}
              className="flex min-w-[88px] flex-col items-center gap-1.5 rounded-tile border border-line bg-surface-2 p-3 text-center"
            >
              <span className="text-[11px] font-bold text-ink-3">
                {d.toLocaleDateString("id-ID", { weekday: "short" })}{" "}
                {String(d.getHours()).padStart(2, "0")}.00
              </span>
              <IkonCuaca
                kategori={e.kategori}
                siang={d.getHours() >= 6 && d.getHours() < 18}
                className="size-11"
              />
              <span className="text-[15px] font-extrabold leading-none text-ink">
                {e.suhu}°
              </span>
              <span className="text-[10.5px] leading-tight text-ink-3">
                {e.deskripsi}
              </span>
            </div>
          );
        })}
      </div>

      <p className="border-t border-line px-5 py-3 text-[11.5px] leading-snug text-ink-3">
        Dianalisis BMKG{" "}
        {bmkg.dianalisisPada
          ? new Date(bmkg.dianalisisPada).toLocaleString("id-ID", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
        . Bila angka BMKG berbeda dengan Open-Meteo, keduanya tetap ditampilkan
        apa adanya — tidak ada yang dirata-ratakan diam-diam.
      </p>
    </Card>
  );
}

/* ── Apa yang sedang terjadi ───────────────────────────────────────── */

const nadaGaya = {
  tenang: "border-line bg-surface-2",
  perhatian: "border-tint-sun bg-tint-sun/40",
  waspada: "border-tint-rose bg-tint-rose/40",
} as const;

export function PanelInsight({ insight }: { insight: Insight }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-tile bg-brand-50 text-brand-700">
          <Sparkles className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <h3 className="text-[15px] font-extrabold tracking-tight text-ink">
          Apa yang sedang terjadi?
        </h3>
      </div>

      <p className="mt-3.5 text-[13.5px] leading-relaxed text-ink-2">
        {insight.ringkasan}
      </p>

      <div className="mt-4 space-y-2">
        {insight.sorotan.map((s) => (
          <div
            key={s.judul}
            className={`rounded-tile border p-3.5 ${nadaGaya[s.nada]}`}
          >
            <p className="flex items-start gap-2 text-[13px] font-bold text-ink">
              {s.nada === "tenang" ? (
                <Info className="mt-0.5 size-3.5 shrink-0 text-ink-3" strokeWidth={2.5} aria-hidden />
              ) : (
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0 text-[color:var(--color-tingkat-sedang)]"
                  strokeWidth={2.5}
                  aria-hidden
                />
              )}
              {s.judul}
            </p>
            <p className="mt-1 pl-5.5 text-[12.5px] leading-relaxed text-ink-2">
              {s.isi}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-3">
          Paling perlu diperhatikan
        </p>
        <ul className="mt-3 space-y-2.5">
          {insight.prioritas.map((p, i) => (
            <li key={p.nama}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-semibold text-ink">
                  <span className="mr-1.5 text-[11px] font-bold tabular-nums text-ink-3">
                    {i + 1}.
                  </span>
                  {p.nama}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[13px] font-extrabold tabular-nums text-ink">
                    {p.skor}
                  </span>
                  <LencanaTingkat tingkat={p.tingkat as Tingkat} />
                </span>
              </div>
              <BilahSkor
                skor={p.skor}
                tingkat={p.tingkat as Tingkat}
                label={p.nama}
                className="mt-1.5"
              />
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-[11px] leading-snug text-ink-3">
        Ringkasan ini dirangkai dari angka yang sedang tampil di halaman ini,
        bukan dihasilkan model bahasa. Untuk data yang sama, kalimatnya akan
        selalu sama.
      </p>
    </Card>
  );
}
