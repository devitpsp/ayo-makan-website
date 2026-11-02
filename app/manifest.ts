import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ayo Makan",
    short_name: "Ayo Makan",
    description: "Cari tempat makan murah dan dekat kampus UIN Salatiga, rating dari Google Maps.",
    lang: "id",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#B3261E",
    background_color: "#FFF7E8",
    // Ikon dari assets/brand (logo owner, PRD Q1).
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
