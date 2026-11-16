// 履歴書の欄（左の砂色の紙）。AIの要約がいちばん上、続けて年代の行と、浸水・地盤・地価を同じ並びで淡々と。
import Link from "next/link";
import { StaticMap } from "./MapLayers";
import SearchForm from "./SearchForm";
import { ERA_INFO } from "@/lib/layers";
import { floodNote, floodValue, NO_DATA } from "@/lib/flood";
import { address, fullName, type Place } from "@/lib/places";
import type { SimilarPlace } from "@/lib/similar";

export type PlacePhoto = { src: string; alt: string; caption: string };

export default function RecordSheet({
  place,
  similar,
  headingLevel = 1,
  photo,
}: {
  place: Place;
  similar: SimilarPlace[];
  headingLevel?: 1 | 2;
  photo?: PlacePhoto;
}) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className="paper">
      {/* トップでは上の札のナビがあるので、ここは住所欄から始める */}
      {headingLevel === 1 && (
        <nav className="bar" aria-label="サイト">
          <Link href="/" className="bar-home">
            土地の履歴書
          </Link>
          <a href="#similar">似た土地</a>
          <Link href="/about" className="keep">
            使い方
          </Link>
        </nav>
      )}
      <SearchForm initial={address(place)} />

      <H className="name record-name">
        {place.town}
        <span className="record-block">{place.block}</span>
      </H>
      <p className="addr">
        福岡市{place.ward}・{place.near}
      </p>

      <div className="verdict">
        <p>{place.summary}</p>
        <p className="verdict-note">年代ごとの地図と、浸水・地盤・地価の公開データから、AIが読み解いた要約</p>
      </div>

      <ol className="rows" aria-label={`${fullName(place)}の記録`}>
        {place.eras.map((r) => (
          <li key={r.era} className="era-row" data-reveal="row">
            <div className="row-thumb" aria-hidden="true">
              <StaticMap layer={ERA_INFO[r.era].layer} center={place.at} zoom={15.2} size={{ w: 240, h: 240 }}>
                <span className="map-pin" style={{ left: "50%", top: "50%" }} />
              </StaticMap>
            </div>
            <div className="row-body">
              <span className="yr row-year">{r.era}</span>
              <b>{r.title}</b>
              <p>{r.text}</p>
            </div>
            {r.era === "2026" && photo && (
              <figure className="row-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.alt} width={1920} height={1440} loading="lazy" />
                <figcaption>{photo.caption}</figcaption>
              </figure>
            )}
          </li>
        ))}
        <li className="hz" data-reveal="row">
          <span className="k">浸水の想定</span>
          {place.flood.depth === null ? (
            <span className="name hz-word hz-nodata">{NO_DATA}</span>
          ) : (
            <span className="yr hz-fig">{floodValue(place.flood)}</span>
          )}
          <p>{floodNote(place.flood)}</p>
        </li>
        <li className="hz" data-reveal="row">
          <span className="k">地盤</span>
          <span className="name hz-word">{place.ground.value}</span>
          <p>{place.ground.note}</p>
        </li>
        <li className="hz" data-reveal="row">
          <span className="k">地価（1㎡あたり）</span>
          <span className="yr hz-fig">
            {place.price.manYen.toFixed(1)}
            <small>万円</small>
          </span>
          <p>
            10年で {place.price.change10y}% 上がった（{place.price.note}）。
          </p>
        </li>
      </ol>

      <section className="sim" id="similar" aria-labelledby="sim-h">
        <h2 id="sim-h" data-reveal="rise">
          似た土地
        </h2>
        <p className="sim-lead">昔の土地の使われ方・浸水・地盤・川の近さが近い順。地図の上の札とも同じ。</p>
        {similar.map((s) => (
          <Link key={s.place.slug} href={`/tochi/${s.place.slug}`} className="sim-row" data-reveal="row">
            <span className="sim-name">
              <b>
                {s.place.ward} {s.place.town}
                {s.place.block}
              </b>
              <span>{s.trait}</span>
            </span>
            <span className="yr sim-score">{s.score.toFixed(2)}</span>
            <em>{s.word}</em>
          </Link>
        ))}
      </section>

      <div className="save">
        <Link className="btn" href={`/tochi/${place.slug}/image`}>
          縦長の画像で保存
        </Link>
        <span>スマホの画面くらいの1枚</span>
      </div>

      <p className="credit">
        地図：五万分の一地形図「FUKUOKA」（米陸軍地図局、1945年刷り。もとは1926〜29年の日本の測量）パブリックドメイン、Wikimedia
        Commons／空中写真と今の地図：地理院タイル（国土地理院）／浸水：国土数値情報の洪水浸水想定区域（国土交通省）を町の地点で調べた値／地盤・地価：土地条件図、地価公示をもとにした試作の値。
        <Link href="/about">データの出どころ</Link>
      </p>
    </div>
  );
}
