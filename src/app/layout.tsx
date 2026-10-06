import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// Hanya untuk satu kata aksen pada judul besar — tidak pernah untuk angka.
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CuacaKita — Tahu Cuacanya, Paham Dampaknya",
    template: "%s · CuacaKita",
  },
  description:
    "Pantau kondisi cuaca dan pahami dampaknya terhadap pertanian, harga pangan, perjalanan, lingkungan, dan risiko bencana.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3f9" },
    { media: "(prefers-color-scheme: dark)", color: "#070d18" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-theme="light"
      className={`${jakarta.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
