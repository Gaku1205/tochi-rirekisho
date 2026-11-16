"use client";

// 共有用の縦長の1枚。1926年の地形図の切り抜きの上下に町名の札、間にAIの要約と記録を載せて、canvas に描く。
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CARD, sheetCrop, wrapText } from "@/lib/card";
import { OLD_MAP } from "@/lib/layers";
import { StaticMap } from "./MapLayers";
import { floodValue, NO_DATA } from "@/lib/flood";
import { groundValue } from "@/lib/ground";
import { priceLine } from "@/lib/price";
import type { Place } from "@/lib/places";

const C = {
  sand: "#DDD6C6",
  sand2: "#D2CAB8",
  ink: "#2A2A26",
  soft: "#59574E",
  moss: "#4F6238",
  deep: "#3F5A2A",
  onInk: "#CFC8B8",
};

function family(varName: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ng) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = ng;
    img.src = src;
  });
}

async function draw(canvas: HTMLCanvasElement, place: Place) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const fName = family("--f-name", "serif");
  const fYear = family("--f-year", "serif");
  const fJp = family("--f-jp", "sans-serif");
  const all = place.town + place.block + place.summary + place.eras.map((e) => e.title).join("") + "浸水の想定地盤地価万円土地の履歴書福岡市";
  // 1つの文字の塊が読めなくても、描くのは止めない
  await Promise.allSettled([
    document.fonts.load(`800 100px ${fName}`, place.town + place.block),
    document.fonts.load(`500 100px ${fYear}`, "0123456789"),
    document.fonts.load(`400 40px ${fJp}`, all),
    document.fonts.load(`700 40px ${fJp}`, all),
  ]);
  const map = await loadImage(OLD_MAP.src);
  const { w, h } = CARD;

  // 地図：画面いっぱい。地点を上から26%に
  const fx = 0.6;
  const fy = 0.26;
  const crop = sheetCrop(OLD_MAP, place.at, { w, h }, 0.62, fx, fy);
  ctx.drawImage(map, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h);
  // 地点の印（切り抜きが端で止まったときも、本当の位置に置く）
  const pt = sheetPoint(place);
  const px = (pt.x - crop.sx) / (crop.sw / w);
  const py = (pt.y - crop.sy) / (crop.sh / h);
  ctx.fillStyle = C.sand;
  ctx.beginPath();
  ctx.arc(px, py, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.deep;
  ctx.beginPath();
  ctx.arc(px, py, 21, 0, Math.PI * 2);
  ctx.fill();

  ctx.textBaseline = "alphabetic";

  // 名前の札（右上）
  ctx.font = `700 34px ${fJp}`;
  const brand = "土地の履歴書";
  const brandW = ctx.measureText(brand).width;
  ctx.fillStyle = C.ink;
  ctx.fillRect(w - brandW - 116, 60, brandW + 64, 76);
  ctx.fillStyle = C.sand;
  ctx.fillText(brand, w - brandW - 84, 110);

  // 上の札：町名の前半
  ctx.font = `800 280px ${fName}`;
  const townW = ctx.measureText(place.town).width;
  ctx.fillStyle = C.sand;
  ctx.fillRect(0, 160, townW + 96, 320);
  ctx.fillStyle = C.ink;
  ctx.fillText(place.town, 48, 420);

  // 真ん中の紙：住所・要約・記録
  const boxX = 56;
  const boxW = w - 112;
  const pad = 44;
  const inner = boxW - pad * 2;
  ctx.font = `500 42px ${fJp}`;
  const sumLines = wrapText(place.summary, inner - 64, (t) => ctx.measureText(t).width);
  const sumH = 56 + sumLines.length * 68 + 64;
  const rowH = 70;
  const rows: [string, string, boolean][] = [
    ...place.eras.map((e) => [e.era, e.title, true] as [string, string, boolean]),
    ["浸水の想定", floodValue(place.flood), false],
    ["地盤", groundValue(place.ground), false],
    ["地価", priceLine(place.price), false],
  ];
  const boxH = 92 + sumH + 28 + rows.length * rowH + 30 + 56;
  const boxY = Math.min(Math.max(py + 120, 640), h - 330 - 24 - boxH);

  ctx.fillStyle = C.sand;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = C.soft;
  ctx.font = `400 32px ${fJp}`;
  ctx.fillText(`福岡市${place.ward}${place.town}${place.block}・${place.near}`, boxX + pad, boxY + 64);

  // 要約（墨の面）
  let y = boxY + 92;
  ctx.fillStyle = C.ink;
  ctx.fillRect(boxX + pad, y, inner, sumH);
  ctx.fillStyle = C.sand;
  ctx.font = `500 42px ${fJp}`;
  sumLines.forEach((l, i) => ctx.fillText(l, boxX + pad + 32, y + 80 + i * 68));
  ctx.fillStyle = C.onInk;
  ctx.font = `400 26px ${fJp}`;
  ctx.fillText("年代ごとの地図と公開データから、AIが読み解いた要約", boxX + pad + 32, y + sumH - 30);
  y += sumH + 28;

  // 記録の行
  rows.forEach(([k, v, isYear], i) => {
    const ry = y + i * rowH;
    if (i % 2 === 0) {
      ctx.fillStyle = C.sand2;
      ctx.fillRect(boxX + pad, ry, inner, rowH);
    }
    ctx.fillStyle = isYear ? C.ink : C.soft;
    ctx.font = isYear ? `500 48px ${fYear}` : `500 30px ${fJp}`;
    ctx.fillText(k, boxX + pad + 24, ry + (isYear ? 54 : 47));
    ctx.fillStyle = v === NO_DATA ? C.soft : C.ink;
    ctx.font = `700 34px ${fJp}`;
    ctx.fillText(v, boxX + pad + 240, ry + 48);
  });

  // 地図の出どころ（紙のいちばん下）
  ctx.fillStyle = C.soft;
  ctx.font = `400 24px ${fJp}`;
  ctx.fillText("地図：五万分の一地形図「FUKUOKA」1945年刷り（1926〜29年の測量）", boxX + pad, y + rows.length * rowH + 50);

  // 下の札：町名の後半（下の端に）
  if (place.block) {
    ctx.font = `800 260px ${fName}`;
    const bw = ctx.measureText(place.block).width;
    ctx.fillStyle = C.sand;
    ctx.fillRect(w - bw - 104, h - 310, bw + 104, 310);
    ctx.fillStyle = C.ink;
    ctx.fillText(place.block, w - bw - 52, h - 56);
  }

}

