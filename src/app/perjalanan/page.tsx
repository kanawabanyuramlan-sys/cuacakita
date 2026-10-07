import { TriangleAlert } from "lucide-react";
import { Kerangka } from "@/components/shell/kerangka";
import { PilihRute } from "@/components/perjalanan/pilih-rute";
import {
  DaftarPersiapan,
  DaftarSinggahan,
  WaktuBerangkat,
} from "@/components/perjalanan/jalur";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { LencanaTingkat } from "@/components/ui/tingkat";
import { muatHalaman } from "@/server/cuaca";
import { muatPeta } from "@/server/peta";
import {
  jendelaBerangkat,
  jendelaTerbaik,
  kotaDiJalur,
  susunPersiapan,
} from "@/lib/impact/perjalanan";
import { susunPeringatan } from "@/lib/impact/peringatan";
import { tingkatDari } from "@/lib/impact/engine";
import { cariKota, LOKASI_BAWAAN } from "@/lib/lokasi";

export const revalidate = 900;

const TUJUAN_BAWAAN = "Semarang";

export async function generateMetadata(props: PageProps<"/perjalanan">) {
  const sp = await props.searchParams;
  const asal = typeof sp.asal === "string" ? sp.asal : LOKASI_BAWAAN;
  const tujuan = typeof sp.tujuan === "string" ? sp.tujuan : TUJUAN_BAWAAN;
  return { title: `Perjalanan ${asal} ke ${tujuan}` };
}

function Gagal({ pesan }: { pesan: string }) {
  return (
    <Kerangka kota={LOKASI_BAWAAN}>
      <div className="flex min-h-[60vh] items-center justify-center px-5 py-16">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-[20px] font-extrabold tracking-tight text-ink">
            Rencana perjalanan tidak dapat dibuat
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{pesan}</p>
          <ButtonLink href="/dashboard" variant="primary" size="md" className="mt-6">
            Kembali ke ringkasan
          </ButtonLink>
        </Card>
      </div>
    </Kerangka>
  );
}

