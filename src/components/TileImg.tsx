"use client";

import { useState, type CSSProperties } from "react";

/**
 * 地図の1枚の画像。読めなかったときは、壊れた画像のアイコンを出さずに消す（地の砂色だけが残る）。
 */
export default function TileImg({
  src,
  width,
  height,
  style,
  className,
}: {
  src: string;
  width: number;
  height: number;
  style?: CSSProperties;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      width={width}
      height={height}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
