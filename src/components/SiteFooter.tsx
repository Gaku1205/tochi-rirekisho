// 終わり。福岡市全体の古い地形図の上に、名前と出どころの札。
import Link from "next/link";
import { StaticMap } from "./MapLayers";
import { OLD_MAP } from "@/lib/layers";

export default function SiteFooter() {
  return (
    <footer className="foot">
      <StaticMap layer={OLD_MAP} center={{ lat: 33.592, lon: 130.392 }} zoom={13.4} className="foot-map" />
      <nav className="plaque foot-links" aria-label="フッター">
        <Link href="/">大橋2丁目の例</Link>
        <Link href="/about">このサービスについて</Link>
        <Link href="/about#sources">データの出どころ</Link>
      </nav>
      <p className="plaque foot-note">
        調べられるのは福岡市の7区だけです。地図：五万分の一地形図「FUKUOKA」（1945年刷り）パブリックドメイン／地理院タイル（国土地理院）
      </p>
      <p className="name plaque foot-name">土地の履歴書</p>
    </footer>
  );
}
