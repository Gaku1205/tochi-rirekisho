// 結果の画面：左に履歴書、右に昔と今をずらして比べる地図。
import MapPanel from "./MapPanel";
import RecordSheet, { type PlacePhoto } from "./RecordSheet";
import { PLACES, type Place } from "@/lib/places";
import { findSimilar } from "@/lib/similar";

const PHOTOS: Record<string, PlacePhoto> = {
  "ohashi-2": {
    src: "/photos/camphor-tree-in-front-of-west-entrance.jpg",
    alt: "西鉄大橋駅の西口。石畳の広場に大きな楠が立つ",
    caption: "大橋駅 西口の楠（2015年）",
  },
};

export default function RecordView({ place, headingLevel = 1 }: { place: Place; headingLevel?: 1 | 2 }) {
  const similar = findSimilar(place, PLACES);
  const marks = [
    { id: place.slug, at: place.at, label: place.town, main: true },
    ...similar.map((s) => ({
      id: s.place.slug,
      at: s.place.at,
      label: `${s.place.town}${s.place.block} ${s.score.toFixed(2)}`,
      href: `/tochi/${s.place.slug}`,
    })),
  ];
  return (
    <div className="record" id="record">
      <RecordSheet place={place} similar={similar} headingLevel={headingLevel} photo={PHOTOS[place.slug]} />
      <MapPanel place={place} marks={marks} />
    </div>
  );
}
