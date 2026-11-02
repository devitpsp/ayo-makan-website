import type { Metadata } from "next";
import { FavoritesView } from "@/components/favorites-view";

export const metadata: Metadata = {
  title: "Favorit | Ayo Makan",
  robots: { index: false, follow: false },
};

export default function FavoritPage() {
  return <FavoritesView />;
}
