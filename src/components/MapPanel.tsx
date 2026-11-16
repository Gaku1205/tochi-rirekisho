"use client";

// 右側（スマホでは上）の地図と、年代の帯。年代を選ぶと、境目の左側がその年の地図に替わる。
import { useState } from "react";
import SwipeMap, { type MapMark } from "./SwipeMap";
import { ERA_INFO, ERAS, type Era } from "@/lib/layers";
import type { Place } from "@/lib/places";

type Props = {
  place: Place;
  marks: MapMark[];
};

export default function MapPanel({ place, marks }: Props) {
  const [era, setEra] = useState<Era>("1926");
  const info = ERA_INFO[era];
  const rows = Object.fromEntries(place.eras.map((r) => [r.era, r.title])) as Record<Era, string>;

  return (
    <aside className="side" aria-label={`${place.town}${place.block}の地図`}>
      <SwipeMap
        key={place.slug}
        className="side-map shutter"
        center={place.at}
        zoom={15}
        left={info.layer}
        leftLabel={info.label}
        marks={marks}
        pickable
        ariaLabel={`${place.town}${place.block}のまわりの地図。左は${info.label}、右はいまの地図`}
      />
      <div className="strip" role="group" aria-label="年代">
        {ERAS.map((e) => (
          <button
            key={e}
            type="button"
            className="strip-btn"
            aria-pressed={e === era}
            onClick={() => setEra(e)}
          >
            <span className="yr">{e}</span>
            <span className="strip-word">{rows[e] ?? ERA_INFO[e].short}</span>
          </button>
        ))}
      </div>
      <p className="side-note">地図を押すと、その地点を調べられます（スマホは長押し）</p>
    </aside>
  );
}
