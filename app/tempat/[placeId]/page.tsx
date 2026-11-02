import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlaceDetailView } from "@/components/place-detail";
import { PLACE_ID_RE } from "@/lib/places/schema";

// Isi halaman adalah konten Google yang tidak boleh disalin ke indeks mesin pencari (PRD F-08, 11).
export const metadata: Metadata = {
  title: "Detail tempat | Ayo Makan",
  robots: { index: false, follow: false },
};

export default async function PlacePage({ params }: PageProps<"/tempat/[placeId]">) {
  const { placeId } = await params;
  if (!PLACE_ID_RE.test(placeId)) notFound();
  return (
    <Suspense fallback={null}>
      <PlaceDetailView id={placeId} />
    </Suspense>
  );
}
