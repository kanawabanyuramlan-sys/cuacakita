import type { ReactNode } from "react";
import {
  Beef,
  CloudRain,
  Leaf,
  Map,
  MessageCircleQuestion,
  Mountain,
  ShieldAlert,
  Sprout,
  TrendingUp,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { RantaiDampak } from "@/components/rantai-dampak";
import type { SimpulRantai } from "@/lib/impact/rantai";

function Judul({
  label,
  judul,
  anak,
  children,
}: {
  label: string;
  judul: ReactNode;
  anak?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center rounded-pill border border-line bg-surface px-3.5 py-1.5 text-[12px] font-bold text-brand-700 shadow-tile">
        {label}
      </span>
      <h2 className="mt-5 text-[clamp(1.8rem,4.3vw,2.9rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
        {judul}
      </h2>
      {anak ? (
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2 text-balance-pretty">
          {anak}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/* ── Rantai dampak: inti produk, ditaruh paling atas ──────────────── */

export function BagianRantai({ simpul }: { simpul: SimpulRantai[] | null }) {
  return (
    <section id="rantai" className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <Judul
          label="Rantai dampak"
          judul={
            <>
              Satu hujan, <span className="text-brand-600">delapan akibat</span>{" "}
              yang saling menyambung
            </>
          }
          anak="Aplikasi cuaca berhenti di angka milimeter. CuacaKita melanjutkannya: ke sawah, ke pasokan, ke harga, ke jalan, ke lereng, sampai ke kegiatan warga."
        />

        <div className="mt-10 rounded-panel border border-line bg-surface p-5 shadow-card sm:p-7">
          {simpul ? (
            <RantaiDampak simpul={simpul} />
          ) : (
            <p className="py-10 text-center text-[13.5px] text-ink-3">
              Rantai dampak membutuhkan data cuaca yang sedang tidak tersedia.
            </p>
          )}
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-center text-[12.5px] leading-relaxed text-ink-3">
          Perhatikan label keyakinan di tiap simpul. Makin jauh dari pengukuran
          cuaca, makin banyak faktor lain yang ikut menentukan — dan CuacaKita
          mengatakannya, bukan menyembunyikannya.
        </p>
      </div>
    </section>
  );
}

/* ── Modul ────────────────────────────────────────────────────────── */

const modul = [
  {
    ikon: Sprout,
    nama: "Pertanian",
    isi: "Risiko panen, penyakit tanaman, dan jadwal tanam dihitung dari enam faktor cuaca — per komoditas, dari padi sampai cabai.",
    bg: "var(--color-tint-mint)",
    ink: "var(--color-tint-mint-ink)",
    span: true,
  },
  {
    ikon: Beef,
    nama: "Peternakan",
    isi: "Indeks suhu–kelembapan menunjukkan kapan ternak mulai tertekan panas, jauh sebelum terlihat dari luar.",
    bg: "var(--color-tint-sun)",
    ink: "var(--color-tint-sun-ink)",
  },
  {
    ikon: Leaf,
    nama: "Perkebunan",
    isi: "Kopi, teh, sawit, karet, kakao — komoditas tahunan yang paling terdampak hujan berkepanjangan.",
    bg: "var(--color-tint-lavender)",
    ink: "var(--color-tint-lavender-ink)",
  },
  {
    ikon: Truck,
    nama: "Transportasi",
    isi: "Jarak pandang, hembusan angin, dan genangan dinilai jadi satu tingkat risiko perjalanan.",
    bg: "var(--color-tint-sky)",
    ink: "var(--color-tint-sky-ink)",
  },
  {
    ikon: CloudRain,
    nama: "Banjir & Genangan",
    isi: "Hujan sebagai pemicu, dataran rendah sebagai pengali kerentanan.",
    bg: "var(--color-tint-slate)",
    ink: "var(--color-tint-slate-ink)",
  },
  {
    ikon: Mountain,
    nama: "Longsor",
    isi: "Hujan yang sudah turun tiga hari terakhir dihitung, bukan hanya yang akan datang.",
    bg: "var(--color-tint-rose)",
    ink: "var(--color-tint-rose-ink)",
  },
];

export function BagianModul() {
  return (
    <section id="modul" className="px-5 pb-20 sm:px-8 sm:pb-24">
      <div className="mx-auto max-w-7xl">
        <Judul
          label="Modul"
          judul={
            <>
              Enam sektor, <span className="text-brand-600">rumus terbuka</span>
            </>
          }
          anak="Setiap skor bisa dibuka sampai ke faktor penyusunnya — nilai mentah, bobot, dan sumbangannya terhadap angka akhir."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {modul.map((m) => {
            const Ikon = m.ikon;
            return (
              <article
                key={m.nama}
                style={{ backgroundColor: m.bg, color: m.ink }}
                className={cn(
                  "flex flex-col gap-4 rounded-card p-6 shadow-tile",
                  m.span && "md:col-span-2",
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-[13px] bg-white/55">
                  <Ikon className="size-5" strokeWidth={2.25} aria-hidden />
                </span>
                <div>
                  <h3 className="text-[19px] font-extrabold tracking-tight">
                    {m.nama}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed opacity-75">
                    {m.isi}
                  </p>
                </div>
              </article>
            );
          })}

          {/* Dua kartu pelengkap bernuansa gelap */}
          <article className="flex flex-col gap-4 rounded-card bg-night p-6 text-white shadow-card md:col-span-2">
            <span className="flex size-10 items-center justify-center rounded-[13px] bg-white/10">
              <Map className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div>
              <h3 className="text-[19px] font-extrabold tracking-tight">
                Peta Cuaca &amp; Risiko
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
                Lapisan cuaca, curah hujan, wilayah berpotensi banjir, dan
                wilayah berlereng dalam satu peta — dengan legenda yang jelas
                dan tanpa satu pun data pribadi warga.
              </p>
            </div>
          </article>

          <article className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-tile">
            <span className="flex size-10 items-center justify-center rounded-[13px] bg-brand-50 text-brand-700">
              <MessageCircleQuestion className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div>
              <h3 className="text-[19px] font-extrabold tracking-tight text-ink">
                Tanya CuacaKita
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                Pertanyaan umum warga dijawab langsung dari angka yang sedang
                tampil di layar — bukan dikarang, dan selalu menyebut dasar
                jawabannya.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ── Sumber data: kejujuran sebagai fitur ─────────────────────────── */

export function BagianSumber() {
  return (
    <section id="sumber" className="px-5 pb-20 sm:px-8 sm:pb-24">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-panel border border-line bg-surface p-7 shadow-tile sm:p-9">
          <span className="inline-flex items-center rounded-pill bg-brand-50 px-3.5 py-1.5 text-[12px] font-bold text-brand-700">
            Sumber data
          </span>
          <h2 className="mt-5 text-[clamp(1.5rem,3.2vw,2.1rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-ink">
            Angkanya nyata, dan selalu disebut asalnya
          </h2>

          <ul className="mt-7 space-y-5">
            <li className="flex gap-4">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-tile bg-tint-sky text-tint-sky-ink">
                <CloudRain className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div>
                <p className="text-[14px] font-bold text-ink">Open-Meteo</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">
                  Mesin utama. Prakiraan per jam dan harian, curah hujan, angin,
                  kelembapan, tekanan, jarak pandang, indeks UV, serta elevasi
                  titik. Terbuka dan tanpa kunci API.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-tile bg-tint-mint text-tint-mint-ink">
                <ShieldAlert className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div>
                <p className="text-[14px] font-bold text-ink">
                  BMKG{" "}
                  <span className="ml-1 rounded-pill bg-tint-mint px-1.5 py-0.5 text-[10px] font-bold text-tint-mint-ink">
                    Resmi
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">
                  Prakiraan resmi pemerintah, ditampilkan berdampingan sebagai
                  pembanding — bukan sebagai pengganti. Tersedia untuk 43 kota
                  yang kode wilayahnya sudah diverifikasi satu per satu.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-tile bg-tint-sun text-tint-sun-ink">
                <TrendingUp className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div>
                <p className="text-[14px] font-bold text-ink">
                  Harga komoditas{" "}
                  <span className="ml-1 rounded-pill bg-tint-sun px-1.5 py-0.5 text-[10px] font-bold text-tint-sun-ink">
                    Belum terhubung
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">
                  CuacaKita tidak terhubung ke data harga pasar mana pun. Simpul
                  Harga hanya menunjukkan arah tekanan dari sisi cuaca, dan
                  diberi label keyakinan paling lemah.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Batasan — ditulis sejelas fiturnya */}
        <div className="rounded-panel bg-night p-7 text-white shadow-card sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/80">
            <ShieldAlert className="size-3.5 text-zest" strokeWidth={2.5} aria-hidden />
            Yang CuacaKita bukan
          </span>

          <h2 className="mt-5 text-[clamp(1.5rem,3.2vw,2.1rem)] font-extrabold leading-[1.12] tracking-[-0.03em]">
            Platform analisis, bukan lembaga peringatan
          </h2>

          <ul className="mt-7 space-y-4">
            {[
              "Skor dampak adalah indikator analitis internal, bukan peringatan dini resmi. Rujukan resmi tetap BMKG dan BPBD.",
              "Elevasi dipakai sebagai pendekatan kasar kemiringan lahan. Ini bukan data lereng, dan bukan pengganti peta rawan bencana.",
              "Ambang batas disusun dari klasifikasi curah hujan BMKG dan rentang kenyamanan yang lazim, bukan dari model yang sudah tervalidasi lapangan.",
              "Tidak ada angka yang dikarang. Bila sumber data gagal dihubungi, bagian itu dikosongkan dan diberi keterangan.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-zest"
                  aria-hidden
                />
                <p className="text-[13.5px] leading-relaxed text-white/65">{t}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
