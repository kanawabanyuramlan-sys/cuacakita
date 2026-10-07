"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Check,
  Info,
  Pencil,
  Sprout,
  TriangleAlert,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { BilahSkor, LencanaTingkat } from "@/components/ui/tingkat";
import type { Kondisi } from "@/lib/impact/engine";
import { KOMODITAS } from "@/lib/impact/komoditas";
import {
  FASE,
  LABEL_FASE,
  hitungRisikoPetani,
  namaFase,
  susunCatatanPetani,
  type FaseTanam,
  type JadwalKerja,
  type NilaiHari,
} from "@/lib/impact/petani";

/**
 * Mode Petani.
 *
 * Pilihan komoditas disimpan di penyimpanan peramban pengguna sendiri —
 * tanpa akun, tanpa basis data, dan tidak satu pun datanya dikirim ke
 * server. Konsekuensinya jujur: pilihan hanya berlaku di perangkat dan
 * peramban itu, dan hilang bila riwayat peramban dibersihkan. Itu
 * disampaikan di layar, bukan disembunyikan.
 *
 * Setiap pembacaan dibungkus try/catch karena penyimpanan peramban dapat
 * dilarang di mode penyamaran atau ketika data situs diblokir.
 */

const KUNCI = "cuacakita.petani.v1";

type Pilihan = { id: string; fase: FaseTanam };

/* Penyimpanan peramban dibungkus sebagai sumber data luar supaya React
   membacanya lewat useSyncExternalStore. Membacanya di dalam useEffect lalu
   memanggil setState akan menimbulkan satu render tambahan yang terlihat
   sebagai kedipan, dan memang ditolak aturan lint React. */
const pendengar = new Set<() => void>();

function berlangganan(ubah: () => void) {
  pendengar.add(ubah);
  // Pilihan ikut tersinkron bila pengguna membukanya di dua tab sekaligus.
  window.addEventListener("storage", ubah);
  return () => {
    pendengar.delete(ubah);
    window.removeEventListener("storage", ubah);
  };
}

function kabari() {
  for (const cb of pendengar) cb();
}

/** Mengembalikan teks mentah, bukan hasil urai — nilainya harus stabil
 *  antar-panggilan, dan larik baru setiap kali akan memicu render tanpa henti. */
function cuplikan(): string | null {
  try {
    return localStorage.getItem(KUNCI);
  } catch {
    return null;
  }
}

const cuplikanServer = (): string | null => null;

/** Dipakai untuk tahu kapan hidrasi selesai, tanpa menyentuh effect. */
const takBerubah = () => () => {};
const diKlien = () => true;
const diServer = () => false;

function urai(mentah: string | null): Pilihan[] {
  try {
    if (!mentah) return [];
    const j = JSON.parse(mentah) as { komoditas?: unknown };
    if (!Array.isArray(j.komoditas)) return [];
    // Saring terhadap daftar komoditas yang benar-benar ada, supaya
    // pilihan lama tidak menabrak perubahan daftar di kemudian hari.
    return j.komoditas.flatMap((x): Pilihan[] => {
      if (typeof x !== "object" || x === null) return [];
      const o = x as { id?: unknown; fase?: unknown };
      if (typeof o.id !== "string" || !KOMODITAS.some((k) => k.id === o.id)) return [];
      const fase = FASE.includes(o.fase as FaseTanam)
        ? (o.fase as FaseTanam)
        : "vegetatif";
      return [{ id: o.id, fase }];
    });
  } catch {
    return [];
  }
}

function tulis(pilihan: Pilihan[]) {
  let berhasil = true;
  try {
    localStorage.setItem(KUNCI, JSON.stringify({ komoditas: pilihan }));
  } catch {
    berhasil = false;
  }
  kabari();
  return berhasil;
}

/* ── Komponen utama ───────────────────────────────────────────────── */

