import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";

const menu = [
  { label: "Rantai Dampak", href: "#rantai" },
  { label: "Modul", href: "#modul" },
  { label: "Sumber Data", href: "#sumber" },
];

export function LandingNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" aria-label="CuacaKita, beranda">
          <Logo tone="white" />
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden rounded-pill border border-white/10 bg-white/5 p-1 backdrop-blur-md lg:flex"
        >
          {menu.map((m) => (
            <a
              key={m.href}
              href={m.href}
              className="rounded-pill px-5 py-2 text-[13px] font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              {m.label}
            </a>
          ))}
        </nav>

        <ButtonLink href="/dashboard" variant="white" size="sm">
          Buka Dashboard
        </ButtonLink>
      </div>
    </header>
  );
}