/** 古い地図の画像の中での、地点の位置（px） */
function sheetPoint(place: Place): { x: number; y: number } {
  const c = sheetCrop(OLD_MAP, place.at, { w: 0, h: 0 }, 1, 0, 0);
  return { x: c.sx, y: c.sy };
}

export default function ShareCard({ place, others = [] }: { place: Place; others?: Place[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [src, setSrc] = useState("");
  const ready = src !== "";
  const [msg, setMsg] = useState("");
  const fileName = `tochi-rirekisho-${place.slug}.png`;

  useEffect(() => {
    let alive = true;
    let url = "";
    const c = document.createElement("canvas");
    c.width = CARD.w;
    c.height = CARD.h;
    ref.current = c;
    draw(c, place).then(() => {
      c.toBlob((b) => {
        if (!b || !alive) return;
        url = URL.createObjectURL(b);
        setSrc(url);
      }, "image/png");
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [place]);

  const blob = () =>
    new Promise<Blob | null>((ok) => ref.current?.toBlob((b) => ok(b), "image/png") ?? ok(null));

  const save = async () => {
    const b = await blob();
    if (!b) return;
    const url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMsg("画像を保存しました");
  };

  const share = async () => {
    const b = await blob();
    const pageUrl = `${location.origin}/tochi/${place.slug}`;
    const text = `${place.town}${place.block}の履歴書｜${place.summary}`;
    const file = b ? new File([b], fileName, { type: "image/png" }) : null;
    try {
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, url: pageUrl });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text, url: pageUrl });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${pageUrl}`);
      setMsg("文とURLをコピーしました");
    } catch {
      /* 共有を閉じたときは何もしない */
    }
  };

  return (
    <div className="card-page">
      <div className="card-side">
        <h1 className="card-title">
          <span className="name card-title-name" data-reveal="rise">
            {place.town}
            {place.block}
          </span>
          <span className="card-title-sub" data-reveal="rise">縦長の画像</span>
        </h1>
        <p className="card-text" data-reveal="rise">
          スマホの画面くらいの縦長（1080×2160）。1926年ごろの地形図の上に、町名とAIの要約、年代と浸水・地盤・地価を載せています。
        </p>
        <div className="card-actions" data-reveal="rise">
          <button type="button" className="btn" onClick={save} disabled={!ready}>
            画像を保存
          </button>
          <button type="button" className="btn btn-ink" onClick={share} disabled={!ready}>
            共有する
          </button>
        </div>
        <p className="card-msg" role="status">
          {msg}
        </p>
        <Link href={`/tochi/${place.slug}`} className="card-back" data-reveal="rise">
          {place.town}
          {place.block}の履歴書にもどる
        </Link>
        {others.length > 0 && (
          <nav className="card-others" aria-label="似た土地の画像">
            {others.map((o) => (
              <Link key={o.slug} href={`/tochi/${o.slug}/image`} className="card-other" data-reveal="row">
                <StaticMap layer={OLD_MAP} center={o.at} zoom={14.6} size={{ w: 300, h: 200 }}>
                  <span className="map-pin" style={{ left: "50%", top: "50%" }} aria-hidden="true" />
                </StaticMap>
                <span className="plaque card-other-name">
                  {o.town}
                  {o.block}
                </span>
              </Link>
            ))}
          </nav>
        )}
      </div>
      <div className="card-frame">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            width={CARD.w}
            height={CARD.h}
            className="card-img shutter"
            alt={`${place.town}${place.block}の履歴書の画像。${place.summary}`}
          />
        ) : (
          <div className="card-img card-wait" role="status">
            <span className="name">{place.town}</span>
            <span>地図を重ねています</span>
          </div>
        )}
      </div>
    </div>
  );
}