export function ModePetani({
  kondisi,
  jadwal,
  kota,
}: {
  kondisi: Kondisi;
  jadwal: JadwalKerja[];
  kota: string;
}) {
  const mentah = useSyncExternalStore(berlangganan, cuplikan, cuplikanServer);
  const sudahDiKlien = useSyncExternalStore(takBerubah, diKlien, diServer);
  const pilihan = useMemo(() => urai(mentah), [mentah]);

  const [sedangUbah, setSedangUbah] = useState(false);
  const [gagalSimpan, setGagalSimpan] = useState(false);

  function simpan(baru: Pilihan[]) {
    setGagalSimpan(!tulis(baru));
    setSedangUbah(false);
  }

  // Selama hidrasi belum selesai, penyimpanan peramban belum terbaca.
  // Menampilkan pemilih di sini akan membuatnya berkedip bagi pengguna
  // yang sebenarnya sudah punya pilihan tersimpan.
  if (!sudahDiKlien) {
    return (
      <Card className="flex h-48 items-center justify-center">
        <p className="text-[13px] font-semibold text-ink-3">Memuat pilihan…</p>
      </Card>
    );
  }

  if (pilihan.length === 0 || sedangUbah) {
    return (
      <PilihKomoditas
        awal={pilihan}
        onSimpan={simpan}
        onBatal={pilihan.length > 0 ? () => setSedangUbah(false) : undefined}
      />
    );
  }

  return (
    <TampilanPetani
      pilihan={pilihan}
      kondisi={kondisi}
      jadwal={jadwal}
      kota={kota}
      gagalSimpan={gagalSimpan}
      onUbah={() => setSedangUbah(true)}
      onHapus={() => simpan([])}
    />
  );
}

/* ── Pemilihan komoditas dan fase ─────────────────────────────────── */

