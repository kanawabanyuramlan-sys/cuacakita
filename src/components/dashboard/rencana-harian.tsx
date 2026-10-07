import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { HalUmum, JendelaAktivitas, NilaiJendela } from "@/lib/impact/harian";

/* ── Jendela aktivitas sepanjang hari ──────────────────────────────── */

const gaya: Record<NilaiJendela, { label: string; kelas: string; titik: string }> = {
  baik: {
    label: "Aman",
    kelas: "border-[color:var(--color-tingkat-rendah)]/25 bg-tint-mint/35",
    titik: "bg-[color:var(--color-tingkat-rendah)]",
  },
  "hati-hati": {
    label: "Hati-hati",
    kelas: "border-[color:var(--color-tingkat-sedang)]/30 bg-tint-sun/35",
    titik: "bg-[color:var(--color-tingkat-sedang)]",
  },
  hindari: {
    label: "Siapkan payung",
    kelas: "border-[color:var(--color-tingkat-tinggi)]/30 bg-tint-rose/30",
    titik: "bg-[color:var(--color-tingkat-tinggi)]",
  },
};

const duaDigit = (n: number) => String(n).padStart(2, "0");

export function RencanaHarian({ jendela }: { jendela: JendelaAktivitas[] }) {
  if (jendela.length === 0) return null;
  const tersisa = jendela.filter((j) => !j.sudahLewat);
  const tampil = tersisa.length > 0 ? tersisa : jendela;

  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
        Rencana hari ini
      </h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
        {tersisa.length > 0
          ? "Kegiatan sehari-hari yang paling terpengaruh cuaca, diurutkan menurut jamnya."
          : "Seluruh jam kegiatan hari ini sudah lewat. Berikut rekapnya."}
      </p>

      <ul className="mt-4 space-y-2">
        {tampil
          .slice()
          .sort((a, b) => a.jamMulai - b.jamMulai)
          .map((j) => {
            const g = gaya[j.nilai];
            return (
              <li
                key={j.id}
                className={cn(
                  "flex flex-wrap items-start gap-3 rounded-tile border p-3.5",
                  g.kelas,
                  j.sudahLewat && "opacity-60",
                )}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {j.ikon}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[13.5px] font-bold text-ink">
                      {j.nama}
                    </span>
                    <span className="rounded-pill bg-surface px-2 py-0.5 text-[10.5px] font-bold tabular-nums text-ink-2">
                      {duaDigit(j.jamMulai)}.00–{duaDigit(j.jamSelesai)}.00
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-ink-2">
                      <span className={cn("size-1.5 rounded-full", g.titik)} aria-hidden />
                      {g.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
                    {j.pesan}
                  </p>
                </div>

                <span className="shrink-0 text-right">
                  <span className="block text-[13px] font-extrabold tabular-nums text-ink">
                    {j.hujanMm.toFixed(1)}
                    <span className="ml-0.5 text-[10px] font-semibold text-ink-3">mm</span>
                  </span>
                  <span className="block text-[10.5px] text-ink-3">
                    {Math.round(j.suhuRata)}°C
                  </span>
                </span>
              </li>
            );
          })}
      </ul>
    </Card>
  );
}

/* ── Hal lain yang sering ditemui ─────────────────────────────────── */

export function HalSering({ hal }: { hal: HalUmum[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
        Hal yang sering ditemui warga
      </h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
        Akibat cuaca yang biasanya baru terasa belakangan, bukan saat hujannya
        turun.
      </p>

      <ul className="mt-4 space-y-2.5">
        {hal.map((h) => (
          <li
            key={h.id}
            className={cn(
              "flex gap-3 rounded-tile border p-3.5",
              h.nada === "tenang"
                ? "border-[color:var(--color-tingkat-rendah)]/25 bg-tint-mint/30"
                : "border-line bg-surface-2",
            )}
          >
            <span className="text-xl leading-none" aria-hidden>
              {h.ikon}
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-ink">{h.judul}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
                {h.isi}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
