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

// Urutan dan headline dari PRD 10.6.1. Ayam geprek dan es teh dilepas (3 Nov 2026): hasil hapus latar fotonya kurang rapi. Tidak ada klaim harga, "paling enak", atau nama warung.
export const HERO_SLIDES: readonly HeroSlide[] = [
  { id: "seblak", badge: "SEBLAK", headline: "Pedasnya nampol, dompet nggak jebol", button: "Cari seblak di sekitar", keyword: "seblak", cat: "makanan", alt: "Semangkuk seblak", photo: "/hero/seblak.webp?v=2" },
  { id: "nasi-rames", badge: "NASI RAMES", headline: "Lauk pilih sendiri, tagihan tetap tahu diri", button: "Cari nasi rames di sekitar", keyword: "nasi rames", cat: "makanan", alt: "Sepiring nasi rames dengan lauk dan sayur", photo: "/hero/nasi-rames.webp?v=2" },
  { id: "mie-ayam", badge: "MIE AYAM", headline: "Mie ayam hangat, nugas jadi semangat", button: "Cari mie ayam di sekitar", keyword: "mie ayam", cat: "makanan", alt: "Semangkuk mie ayam", photo: "/hero/mie-ayam.webp?v=2" },
  { id: "bakso", badge: "BAKSO", headline: "Kuahnya panas, laparnya tuntas", button: "Cari bakso di sekitar", keyword: "bakso", cat: "makanan", alt: "Semangkuk bakso berkuah", photo: "/hero/bakso.webp?v=2" },
];
