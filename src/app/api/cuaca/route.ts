import { NextResponse } from "next/server";
import { z } from "zod";
import { muatHalaman, GagalAmbilCuaca } from "@/server/cuaca";

const Kueri = z.object({
  kota: z.string().trim().min(1).max(60).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hasil = Kueri.safeParse({ kota: searchParams.get("kota") ?? undefined });

  if (!hasil.success) {
    return NextResponse.json(
      { galat: "Parameter tidak valid", detail: hasil.error.issues },
      { status: 400 },
    );
  }

  try {
    const data = await muatHalaman(hasil.data.kota);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof GagalAmbilCuaca) {
      return NextResponse.json({ galat: e.message }, { status: 502 });
    }
    // Pesan galat internal tidak pernah dibocorkan ke klien.
    console.error("Gagal memuat data cuaca:", e);
    return NextResponse.json({ galat: "Terjadi kesalahan internal" }, { status: 500 });
  }
}
