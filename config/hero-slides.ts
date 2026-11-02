import type { Category } from "@/lib/places/types";

export interface HeroSlide {
  id: string;
  /** Teks di badge ledakan. */
  badge: string;
  headline: string;
  button: string;
  keyword: string;
  cat: Category;
  /** Deskripsi foto untuk alt (menggambarkan hidangan, bukan warung tertentu). */
  alt: string;
  /** Foto cutout milik Ayo Makan di /public/hero (WebP). Null = slot placeholder. Sumber PNG asli di assets/hero-source. */
  photo: string | null;
}

// Urutan dan headline dari PRD 10.6.1. Tidak ada klaim harga, "paling enak", atau nama warung.
export const HERO_SLIDES: readonly HeroSlide[] = [
  { id: "seblak", badge: "SEBLAK", headline: "Pedasnya nampol, dompet nggak jebol", button: "Cari seblak di sekitar", keyword: "seblak", cat: "makanan", alt: "Semangkuk seblak", photo: "/hero/seblak.webp" },
  { id: "nasi-rames", badge: "NASI RAMES", headline: "Lauk pilih sendiri, tagihan tetap tahu diri", button: "Cari nasi rames di sekitar", keyword: "nasi rames", cat: "makanan", alt: "Sepiring nasi rames dengan lauk dan sayur", photo: "/hero/nasi-rames.webp" },
  { id: "mie-ayam", badge: "MIE AYAM", headline: "Mie ayam hangat, nugas jadi semangat", button: "Cari mie ayam di sekitar", keyword: "mie ayam", cat: "makanan", alt: "Semangkuk mie ayam", photo: "/hero/mie-ayam.webp" },
  { id: "bakso", badge: "BAKSO", headline: "Kuahnya panas, laparnya tuntas", button: "Cari bakso di sekitar", keyword: "bakso", cat: "makanan", alt: "Semangkuk bakso berkuah", photo: "/hero/bakso.webp" },
  { id: "ayam-geprek", badge: "AYAM GEPREK", headline: "Pilih level sambalnya, cek ratingnya dulu", button: "Cari ayam geprek di sekitar", keyword: "ayam geprek", cat: "makanan", alt: "Ayam geprek dengan sambal di atasnya", photo: "/hero/ayam-geprek.webp" },
  { id: "es-teh", badge: "ES TEH", headline: "Es teh manis, hausnya habis", button: "Cari es teh di sekitar", keyword: "es teh", cat: "minuman", alt: "Segelas es teh dengan es batu", photo: "/hero/es-teh.webp" },
];
