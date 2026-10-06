"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Jawaban } from "@/lib/impact/tanya";

/**
 * Tanya CuacaKita.
 *
 * Pertanyaannya sudah disiapkan, bukan kolom ketik bebas. Bagi pengunjung
 * yang baru pertama kali membuka situs cuaca, melihat pertanyaan yang
 * memang ada di kepalanya jauh lebih membantu daripada kursor berkedip
 * yang menunggu ia merumuskan sendiri pertanyaannya.
 */
export function TanyaCuacaKita({ jawaban }: { jawaban: Jawaban[] }) {
  const [buka, setBuka] = useState<string | null>(jawaban[0]?.id ?? null);

  return (
    <section
      aria-label="Tanya CuacaKita"
      className="rounded-card border border-line bg-surface shadow-tile"
    >
      <div className="flex items-center gap-2.5 border-b border-line p-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-tile bg-brand-50 text-brand-700">
          <MessageCircleQuestion className="size-4.5" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold tracking-tight text-ink">
            Tanya CuacaKita
          </h2>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-3">
            Pertanyaan yang sering ditanyakan, dijawab dari data di halaman ini
          </p>
        </div>
      </div>

      <ul className="divide-y divide-line">
        {jawaban.map((j) => {
          const aktif = buka === j.id;
          return (
            <li key={j.id}>
              <button
                type="button"
                onClick={() => setBuka(aktif ? null : j.id)}
                aria-expanded={aktif}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-2"
              >
                <span
                  className={cn(
                    "text-[13.5px] font-semibold",
                    aktif ? "text-brand-700" : "text-ink",
                  )}
                >
                  {j.pertanyaan}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-ink-3 transition-transform",
                    aktif && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>

              {aktif ? (
                <div className="bg-surface-2 px-5 pb-5 pt-1">
                  <p className="text-[13.5px] leading-relaxed text-ink">
                    {j.ringkas}
                  </p>

                  <ul className="mt-3 space-y-1">
                    {j.rincian.map((r) => (
                      <li
                        key={r}
                        className="flex gap-2 text-[12px] leading-snug text-ink-2"
                      >
                        <span
                          className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-3"
                          aria-hidden
                        />
                        {r}
                      </li>
                    ))}
                  </ul>

                  {j.tautan ? (
                    <Link
                      href={j.tautan.href}
                      className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-700 hover:underline"
                    >
                      {j.tautan.label}
                      <ArrowUpRight className="size-3.5" strokeWidth={2.75} aria-hidden />
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="border-t border-line px-5 py-3 text-[11px] leading-snug text-ink-3">
        Jawaban disusun dari rumus, bukan model bahasa — untuk data yang sama,
        kalimatnya akan selalu sama dan tidak akan menyebut angka yang tidak
        ada di sistem.
      </p>
    </section>
  );
}
