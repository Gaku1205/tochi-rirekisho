import type { Metadata } from "next";
import Link from "next/link";
import { StaticMap } from "@/components/MapLayers";
import SiteFooter from "@/components/SiteFooter";
import { project } from "@/lib/geo";
import { ERA_INFO, ERAS, NOW_MAP, OLD_MAP, OLD_MAP_WHOLE } from "@/lib/layers";
import { DEFAULT_PLACE, PLACES } from "@/lib/places";

export const metadata: Metadata = { title: "このサービスについて" };

type Source = { name: string; who: string; text: string };

const SOURCES: { group: string; items: Source[] }[] = [
  {
    group: "地図と空中写真",
    items: [
      {
        name: "五万分の一地形図「FUKUOKA」",
        who: "米陸軍地図局 1945年",
        text: "1926〜29年の日本の測量をもとに刷られた地形図。パブリックドメイン（Wikimedia Commons）。",
      },
      { name: "空中写真 1945〜1950年", who: "国土地理院", text: "米軍が撮影した空中写真。地理院タイルで使う。" },
      { name: "国土画像情報 1974〜1978年", who: "国土地理院", text: "カラーの空中写真。田が家に変わる途中が写る。" },
      { name: "標準地図・全国最新写真", who: "国土地理院", text: "いまの地図と写真。地理院タイル。" },
    ],
  },
  {
    group: "浸水と地盤",
    items: [
      { name: "洪水浸水想定区域", who: "国土数値情報・福岡市", text: "想定しうる最大規模の雨で川があふれたときの深さ。" },
      { name: "土地条件図", who: "国土地理院", text: "低地・台地・丘・埋め立て地など、土地のでき方。" },
    ],
  },
  {
    group: "地価",
    items: [{ name: "地価公示", who: "国土交通省 2016・2026年", text: "町にいちばん近い地点の1㎡あたりの価格と、10年の変化。" }],
  },
  {
    group: "AIの読み解き",
    items: [
      {
        name: "要約の文",
        who: "LLM（無料枠）",
        text: "上の記録を年代ごとの事実の表にしてから渡し、表に無いことは書かせない。結論を1〜2文で先に。",
      },
      {
        name: "似た土地",
        who: "このサービスの計算",
        text: "昔の土地の使われ方・浸水・地盤・川の近さを並べ、重みつきの距離で近い順に。",
      },
    ],
  },
];

/** 市の全体の地図の中心とズーム（12の町がみな入り、左の札の分だけ西に寄せる） */
const CITY = { lat: 33.581, lon: 130.366 };
const CITY_ZOOM = 13.1;
/** 札を点の左に出す町（となりの町の札と重ならないように） */
const LABEL_LEFT = new Set(["ohashi-2", "nagaoka-3", "nishijin-4", "befu-3", "itazuke-3"]);

