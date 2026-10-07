import { Compass, Info, Mountain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BilahSkor, LencanaTingkat } from "@/components/ui/tingkat";
import type { AnalisisTopografi } from "@/lib/impact/topografi";

/**
 * Area rendah di sekitar kota.
 *
 * Yang ditampilkan adalah ARAH dan JARAK dari pusat kota, bukan nama
 * jalan. Keterangan "mengapa bukan nama jalan" sengaja ditaruh di dalam
 * kartunya sendiri, bukan di kaki halaman — pengguna yang mencari nama
 * jalan harus menemukan jawabannya di tempat ia mencarinya.
 */
export function AreaRendahKota({
  analisis,
  kota,
}: {
  analisis: AnalisisTopografi;
  kota: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-tile bg-tint-sky text-tint-sky-ink">
          <Mountain className="size-4" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
            Area rendah di sekitar {kota}
          </h2>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-3">
            Dihitung dari kisi ketinggian 81 titik, seluas sekitar 10 × 10 km
          </p>
        </div>
      </div>

      {analisis.relatifDatar ? (
        <p className="mt-4 rounded-tile bg-surface-2 p-3.5 text-[12.5px] leading-relaxed text-ink-2">
          Wilayah ini relatif datar — beda tinggi antara titik tertinggi dan
          terendah hanya {analisis.bedaTinggi} meter. Tidak ada cekungan yang
          menonjol, sehingga air cenderung tersebar merata dan tidak terkumpul
          di satu arah tertentu.
        </p>
      ) : analisis.area.length === 0 ? (
        <p className="mt-4 rounded-tile bg-surface-2 p-3.5 text-[12.5px] leading-relaxed text-ink-2">
          Tidak ditemukan cekungan berarti pada kisi yang dianalisis. Rentang
          ketinggian di sekitar {kota} adalah {analisis.elevasiTerendah}–
          {analisis.elevasiTertinggi} mdpl.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {analisis.area.map((a) => (
            <li key={`${a.lat}-${a.lon}`} className="rounded-tile bg-surface-2 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink">
                  <Compass className="size-3.5 shrink-0 text-ink-3" strokeWidth={2.5} aria-hidden />
                  Sekitar {a.jarakKm} km arah {a.arah}
                </span>
                <LencanaTingkat tingkat={a.tingkat} />
              </div>

              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
                Titik ini {a.kedalaman} meter lebih rendah daripada tanah di
                sekelilingnya ({a.elevasi} mdpl). Cekungan seperti ini menahan
                air lebih lama setelah hujan.
              </p>

              <BilahSkor
                skor={a.skor}
                tingkat={a.tingkat}
                label={`Area rendah arah ${a.arah}`}
                className="mt-2"
              />
            </li>
          ))}
        </ul>
      )}

      {/* Keterangan penting, ditaruh di tempat orang mencarinya */}
      <div className="mt-4 flex gap-2.5 rounded-tile border border-line p-3.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-ink-3" aria-hidden />
        <div className="text-[11.5px] leading-relaxed text-ink-2">
          <p>
            <strong className="font-bold text-ink">
              Mengapa tidak disebutkan nama jalannya?
            </strong>{" "}
            CuacaKita tidak punya data jaringan jalan, catatan titik banjir per
            ruas, maupun data saluran air dan lalu lintas. Menyebut nama jalan
            tertentu berarti mengarang — dan karangan semacam itu berbahaya,
            karena orang bisa memutar ke jalan yang justru lebih buruk.
          </p>
          <p className="mt-2">
            Yang bisa dihitung sungguhan adalah bentuk tanah: titik yang lebih
            rendah daripada sekelilingnya memang menampung air lebih lama. Untuk
            kondisi jalan sebenarnya, gunakan aplikasi peta dengan lalu lintas
            langsung, dan ikuti informasi BPBD setempat.
          </p>
        </div>
      </div>
    </Card>
  );
}
