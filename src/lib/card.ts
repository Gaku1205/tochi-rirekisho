// 共有用の縦長画像（1080×2160）の組み方。描く前に、文字の折り返しと地図の切り抜きを決める。
import { project } from "./geo";
import type { ImageLayer } from "./layers";
import type { LatLon } from "./geo";

export const CARD = { w: 1080, h: 2160 } as const;

/** 1文字ずつ測って、幅に収まるように折り返す（日本語向け。行頭に句読点を置かない） */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const noHead = "、。）」』・ー";
  const lines: string[] = [];
  let line = "";
  for (const ch of [...text]) {
    const next = line + ch;
    if (measure(next) > maxWidth && line) {
      if (noHead.includes(ch)) {
        line = next;
        continue;
      }
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** 古い地図の画像から、地点を (fx, fy) に置いて切り抜く範囲（元の画像の px） */
export function sheetCrop(
  sheet: ImageLayer,
  at: LatLon,
  out: { w: number; h: number },
  srcPerOut: number,
  fx = 0.5,
  fy = 0.5,
): { sx: number; sy: number; sw: number; sh: number } {
  const z = 16;
  const tl = project(sheet.topLeft, z);
  const br = project(sheet.bottomRight, z);
  const p = project(at, z);
  const px = ((p.x - tl.x) / (br.x - tl.x)) * sheet.width;
  const py = ((p.y - tl.y) / (br.y - tl.y)) * sheet.height;
  const sw = out.w * srcPerOut;
  const sh = out.h * srcPerOut;
  const sx = Math.max(0, Math.min(sheet.width - sw, px - sw * fx));
  const sy = Math.max(0, Math.min(sheet.height - sh, py - sh * fy));
  return { sx, sy, sw, sh };
}
