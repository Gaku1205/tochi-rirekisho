import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RecordView from "@/components/RecordView";
import SiteFooter from "@/components/SiteFooter";
import { PLACES, fullName, placeBySlug } from "@/lib/places";

export function generateStaticParams() {
  return PLACES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const place = placeBySlug(slug);
  return { title: place ? `${fullName(place)}の履歴書` : "見つかりません" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = placeBySlug(slug);
  if (!place) notFound();
  return (
    <>
      <main>
        <RecordView place={place} />
      </main>
      <SiteFooter />
    </>
  );
}