export default function About() {
  const p = DEFAULT_PLACE;
  const c = project(CITY, CITY_ZOOM);
  return (
    <>
      <main className="about">
        <nav className="bar about-bar" aria-label="サイト">
          <Link href="/" className="bar-home">
            土地の履歴書
          </Link>
          <Link href="/" className="bar-example">
            大橋2丁目の例
          </Link>
          <a href="#sources">データの出どころ</a>
        </nav>

        <header className="about-head">
          <h1 className="name about-title">このサービスについて</h1>
          <p className="about-lead">
            福岡市の住所を入れると、1926年ごろの地形図・1948年と1975年の空中写真・いまの地図を同じ場所で重ね、浸水・地盤・地価の公開データと合わせて、その土地の履歴書を1枚にします。登録はいりません。
          </p>
        </header>

        <section className="layers" aria-labelledby="layers-h">
          <h2 id="layers-h" className="about-h2" data-reveal="rise">
            大橋2丁目の、4つの年代
          </h2>
          <div className="layers-band shutter">
            {ERAS.map((e) => {
              const info = ERA_INFO[e];
              const layer = e === "2026" ? NOW_MAP : info.layer;
              return (
                <figure key={e} className={`layer-panel layer-${e}`} data-reveal="wipe">
                  <StaticMap layer={layer} center={p.at} zoom={15.4} size={{ w: 900, h: 900 }}>
                    <span className="map-pin" style={{ left: "50%", top: "50%" }} aria-hidden="true" />
                  </StaticMap>
                  <figcaption className="plaque layer-cap">
                    <span className="yr">{e}</span>
                    <span>{e === "2026" ? "いまの地図" : info.label.replace(/^\d+年ごろの/, "")}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
          <p className="layers-note" data-reveal="rise">
            同じ地点（大橋2丁目、緑の印）を、同じ縮尺で切り出した物。1926年は田の記号、1948年は田の区画、1975年は家の屋根、いまは住宅地の地図。
          </p>
        </section>

        <section className="howto" aria-labelledby="howto-h">
          <figure className="howto-map" data-reveal="wipe">
            <div className="howto-view" aria-hidden="true">
              <StaticMap layer={NOW_MAP} center={p.at} zoom={15.4} size={{ w: 1000, h: 900 }}>
                <span className="map-pin" style={{ left: "50%", top: "50%" }} />
              </StaticMap>
              <div className="howto-old">
                <StaticMap layer={OLD_MAP} center={p.at} zoom={15.4} size={{ w: 1000, h: 900 }}>
                  <span className="map-pin" style={{ left: "50%", top: "50%" }} />
                </StaticMap>
              </div>
              <span className="howto-split" />
              <span className="howto-knob">↔</span>
              <span className="btn howto-save">縦長の画像で保存</span>
              <span className="howto-strip">
                {ERAS.map((e) => (
                  <span key={e} className={e === "1926" ? "on" : undefined}>
                    <span className="yr">{e}</span>
                  </span>
                ))}
              </span>
            </div>
            <figcaption className="sr-only">大橋2丁目の地図。左が1926年ごろの地形図、右がいまの地図</figcaption>
            <p className="plaque howto-note howto-note-split">
              地図の黒い境目を指でずらすと、左に昔、右にいまの地図が出ます。拡大・縮小は指でつまむか、＋と−のボタンで。
            </p>
            <p className="plaque howto-note howto-note-strip">
              下の年代のボタンで、左の地図が1926・1948・1975・2026年に替わります。
            </p>
            <p className="plaque howto-note howto-note-save">
              「縦長の画像で保存」を押すと、スマホの画面くらいの1枚の画像に。部屋探しの相手や家族に、そのまま送れます。
            </p>
          </figure>

          <div className="howto-side">
            <h2 id="howto-h" className="name howto-title" data-reveal="rise">
              使い方
            </h2>
            <p className="howto-lead" data-reveal="rise">
              住所欄に、福岡市の町名と丁目までを入れて「調べる」を押します（例：南区大橋2丁目）。地図・公開データ・AIの要約が全部そろってから、履歴書が一度に出ます。
            </p>
            <figure className="howto-photo" data-reveal="wipe">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/photos/view-of-ohashi-station-fukuoka.jpg"
                alt="西鉄大橋駅の駅舎と、駅前の広場"
                width={1920}
                height={1440}
                loading="lazy"
              />
              <figcaption className="plaque">西鉄大橋駅の駅前（2015年）。1926年の地形図では、このあたりは田んぼと小さな集落だった。</figcaption>
            </figure>
          </div>
        </section>

        <section className="towns" aria-labelledby="towns-h">
          <StaticMap layer={OLD_MAP_WHOLE} center={CITY} zoom={CITY_ZOOM} size={{ w: 2000, h: 1300 }} className="towns-map">
            {PLACES.map((t) => {
              const q = project(t.at, CITY_ZOOM);
              return (
                <Link
                  key={t.slug}
                  href={`/tochi/${t.slug}`}
                  className={`town-mark ${LABEL_LEFT.has(t.slug) ? "is-left" : ""}`}
                  style={{ left: `calc(50% + ${q.x - c.x}px)`, top: `calc(50% + ${q.y - c.y}px)` }}
                >
                  <span className="plaque town-name">
                    {t.town}
                    {t.block}
                  </span>
                </Link>
              );
            })}
          </StaticMap>
          <div className="plaque towns-card" data-reveal="rise">
            <p className="yr towns-num">{PLACES.length}</p>
            <h2 id="towns-h" className="towns-h">
              の町に、4つの年代の記録があります
            </h2>
            <p className="towns-sum">調べられるのは福岡市の7区だけ。登録なし・無料で使えます。地図は1926年ごろの五万分の一「FUKUOKA」。</p>
            <ul className="towns-list">
              {PLACES.map((t) => (
                <li key={t.slug}>
                  <Link href={`/tochi/${t.slug}`}>
                    {t.ward} {t.town}
                    {t.block}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="sources" id="sources" aria-labelledby="sources-h">
          <StaticMap
            layer={ERA_INFO["1926"].layer}
            center={{ lat: 33.57, lon: 130.41 }}
            zoom={14}
            className="sources-map"
          />
          <div className="sheet" data-reveal="rise">
            <h2 id="sources-h" className="name sheet-title">
              データの出どころ
            </h2>
            <p className="sheet-note">どれも国と市の公開データ。地点で重ねて、1枚の履歴書にしています。</p>
            {SOURCES.map((g) => (
              <div key={g.group} className="sheet-group" data-reveal="rise">
                <h3>{g.group}</h3>
                <ul>
                  {g.items.map((s) => (
                    <li key={s.name}>
                      <span className="sheet-name">{s.name}</span>
                      <span className="sheet-who">{s.who}</span>
                      <span className="sheet-text">{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="sheet-end">
              浸水は、国土数値情報の洪水浸水想定区域を町の地点で調べた値です（確かめられていない町は「データなし」）。地盤は国土地理院の土地条件図、地価は国土交通省の地価公示を、それぞれ町の地点で調べた値です（確かめられていない町は「データなし」）。
              <br />
              写真：そらみみ「View of Ohashi Station (Fukuoka)」「Camphor tree in front of west entrance of Ohashi
              Station (Fukuoka)」CC BY-SA 4.0、Wikimedia Commons
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
