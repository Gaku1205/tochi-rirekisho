import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StaticMap } from "@/components/MapLayers";
import SearchForm from "@/components/SearchForm";
import SiteFooter from "@/components/SiteFooter";
import { project } from "@/lib/geo";
import { ERA_INFO, OLD_MAP } from "@/lib/layers";
import { DEFAULT_PLACE, PLACES } from "@/lib/places";
import { searchAddress } from "@/lib/search";

export const metadata: Metadata = { title: "住所が見つかりません" };

const CENTER = { lat: 33.585, lon: 130.395 };
const ZOOM = 13.2;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";
  const r = searchAddress(q);
  if (r.kind === "found") redirect(`/tochi/${r.place.slug}`);
  const c = project(CENTER, ZOOM);

  return (
    <>
      <main className="lost">
        <nav className="hero-nav" aria-label="サイト">
          <Link href="/" className="hero-brand">
            土地の履歴書
          </Link>
          <Link href="/about">使い方</Link>
        </nav>
        <StaticMap layer={OLD_MAP} center={CENTER} zoom={ZOOM} fx={0.62} className="lost-map shutter">
          {PLACES.map((p, i) => {
            const pt = project(p.at, ZOOM);
            // 近くの札と重なるときは、印の下に出す
            const below = PLACES.some((q) => {
              if (q === p) return false;
              const o = project(q.at, ZOOM);
              return Math.abs(o.x - pt.x) < 120 && Math.abs(o.y - pt.y) < 48 && o.y < pt.y;
            });
            const dx = Math.abs(pt.x - c.x);
            const far = dx > 260 ? "map-mark-far" : dx > 130 ? "map-mark-mid" : "";
            return (
              <Link
                key={p.slug}
                href={`/tochi/${p.slug}`}
                className={`map-mark ${far} ${below ? "map-mark-below" : ""}`}
                data-reveal="fade"
                style={{
                  left: `calc(50% + ${pt.x - c.x}px)`,
                  top: `calc(50% + ${pt.y - c.y}px)`,
                  transitionDelay: `${0.6 + i * 0.08}s`,
                }}
              >
                {p.town}
                {p.block}
              </Link>
            );
          })}
        </StaticMap>
        <div className="plaque lost-card">
          <h1 className="name lost-title">
            {r.kind === "outside" ? "福岡市の外です" : q ? "見つかりません" : "住所を入れてください"}
          </h1>
          <p className="lost-text">
            {r.kind === "outside"
              ? `「${q}」は福岡市の外のようです。いま調べられるのは、福岡市の7区（東区・博多区・中央区・南区・城南区・早良区・西区）だけです。`
              : q
                ? `「${q}」の記録はまだありません。町名と丁目まで（例：南区大橋2丁目）入れるか、地図の上の札から選んでください。`
                : "町名と丁目まで（例：南区大橋2丁目）入れるか、地図の上の札から選んでください。"}
          </p>
          <SearchForm initial={q} />
          <p className="lost-count">
            いま調べられる町：<span className="yr">{PLACES.length}</span>
          </p>
          <Link href="/" className="lost-example">
            <StaticMap layer={ERA_INFO["1948"].layer} center={DEFAULT_PLACE.at} zoom={15.6} size={{ w: 480, h: 200 }}>
              <span className="map-pin" style={{ left: "50%", top: "50%" }} aria-hidden="true" />
            </StaticMap>
            <span className="plaque lost-example-cap">
              例：大橋2丁目の<span className="yr">1948</span>年
            </span>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
