import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";

const kolom = [
  {
    judul: "Platform",
    tautan: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Peta Risiko", href: "/peta" },
      { label: "Histori Cuaca", href: "/histori" },
    ],
  },
  {
    judul: "Sektor",
    tautan: [
      { label: "Pertanian", href: "/dashboard#dampak" },
      { label: "Peternakan", href: "/dashboard#dampak" },
      { label: "Perkebunan", href: "/dashboard#dampak" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="night-sky bg-night text-white">
      <div className="mx-auto max-w-7xl px-5 pt-20 sm:px-8 sm:pt-24">
        <div className="rounded-panel border border-night-line bg-night-2/70 p-8 text-center sm:p-14">
          <h2 className="mx-auto max-w-2xl text-[clamp(1.7rem,4.2vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
            Jangan berhenti di{" "}
            <span className="font-display font-normal italic text-zest">
              akan hujan
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/55">
            Lihat apa yang mungkin terjadi setelah hujan turun di wilayah Anda —
            dengan angka yang bisa ditelusuri sampai ke sumbernya.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/dashboard" variant="zest" size="lg">
              Buka Dashboard
              <ArrowUpRight className="size-4" strokeWidth={2.75} aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Peringatan resmi — ditaruh menonjol, bukan disembunyikan di bawah */}
      <div className="mx-auto max-w-7xl px-5 pt-10 sm:px-8">
        <div className="flex flex-col gap-3 rounded-card border border-zest/25 bg-zest/[0.07] p-5 sm:flex-row sm:items-center sm:gap-5">
          <Phone className="size-5 shrink-0 text-zest" strokeWidth={2.25} aria-hidden />
          <p className="text-[13px] leading-relaxed text-white/70">
            <strong className="font-bold text-white">
              CuacaKita adalah platform analisis informasi.
            </strong>{" "}
            Untuk peringatan cuaca dan kebencanaan resmi, ikuti informasi dari
            BMKG dan BPBD setempat. Dalam keadaan darurat, hubungi{" "}
            <strong className="font-bold text-white">112</strong>.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo tone="white" />
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/45">
              Platform analisis dampak cuaca untuk masyarakat, petani, peternak,
              pelaku usaha, pengemudi, dan pemerintah desa.
            </p>
          </div>

          {kolom.map((k) => (
            <nav key={k.judul} aria-label={k.judul}>
              <p className="text-[12px] font-bold uppercase tracking-wider text-white/35">
                {k.judul}
              </p>
              <ul className="mt-4 space-y-2.5">
                {k.tautan.map((t) => (
                  <li key={t.label + t.href}>
                    <Link
                      href={t.href}
                      className="text-[13.5px] font-medium text-white/60 transition-colors hover:text-white"
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-night-line pt-7 text-[12.5px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Data cuaca oleh Open-Meteo · Prakiraan resmi oleh BMKG · Peta oleh
            OpenStreetMap
          </p>
          <p>Dibangun untuk kompetisi, dengan data nyata.</p>
        </div>
      </div>
    </footer>
  );
}
