/** Pemformatan angka & tanggal Indonesia, dipakai seluruh aplikasi. */

export function rupiah(value: number, opts?: { compact?: boolean }) {
  if (opts?.compact) {
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `Rp ${trimZero(value / 1_000_000_000)} M`;
    if (abs >= 1_000_000) return `Rp ${trimZero(value / 1_000_000)} jt`;
    if (abs >= 1_000) return `Rp ${trimZero(value / 1_000)} rb`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function trimZero(n: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n);
}

export function angka(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function tanggal(value: Date | string, gaya: "pendek" | "panjang" = "pendek") {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: gaya === "panjang" ? "long" : "short",
    year: "numeric",
  }).format(d);
}

export function jam(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
