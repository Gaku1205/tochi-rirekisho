import RecordView from "@/components/RecordView";
import SiteFooter from "@/components/SiteFooter";
import TitleHero from "@/components/TitleHero";
import { DEFAULT_PLACE } from "@/lib/places";

export default function Home() {
  return (
    <>
      <TitleHero place={DEFAULT_PLACE} />
      <main>
        <RecordView place={DEFAULT_PLACE} headingLevel={2} />
      </main>
      <SiteFooter />
    </>
  );
}
