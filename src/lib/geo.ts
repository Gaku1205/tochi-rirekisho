// 緯度経度と、Webメルカトル（地理院タイルと同じ）の画面上の位置を行き来する計算。

export type LatLon = { lat: number; lon: number };
export type Point = { x: number; y: number };

const TILE = 256;

/** ズーム z での世界全体の幅（px） */
export function worldSize(zoom: number): number {
  return TILE * 2 ** zoom;
}

/** 緯度経度 → ズーム z の世界座標（px） */
export function project(p: LatLon, zoom: number): Point {
  const size = worldSize(zoom);
  const lat = Math.max(-85.05112878, Math.min(85.05112878, p.lat));
  const r = (lat * Math.PI) / 180;
  return {
    x: ((p.lon + 180) / 360) * size,
    y: ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * size,
  };
}

/** ズーム z の世界座標（px） → 緯度経度 */
export function unproject(pt: Point, zoom: number): LatLon {
  const size = worldSize(zoom);
  const lon = (pt.x / size) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * pt.y) / size;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lon };
}

/**
 * 旧日本測地系（Tokyo Datum）→ 世界測地系（WGS84）のおおよその変換。
 * 国土地理院が示す簡易式（誤差は数m〜十数m。五万分の一の地形図を重ねるには足りる）。
 */
export function tokyoToWgs(p: LatLon): LatLon {
  const { lat, lon } = p;
  return {
    lat: lat - 0.00010695 * lat + 0.000017464 * lon + 0.0046017,
    lon: lon - 0.000046038 * lat - 0.000083043 * lon + 0.01004,
  };
}

/** 2点間の距離（m）。球として計算する */
export function distanceMeters(a: LatLon, b: LatLon): number {
  const R = 6371008.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 方角を8方位の日本語で */
export function bearingName(from: LatLon, to: LatLon): string {
  const y = Math.sin(((to.lon - from.lon) * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180);
  const x =
    Math.cos((from.lat * Math.PI) / 180) * Math.sin((to.lat * Math.PI) / 180) -
    Math.sin((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.cos(((to.lon - from.lon) * Math.PI) / 180);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const names = ["北", "北東", "東", "南東", "南", "南西", "西", "北西"];
  return names[Math.round(deg / 45) % 8];
}
