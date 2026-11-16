// トップの最初の1画面。1926年の地形図が画面いっぱいの景色になり、町名を映画の題名のように上下の端の札で読む。
import Link from "next/link";
import { StaticMap } from "./MapLayers";
import SearchForm from "./SearchForm";
import { OLD_MAP } from "@/lib/layers";
import { address, type Place } from "@/lib/places";

export default function TitleHero({ place }: { place: Place }) {
  return (
    <header className="hero">
      <StaticMap layer={OLD_MAP} center={place.at} zoom={14.6} fx={0.66} fy={0.42} className="hero-map shutter">
        <span className="map-pin hero-pin" style={{ left: "50%", top: "50%" }} aria-hidden="true" />
      </StaticMap>

      <nav className="hero-nav" aria-label="サイト">
        <Link href="/" className="hero-brand">
          土地の履歴書
        </Link>
        <a href="#similar">似た土地</a>
        <Link href="/about">使い方</Link>
      </nav>

      <h1 className="name plaque hero-town" aria-label={`${place.town}${place.block}の履歴書`}>
        {place.town}
      </h1>

      {/* この地点の札：緑の点から細い引き出しで結ぶ。要約だけ */}
      <a className="plaque hero-card" href="#record">
        <span className="sr-only">{address(place)}・1926年ごろの地形図。</span>
        <span className="hero-lead">{place.summary}</span>
      </a>

      <div className="hero-foot">
        <p className="name plaque hero-block" aria-hidden="true">
          {place.block}
        </p>
        <div className="plaque hero-ask">
          <p className="hero-hint">福岡市の住所で、その土地の履歴書を見る</p>
          <SearchForm className="hero-search" />
        </div>
      </div>
      <p className="plaque hero-credit">
        五万分の一地形図「FUKUOKA」米陸軍地図局 1945年刷り（もとは1926〜29年の日本の測量）。描いた絵ではなく本物の地図
      </p>
    </header>
  );
}
