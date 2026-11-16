import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShareCard from "@/components/ShareCard";
import { PLACES, fullName, placeBySlug } from "@/lib/places";
import { findSimilar } from "@/lib/similar";

export function generateStaticParams() {
  return PLACES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = placeBySlug(slug);
  return { title: place ? `${fullName(place)}の画像` : "見つかりません" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = placeBySlug(slug);
  if (!place) notFound();
  return (
    <main>
      <ShareCard place={place} others={findSimilar(place, PLACES).map((s) => s.place)} />
    </main>
  );
}
