import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Roboto } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import { PwaClient } from "@/components/pwa-client";
import { THEME_INIT_SCRIPT } from "@/lib/client/theme";
import "./globals.css";

// Satu keluarga font: Plus Jakarta Sans 800 untuk judul, 400/600 untuk teks (DESIGN.md 3).
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "600", "800"], variable: "--font-jakarta", display: "swap" });
// Hanya untuk atribusi teks Google Maps.
const roboto = Roboto({ subsets: ["latin"], weight: "400", variable: "--font-roboto", display: "swap" });

export const metadata: Metadata = {
  title: "Ayo Makan: cari tempat makan murah dekat kampus UIN Salatiga",
  description:
    "Cari tempat makan dan minum yang murah, dekat, dan ratingnya tinggi di sekitar UIN Salatiga. Rating dan ulasan dari Google Maps, rute sekali ketuk.",
  openGraph: {
    title: "Ayo Makan",
    description: "Tempat makan murah dan dekat kampus UIN Salatiga, rating dari Google Maps.",
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#B3261E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${roboto.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <a href="#konten" className="skip-link">Lewati ke konten</a>
        <Providers>
          {children}
          <PwaClient />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