function PilihKomoditas({
  awal,
  onSimpan,
  onBatal,
}: {
  awal: Pilihan[];
  onSimpan: (p: Pilihan[]) => void;
  onBatal?: () => void;
}) {
  const [dipilih, setDipilih] = useState<Pilihan[]>(awal);

  const togel = (id: string) =>
    setDipilih((d) =>
      d.some((x) => x.id === id)
        ? d.filter((x) => x.id !== id)
        : [...d, { id, fase: "vegetatif" as FaseTanam }],
    );

  const ubahFase = (id: string, fase: FaseTanam) =>
    setDipilih((d) => d.map((x) => (x.id === id ? { ...x, fase } : x)));

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-tile bg-tint-mint text-tint-mint-ink">
          <Sprout className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <div>
          <h2 className="text-[17px] font-extrabold tracking-tight text-ink">
            Apa yang Anda tanam?
          </h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-2">
            Pilih satu atau beberapa komoditas, lalu tentukan tahapnya saat ini.
            CuacaKita akan menyesuaikan penilaian dan jadwal kerja kebun dengan
            pilihan itu.
          </p>
        </div>
      </div>

      {/* Daftar komoditas */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {KOMODITAS.map((k) => {
          const aktif = dipilih.some((x) => x.id === k.id);
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => togel(k.id)}
              aria-pressed={aktif}
              className={cn(
                "flex items-center gap-3 rounded-tile border p-3 text-left transition-colors",
                aktif
                  ? "border-brand-400 bg-brand-50"
                  : "border-line bg-surface hover:border-line-strong",
              )}
            >
              <span className="text-xl leading-none" aria-hidden>
                {k.ikon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-ink">
                  {k.nama}
                </span>
                <span className="block text-[11px] capitalize text-ink-3">
                  {k.jenis}
                </span>
              </span>
              {aktif ? (
                <Check className="size-4 shrink-0 text-brand-600" strokeWidth={3} aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Fase untuk tiap komoditas terpilih */}
      {dipilih.length > 0 ? (
        <div className="mt-5 rounded-tile bg-surface-2 p-4">
          <p className="text-[12.5px] font-extrabold text-ink">
            Tahap masing-masing saat ini
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-3">
            Tahap sangat menentukan. Hujan yang sama bisa tidak berarti apa-apa
            pada masa tumbuh, tetapi merugikan saat berbunga atau panen.
          </p>

          <ul className="mt-3 space-y-2">
            {dipilih.map((p) => {
              const k = KOMODITAS.find((x) => x.id === p.id)!;
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 rounded-tile bg-surface p-2.5"
                >
                  <span className="text-base leading-none" aria-hidden>
                    {k.ikon}
                  </span>
                  <span className="min-w-[88px] flex-1 text-[13px] font-bold text-ink">
                    {k.nama}
                  </span>
                  <label className="sr-only" htmlFor={`fase-${p.id}`}>
                    Tahap {k.nama}
                  </label>
                  <select
                    id={`fase-${p.id}`}
                    value={p.fase}
                    onChange={(e) => ubahFase(p.id, e.target.value as FaseTanam)}
                    className="rounded-pill border border-line bg-surface px-3 py-1.5 text-[12.5px] font-semibold text-ink outline-none hover:border-line-strong focus:border-brand-400"
                  >
                    {FASE.map((f) => (
                      <option key={f} value={f}>
                        {namaFase(p.id, f)}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={dipilih.length === 0}
          onClick={() => onSimpan(dipilih)}
          className="inline-flex h-11 items-center rounded-pill bg-brand-600 px-6 text-[14px] font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        >
          Simpan pilihan
        </button>
        {onBatal ? (
          <button
            type="button"
            onClick={onBatal}
            className="inline-flex h-11 items-center rounded-pill border border-line-strong px-5 text-[14px] font-semibold text-ink transition-colors hover:border-brand-400"
          >
            Batal
          </button>
        ) : null}
        <p className="text-[11.5px] text-ink-3">
          Disimpan di peramban ini saja — tidak dikirim ke mana pun.
        </p>
      </div>
    </Card>
  );
}

/* ── Tampilan setelah memilih ─────────────────────────────────────── */

const gayaHari: Record<NilaiHari, string> = {
  baik: "bg-tint-mint text-tint-mint-ink",
  sedang: "bg-tint-sun text-tint-sun-ink",
  buruk: "bg-tint-rose text-tint-rose-ink",
};

function TampilanPetani({
  pilihan,
  kondisi,
  jadwal,
  kota,
  gagalSimpan,
  onUbah,
  onHapus,
}: {
  pilihan: Pilihan[];
  kondisi: Kondisi;
  jadwal: JadwalKerja[];
  kota: string;
  gagalSimpan: boolean;
  onUbah: () => void;
  onHapus: () => void;
}) {
  const risiko = useMemo(
    () => hitungRisikoPetani(kondisi, pilihan),
    [kondisi, pilihan],
  );
  const catatan = useMemo(
    () => susunCatatanPetani(kondisi, risiko),
    [kondisi, risiko],
  );

  return (
    <div className="space-y-3">
      {gagalSimpan ? (
        <Card className="flex gap-3 border-[color:var(--color-tingkat-sedang)]/40 bg-tint-sun/35 p-4">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-[color:var(--color-tingkat-sedang)]"
            strokeWidth={2.5}
            aria-hidden
          />
          <p className="text-[12.5px] leading-relaxed text-ink-2">
            Pilihan tidak dapat disimpan di peramban ini — kemungkinan
            penyimpanan situs sedang diblokir atau Anda memakai mode
            penyamaran. Pilihan tetap berlaku selama halaman ini terbuka,
            tetapi akan hilang setelah ditutup.
          </p>
        </Card>
      ) : null}

      {/* Komoditas pilihan */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-extrabold tracking-tight text-ink">
              Kebun Anda di {kota}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-2">
              {risiko.length} komoditas, dinilai menurut tahapnya masing-masing
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onUbah}
              className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3.5 py-2 text-[12.5px] font-bold text-ink-2 transition-colors hover:border-brand-400 hover:text-brand-700"
            >
              <Pencil className="size-3.5" strokeWidth={2.5} aria-hidden />
              Ubah
            </button>
            <button
              type="button"
              onClick={onHapus}
              className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3.5 py-2 text-[12.5px] font-bold text-ink-3 transition-colors hover:border-[color:var(--color-tingkat-tinggi)] hover:text-[color:var(--color-tingkat-tinggi)]"
            >
              <Trash2 className="size-3.5" strokeWidth={2.5} aria-hidden />
              Hapus
            </button>
          </div>
        </div>

        <ul className="mt-4 grid gap-2.5 md:grid-cols-2">
          {risiko.map((r, i) => (
            <li
              key={r.komoditas.id}
              style={{ "--tunda": `${i * 50}ms` } as React.CSSProperties}
              className="muncul rounded-tile border border-line bg-surface-2 p-3.5"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl leading-none" aria-hidden>
                  {r.komoditas.ikon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-extrabold text-ink">
                      {r.komoditas.nama}
                    </span>
                    <span className="rounded-pill bg-surface px-2 py-0.5 text-[10.5px] font-bold text-ink-2">
                      {r.namaFase}
                    </span>
                    <LencanaTingkat tingkat={r.tingkat} />
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
                    {r.penyebab ?? "Tidak ada tekanan cuaca yang menonjol."}
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-[18px] font-extrabold leading-none tabular-nums text-ink">
                    {r.skor}
                  </span>
                  {r.skor !== r.skorDasar ? (
                    <span className="block text-[10px] text-ink-3">
                      dasar {r.skorDasar}
                    </span>
                  ) : null}
                </span>
              </div>
              <BilahSkor
                skor={r.skor}
                tingkat={r.tingkat}
                label={r.komoditas.nama}
                className="mt-2.5"
              />
              <p className="mt-2 text-[11px] leading-snug text-ink-3">
                {LABEL_FASE[r.fase].catatan}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Catatan khusus */}
      <Card className="p-5">
        <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
          Yang perlu diperhatikan
        </h2>
        <ul className="mt-3 space-y-2">
          {catatan.map((c) => (
            <li
              key={c.komoditas + c.pesan.slice(0, 20)}
              className={cn(
                "flex gap-3 rounded-tile border p-3.5",
                c.nada === "tenang"
                  ? "border-[color:var(--color-tingkat-rendah)]/25 bg-tint-mint/30"
                  : "border-line bg-surface-2",
              )}
            >
              <span className="text-lg leading-none" aria-hidden>
                {c.ikon}
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink">{c.komoditas}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">
                  {c.pesan}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* Jadwal kerja kebun */}
      <Card className="p-5">
        <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
          Kapan waktunya?
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
          Tujuh hari ke depan dinilai untuk lima pekerjaan kebun. Hijau berarti
          mendukung, merah berarti sebaiknya ditunda.
        </p>

        <div className="mt-4 space-y-4">
          {jadwal.map((j) => (
            <div key={j.id}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-base leading-none" aria-hidden>
                  {j.ikon}
                </span>
                <span className="text-[13.5px] font-extrabold text-ink">
                  {j.nama}
                </span>
                {j.terbaik ? (
                  <span className="rounded-pill bg-tint-mint px-2 py-0.5 text-[11px] font-bold text-tint-mint-ink">
                    Paling baik: {j.terbaik.label}
                  </span>
                ) : (
                  <span className="rounded-pill bg-tint-rose px-2 py-0.5 text-[11px] font-bold text-tint-rose-ink">
                    Tidak ada hari yang mendukung minggu ini
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
                {j.keterangan}
              </p>

              <ul className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {j.hari.map((h) => (
                  <li
                    key={h.tanggal}
                    title={h.alasan}
                    className={cn(
                      "min-w-[74px] flex-1 rounded-tile p-2 text-center",
                      gayaHari[h.nilai],
                      h.hariIni && "ring-2 ring-brand-400",
                    )}
                  >
                    <span className="block text-[10.5px] font-bold">
                      {h.label}
                    </span>
                    <span className="mt-0.5 block text-[15px] font-extrabold leading-none tabular-nums">
                      {h.skor}
                    </span>
                  </li>
                ))}
              </ul>

              {j.terbaik ? (
                <p className="mt-1.5 text-[11.5px] leading-snug text-ink-2">
                  <strong className="font-bold text-ink">{j.terbaik.label}:</strong>{" "}
                  {j.terbaik.alasan}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      {/* Batasan */}
      <Card className="flex gap-3 p-5">
        <Info className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={2.25} aria-hidden />
        <p className="text-[12px] leading-relaxed text-ink-2">
          <strong className="font-bold text-ink">Batasannya.</strong> Penilaian
          di halaman ini disusun dari praktik budidaya yang umum diketahui —
          bukan rekomendasi agronomi resmi dan bukan pengganti penyuluh
          pertanian. Varietas, umur tanaman, jenis tanah, serta jenis pupuk dan
          obat yang dipakai sangat memengaruhi hasil sebenarnya, dan tidak satu
          pun diperhitungkan di sini. Anda yang mengenal lahan sendiri tetap
          pemegang keputusan. Pilihan komoditas disimpan di peramban ini saja
          dan tidak dikirim ke mana pun.
        </p>
      </Card>
    </div>
  );
}
