// 地図の層（年代ごと）。いまの地図は右、選んだ年代は左に出し、境目でずらして比べる。
import { tokyoToWgs, type LatLon } from "./geo";

export type Era = "1926" | "1948" | "1975" | "2026";
export const ERAS: Era[] = ["1926", "1948", "1975", "2026"];

export type TileLayer = {
  kind: "tiles";
  id: string;
  /** 地理院タイルの名前と拡張子 */
  remote: { name: string; ext: "png" | "jpg" };
  /** public/tiles に置いた分の拡張子 */
  localExt: "png" | "jpg" | "webp";
  minZoom: number;
  maxZoom: number;
};

export type ImageLayer = {
  kind: "image";
  id: string;
  src: string;
  width: number;
  height: number;
  /** 図郭の左上と右下（WGS84） */
  topLeft: LatLon;
  bottomRight: LatLon;
};

export type Layer = TileLayer | ImageLayer;

export type EraInfo = {
  era: Era;
  /** 年代のボタンの下の短い言葉 */
  short: string;
  /** 地図の上の札 */
  label: string;
  layer: Layer;
  source: string;
};

/**
 * 五万分の一地形図「FUKUOKA」（AMS L772 Sheet 4147-I）。
 * 図郭は旧日本測地系で 北緯33°30′〜33°40′、東経130°15′10.4″〜130°30′10.4″。
 */
const OLD_SHEET_TL = tokyoToWgs({ lat: 33 + 40 / 60, lon: 130 + 15 / 60 + 10.4 / 3600 });
const OLD_SHEET_BR = tokyoToWgs({ lat: 33 + 30 / 60, lon: 130 + 30 / 60 + 10.4 / 3600 });

export const OLD_MAP: ImageLayer = {
  kind: "image",
  id: "ams1926",
  src: "/photos/fukuoka-1926.jpg",
  width: 3844,
  height: 3089,
  topLeft: OLD_SHEET_TL,
  bottomRight: OLD_SHEET_BR,
};

/** 同じ図郭を幅1600に縮めた物。市の全体を一度に見せるときに使う */
export const OLD_MAP_WHOLE: ImageLayer = {
  ...OLD_MAP,
  id: "ams1926-whole",
  src: "/photos/fukuoka-1926-1600.jpg",
  width: 1600,
  height: 1286,
};

export const NOW_MAP: TileLayer = {
  kind: "tiles",
  id: "std",
  remote: { name: "std", ext: "png" },
  localExt: "webp",
  minZoom: 12,
  maxZoom: 18,
};

export const ERA_INFO: Record<Era, EraInfo> = {
  "1926": {
    era: "1926",
    short: "地形図",
    label: "1926年ごろの地形図",
    layer: OLD_MAP,
    source:
      "五万分の一地形図「FUKUOKA」米陸軍地図局 1945年刷り（もとは1926〜29年の日本の測量）。パブリックドメイン、Wikimedia Commons",
  },
  "1948": {
    era: "1948",
    short: "空中写真",
    label: "1948年ごろの空中写真",
    layer: {
      kind: "tiles",
      id: "ort_USA10",
      remote: { name: "ort_USA10", ext: "png" },
      localExt: "jpg",
      minZoom: 10,
      maxZoom: 17,
    },
    source: "空中写真（1945〜1950年 米軍撮影）地理院タイル、国土地理院",
  },
  "1975": {
    era: "1975",
    short: "空中写真",
    label: "1975年ごろの空中写真",
    layer: {
      kind: "tiles",
      id: "gazo1",
      remote: { name: "gazo1", ext: "jpg" },
      localExt: "jpg",
      minZoom: 10,
      maxZoom: 17,
    },
    source: "国土画像情報（1974〜1978年撮影）地理院タイル、国土地理院",
  },
  "2026": {
    era: "2026",
    short: "いま",
    label: "いまの空中写真",
    layer: {
      kind: "tiles",
      id: "seamlessphoto",
      remote: { name: "seamlessphoto", ext: "jpg" },
      localExt: "jpg",
      minZoom: 2,
      maxZoom: 18,
    },
    source: "全国最新写真（シームレス）地理院タイル、国土地理院",
  },
};

/** public/tiles に入れてある範囲（大橋のまわり）。外は地理院から読む */
const BUNDLED: { z: number; x0: number; x1: number; y0: number; y1: number }[] = [
  { z: 14, x0: 14125, x1: 14130, y0: 6566, y1: 6570 },
  { z: 15, x0: 28250, x1: 28260, y0: 13134, y1: 13140 },
  { z: 16, x0: 56506, x1: 56513, y0: 26272, y1: 26278 },
  { z: 16, x0: 56509, x1: 56517, y0: 26273, y1: 26281 },
];

export function isBundled(z: number, x: number, y: number): boolean {
  return BUNDLED.some((b) => b.z === z && x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1);
}

export function tileUrl(layer: TileLayer, z: number, x: number, y: number): string {
  if (isBundled(z, x, y)) return `/tiles/${layer.id}/${z}/${x}/${y}.${layer.localExt}`;
  return `https://cyberjapandata.gsi.go.jp/xyz/${layer.remote.name}/${z}/${x}/${y}.${layer.remote.ext}`;
}
