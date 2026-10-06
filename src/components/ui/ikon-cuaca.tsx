import { cn } from "@/lib/cn";
import type { KategoriCuaca } from "@/lib/weather/wmo";

/**
 * Ikon cuaca bergradien lembut.
 *
 * Digambar sebagai SVG sebaris, bukan berkas gambar: ikut berganti warna
 * mengikuti tema, tajam pada ukuran berapa pun, dan tidak menambah satu
 * permintaan jaringan pun. Gerakannya halus dan otomatis berhenti bila
 * pengguna meminta pengurangan animasi (diatur di globals.css).
 */

export function IkonCuaca({
  kategori,
  siang = true,
  className,
}: {
  kategori: KategoriCuaca;
  siang?: boolean;
  className?: string;
}) {
  // Id gradien sengaja deterministik, bukan dari useId: isinya identik di
  // setiap pemakaian, jadi berbagi satu definisi aman — dan komponen ini
  // tetap bisa dirender di server tanpa "use client".
  const gMatahari = siang ? "ck-surya-siang" : "ck-surya-malam";
  const gAwan = "ck-awan";
  const gAwanGelap = "ck-awan-gelap";

  const adaMatahari =
    kategori === "cerah" || kategori === "cerah-berawan";
  const adaAwan = kategori !== "cerah";
  const awanGelap =
    kategori === "hujan" || kategori === "hujan-lebat" || kategori === "badai";
  const tetes =
    kategori === "gerimis" ? 2 : kategori === "hujan" ? 3 : kategori === "hujan-lebat" ? 4 : 0;

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-16", className)}
      role="img"
      aria-label={`Ilustrasi cuaca: ${kategori.replace("-", " ")}`}
    >
      <defs>
        <linearGradient id={gMatahari} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={siang ? "#FFD95E" : "#CBD9EC"} />
          <stop offset="100%" stopColor={siang ? "#FF9F43" : "#8FA6C4"} />
        </linearGradient>
        <linearGradient id={gAwan} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D5E3F2" />
        </linearGradient>
        <linearGradient id={gAwanGelap} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#B9C9DC" />
          <stop offset="100%" stopColor="#8296AE" />
        </linearGradient>
      </defs>

      {/* Pendar lembut di balik matahari */}
      {adaMatahari && siang ? (
        <circle
          cx={adaAwan ? 41 : 32}
          cy={adaAwan ? 21 : 32}
          r="15"
          fill={`url(#${gMatahari})`}
          opacity="0.18"
          className="animate-denyut origin-center"
        />
      ) : null}

      {/* Matahari atau bulan */}
      {adaMatahari ? (
        siang ? (
          <circle
            cx={adaAwan ? 41 : 32}
            cy={adaAwan ? 21 : 32}
            r={adaAwan ? 10 : 13}
            fill={`url(#${gMatahari})`}
          />
        ) : (
          <path
            d="M40 12a13 13 0 1 0 12 17 10.5 10.5 0 0 1-12-17Z"
            fill={`url(#${gMatahari})`}
          />
        )
      ) : null}

      {/* Sinar matahari saat benar-benar cerah */}
      {kategori === "cerah" && siang
        ? Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={32 + Math.cos(a) * 18}
                y1={32 + Math.sin(a) * 18}
                x2={32 + Math.cos(a) * 23}
                y2={32 + Math.sin(a) * 23}
                stroke="#FFC13D"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })
        : null}

      {/* Awan */}
      {adaAwan ? (
        <path
          d="M19 44a9.5 9.5 0 0 1 1.3-18.9 13.5 13.5 0 0 1 25.6-3.2A11.4 11.4 0 0 1 49.5 44H19Z"
          fill={`url(#${awanGelap ? gAwanGelap : gAwan})`}
        />
      ) : null}

      {/* Kabut */}
      {kategori === "kabut"
        ? [0, 1, 2].map((i) => (
            <line
              key={i}
              x1="14"
              y1={49 + i * 5}
              x2="50"
              y2={49 + i * 5}
              stroke="#AFC2D6"
              strokeWidth="3"
              strokeLinecap="round"
              opacity={1 - i * 0.25}
            />
          ))
        : null}

      {/* Tetes hujan */}
      {Array.from({ length: tetes }).map((_, i) => (
        <line
          key={i}
          x1={22 + i * 8}
          y1={48}
          x2={19 + i * 8}
          y2={56 + (i % 2) * 3}
          stroke="#4A9BE8"
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.9}
        />
      ))}

      {/* Petir */}
      {kategori === "badai" ? (
        <path
          d="M33 46l-8 11h6l-3 9 11-13h-6l4-7h-4Z"
          fill="#FFC13D"
          stroke="#F59E0B"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      ) : null}

      {/* Salju */}
      {kategori === "salju"
        ? [0, 1, 2].map((i) => (
            <circle key={i} cx={23 + i * 9} cy={52 + (i % 2) * 4} r="2.6" fill="#CFE4F7" />
          ))
        : null}
    </svg>
  );
}
