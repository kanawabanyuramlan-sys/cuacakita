"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/logo";
import { PemilihLokasi } from "./pemilih-lokasi";

const menu = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Peta", href: "/peta" },
  { label: "Histori", href: "/histori" },
];

export function Topbar({ kota }: { kota: string }) {
  const pathname = usePathname();
  const [gelap, setGelap] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = gelap ? "dark" : "light";
  }, [gelap]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="CuacaKita, beranda" className="shrink-0">
          <Logo />
        </Link>

        <nav
          aria-label="Navigasi aplikasi"
          className="order-3 flex w-full gap-1 rounded-pill border border-line bg-surface p-1 shadow-tile sm:order-none sm:ml-2 sm:w-auto"
        >
          {menu.map((m) => {
            const aktif = pathname === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "flex-1 rounded-pill px-4 py-1.5 text-center text-[13px] font-semibold transition-colors sm:flex-none",
                  aktif
                    ? "bg-brand-600 text-white"
                    : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                {m.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <PemilihLokasi terpilih={kota} />
          <button
            type="button"
            onClick={() => setGelap((v) => !v)}
            aria-pressed={gelap}
            className="flex size-11 shrink-0 items-center justify-center rounded-pill border border-line bg-surface text-ink-2 shadow-tile transition-colors hover:text-ink"
          >
            {gelap ? (
              <Sun className="size-4" strokeWidth={2.25} aria-hidden />
            ) : (
              <Moon className="size-4" strokeWidth={2.25} aria-hidden />
            )}
            <span className="sr-only">
              {gelap ? "Beralih ke tema terang" : "Beralih ke tema gelap"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
