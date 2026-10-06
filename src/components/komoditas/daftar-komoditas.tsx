"use client";

import { useState } from "react";
import { CheckCircle2, FlaskConical } from "lucide-react";
import { cn } from "@/lib/cn";
import { BilahSkor, LencanaTingkat } from "@/components/ui/tingkat";
import type { JenisKomoditas, RisikoKomoditas } from "@/lib/impact/komoditas";

const TAB: { id: JenisKomoditas | "semua"; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "pertanian", label: "Pertanian" },
  { id: "perkebunan", label: "Perkebunan" },
];

export function DaftarKomoditas({
  risiko,
  risikoAndai,
  namaSkenario,
  keteranganSkenario,
  kota,
}: {
  risiko: RisikoKomoditas[];
  risikoAndai: RisikoKomoditas[];
  namaSkenario: string;
  keteranganSkenario: string;
  kota: string;
}) {
  const [tab, setTab] = useState<JenisKomoditas | "semua">("semua");
  const [andai, setAndai] = useState(false);

  const sumber = andai ? risikoAndai : risiko;
  const tampil =
    tab === "semua" ? sumber : sumber.filter((r) => r.komoditas.jenis === tab);

  const semuaTenang = risiko.every((r) => r.skor < 10);
  const nilaiNyata = new Map(risiko.map((r) => [r.komoditas.id, r.skor]));

  return (
    <div>
      {/* Saat semuanya nol, jelaskan artinya — deretan angka nol tanpa
          keterangan terbaca seperti halaman yang rusak, bukan kabar baik. */}
      {semuaTenang && !andai ? (
        <div className="mb-3 flex gap-3 rounded-card border border-[color:var(--color-tingkat-rendah)]/30 bg-tint-mint/40 p-4">
          <CheckCircle2
            className="mt-0.5 size-4.5 shrink-0 text-[color:var(--color-tingkat-rendah)]"
            strokeWidth={2.5}
            aria-hidden
          />
          <div>
            <p className="text-[13.5px] font-bold text-ink">
              Tidak ada tekanan cuaca berarti di {kota} saat ini.
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
              Angka nol di bawah bukan berarti data kosong — memang tidak ada
              hujan berlebih, udara lembap, angin kencang, panas berlebih,
              maupun kekeringan yang sedang menekan tanaman. Coba tombol
              pengandaian di bawah untuk melihat komoditas mana yang akan
              paling terpukul bila cuacanya berubah.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Jenis komoditas"
          className="flex gap-1 rounded-pill border border-line bg-surface p-1 shadow-tile"
        >
          {TAB.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "whitespace-nowrap rounded-pill px-4 py-1.5 text-[13px] font-semibold transition-colors",
                tab === t.id
                  ? "bg-brand-600 text-white"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setAndai((v) => !v)}
          aria-pressed={andai}
          className={cn(
            "inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-[12.5px] font-bold shadow-tile transition-colors",
            andai
              ? "border-transparent bg-[color:var(--color-tingkat-tinggi)] text-white"
              : "border-line bg-surface text-ink-2 hover:text-ink",
          )}
        >
          <FlaskConical className="size-3.5" strokeWidth={2.5} aria-hidden />
          {andai ? "Kembali ke kondisi nyata" : `Andai ${namaSkenario.toLowerCase()}`}
        </button>
      </div>

      {andai ? (
        <p className="mt-3 rounded-card border border-[color:var(--color-tingkat-tinggi)]/30 bg-tint-rose/30 p-4 text-[12.5px] leading-relaxed text-ink-2">
          <strong className="font-bold text-ink">Mode pengandaian.</strong>{" "}
          Angka di bawah BUKAN prakiraan dan BUKAN kondisi sebenarnya. Ini
          hasil perhitungan bila {keteranganSkenario.toLowerCase()} Angka
          sebenarnya ditampilkan kecil di sebelah tiap nilai.
        </p>
      ) : null}

      <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tampil.map((r) => {
          const nyata = nilaiNyata.get(r.komoditas.id) ?? 0;
          return (
            <li
              key={r.komoditas.id}
              className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-tile"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none" aria-hidden>
                  {r.komoditas.ikon}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-extrabold tracking-tight text-ink">
                    {r.komoditas.nama}
                  </h3>
                  <p className="mt-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-3">
                    {r.komoditas.jenis}
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-[20px] font-extrabold leading-none tabular-nums text-ink">
                    {r.skor}
                  </span>
                  <span className="block text-[10px] font-semibold text-ink-3">
                    {andai ? `nyata: ${nyata}` : "dari 100"}
                  </span>
                </span>
              </div>

              <BilahSkor
                skor={r.skor}
                tingkat={r.tingkat}
                label={r.komoditas.nama}
                className="mt-3"
              />
              <div className="mt-2">
                <LencanaTingkat tingkat={r.tingkat} />
              </div>

              <p className="mt-3 rounded-tile bg-surface-2 p-3 text-[12.5px] leading-relaxed text-ink-2">
                {r.penyebab ? (
                  <>
                    <strong className="font-bold text-ink">
                      {r.penyebab.nama}
                    </strong>{" "}
                    paling menentukan — {r.penyebab.kalimat}.
                  </>
                ) : (
                  "Tidak ada tekanan cuaca yang menonjol untuk komoditas ini."
                )}
              </p>

              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
                {r.komoditas.catatan}
              </p>

              <p className="mt-auto pt-3 text-[11.5px] text-ink-3">
                Paling rawan: {r.komoditas.faseRawan}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