export default async function PerjalananPage(props: PageProps<"/perjalanan">) {
  const sp = await props.searchParams;
  const namaAsal =
    (typeof sp.asal === "string" && cariKota(sp.asal)?.nama) || LOKASI_BAWAAN;
  let namaTujuan =
    (typeof sp.tujuan === "string" && cariKota(sp.tujuan)?.nama) ||
    TUJUAN_BAWAAN;
  if (namaTujuan === namaAsal) {
    namaTujuan = namaAsal === TUJUAN_BAWAAN ? LOKASI_BAWAAN : TUJUAN_BAWAAN;
  }

  let peta;
  let awal;
  try {
    [peta, awal] = await Promise.all([muatPeta(), muatHalaman(namaAsal)]);
  } catch {
    return (
      <Gagal pesan="Data cuaca untuk seluruh kota tidak berhasil diambil, sehingga kondisi di sepanjang jalur tidak dapat ditampilkan." />
    );
  }

  const asal = peta.titik.find((t) => t.nama === namaAsal);
  const tujuan = peta.titik.find((t) => t.nama === namaTujuan);
  if (!asal || !tujuan) {
    return <Gagal pesan="Salah satu kota tidak ditemukan dalam daftar pantauan." />;
  }

  const singgahan = kotaDiJalur(asal, tujuan, peta.titik);
  const jam = jendelaBerangkat(awal.cuaca);
  const terbaik = jendelaTerbaik(jam);
  const persiapan = susunPersiapan(singgahan);
  const jarakTotal = singgahan[singgahan.length - 1].dariAsal;

  // Ruas terberat menentukan gambaran keseluruhan: perjalanan hanya
  // senyaman bagian terburuknya, jadi tidak dirata-ratakan.
  const terberat = singgahan.reduce((a, b) =>
    b.titik.skor.transportasi > a.titik.skor.transportasi ? b : a,
  );
  const tingkatJalur = tingkatDari(terberat.titik.skor.transportasi);

  const jumlahPeringatan = susunPeringatan(
    awal.cuaca,
    awal.kondisi,
    awal.sektor,
  ).length;
  const jamPerbarui = new Date(awal.cuaca.diambilPada).toLocaleTimeString(
    "id-ID",
    { hour: "2-digit", minute: "2-digit" },
  );

  return (
    <Kerangka
      kota={namaAsal}
      diperbaruiPada={jamPerbarui}
      jumlahPeringatan={jumlahPeringatan}
    >
      <div className="space-y-3">
        <div className="px-1 pt-2">
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
            Mode Perjalanan
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
            Pilih asal dan tujuan untuk melihat kondisi di kedua ujung, kota
            yang dilewati garis perjalanan, dan jam berangkat yang paling
            mendukung.
          </p>
        </div>

        <Card className="p-5">
          <PilihRute asal={namaAsal} tujuan={namaTujuan} />
        </Card>

        {/* Ringkasan jalur */}
        <Card
          className={
            terberat.titik.skor.transportasi >= 50
              ? "border-[color:var(--color-tingkat-tinggi)]/35 bg-tint-rose/25 p-5"
              : "p-5"
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[17px] font-extrabold tracking-tight text-ink">
              {namaAsal} → {namaTujuan}
            </h2>
            <span className="rounded-pill bg-surface px-2.5 py-1 text-[11.5px] font-bold text-ink-2">
              ± {jarakTotal} km garis lurus
            </span>
            <LencanaTingkat tingkat={tingkatJalur} />
          </div>

          <p className="mt-2.5 text-[14px] leading-relaxed text-ink-2">
            {terberat.titik.skor.transportasi >= 50 ? (
              <>
                <strong className="font-bold text-ink">
                  Ruas paling berisiko ada di sekitar {terberat.titik.nama}
                </strong>{" "}
                ({terberat.titik.labelCuaca.toLowerCase()}, hujan{" "}
                {terberat.titik.hujan24j} mm). Perjalanan hanya senyaman bagian
                terburuknya, jadi angka ini diambil dari ruas itu — bukan
                dirata-ratakan.
              </>
            ) : terberat.titik.skor.transportasi >= 25 ? (
              <>
                Secara umum perjalanan dapat ditempuh. Yang paling perlu
                diperhatikan ada di sekitar{" "}
                <strong className="font-bold text-ink">
                  {terberat.titik.nama}
                </strong>{" "}
                ({terberat.titik.labelCuaca.toLowerCase()}).
              </>
            ) : (
              <>
                Tidak ada ruas yang menunjukkan risiko berarti dari sisi cuaca.
                Kondisi terberat ada di sekitar {terberat.titik.nama}, dan itu
                pun masih tergolong rendah.
              </>
            )}
          </p>
        </Card>

        {/* min-w-0 wajib: tanpa itu strip 24 jam di kolom kanan menolak
            menyusut (min-width bawaan anak grid adalah auto) dan menjepit
            kolom kiri sampai tinggal beberapa puluh piksel. */}
        <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr]">
          <div className="min-w-0">
            <DaftarSinggahan singgahan={singgahan} jarakTotal={jarakTotal} />
          </div>
          <div className="min-w-0 space-y-3">
            <WaktuBerangkat jam={jam} terbaik={terbaik} kota={namaAsal} />
            <DaftarPersiapan persiapan={persiapan} />
          </div>
        </div>

        <Card className="flex gap-3 p-5">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-ink-3"
            strokeWidth={2.25}
            aria-hidden
          />
          <p className="text-[12px] leading-relaxed text-ink-2">
            <strong className="font-bold text-ink">Batasannya.</strong>{" "}
            CuacaKita tidak punya data jaringan jalan, kondisi aspal, maupun
            lalu lintas. Kota yang ditampilkan dipilih karena dekat dengan
            garis lurus antara asal dan tujuan — rute sebenarnya hampir pasti
            berbeda. Jarak yang disebut adalah jarak garis lurus, bukan jarak
            tempuh. Untuk rute, waktu tempuh, dan kepadatan jalan, gunakan
            aplikasi peta dengan lalu lintas langsung. Data cuaca{" "}
            {awal.cuaca.sumber.nama}, diambil pukul {jamPerbarui}.
          </p>
        </Card>
      </div>
    </Kerangka>
  );
}
