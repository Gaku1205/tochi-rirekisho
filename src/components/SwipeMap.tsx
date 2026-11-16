"use client";

// 昔と今を、境目を指でずらして左右で比べる地図。拡大・縮小・移動は自由。
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { project, unproject, type LatLon } from "@/lib/geo";
import { NOW_MAP, type Layer } from "@/lib/layers";
import { searchPoint, type PointResult } from "@/lib/search";
import { LayerView, type Size } from "./MapLayers";

export type MapMark = { id: string; at: LatLon; label: string; href?: string; main?: boolean };

type Props = {
  center: LatLon;
  zoom?: number;
  left: Layer;
  leftLabel: string;
  rightLabel?: string;
  marks?: MapMark[];
  ariaLabel: string;
  className?: string;
  /** true なら、地図を押した（タッチは長押し）地点を選んで札を出す */
  pickable?: boolean;
};

type Picked = { at: LatLon; result: PointResult };
/** 押したまま動いても「動かしていない」とみなす距離（px） */
const TAP_SLOP = 8;
/** タッチで地点を選ぶ長押しの時間（ms） */
const LONG_PRESS_MS = 500;
/** ダブルクリックかどうかを待つ時間（ms） */
const DOUBLE_CLICK_MS = 260;
const CARD_W = 252;

const MIN_ZOOM = 12;
const MAX_ZOOM = 17.5;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

export default function SwipeMap({
  center: initialCenter,
  zoom: initialZoom = 15,
  left,
  leftLabel,
  rightLabel = "いまの地図",
  marks = [],
  ariaLabel,
  className,
  pickable = false,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ w: 1600, h: 1100 });
  // 町が変わったら、親が key を変えて作り直す
  const [center, setCenter] = useState(initialCenter);
  const [zoom, setZoom] = useState(initialZoom);
  const [split, setSplit] = useState(62);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const dragging = useRef<"map" | "split" | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  // 押し始めからの様子。動いたら・指が増えたら、地点は選ばない
  const press = useRef<{ id: number; x: number; y: number; touch: boolean; spoiled: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const view = useRef({ center: initialCenter, zoom: initialZoom });
  useEffect(() => {
    view.current = { center, zoom };
  }, [center, zoom]);

  const clearTimers = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (clickTimer.current) clearTimeout(clickTimer.current);
    timer.current = null;
    clickTimer.current = null;
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  /** 枠の中の位置（中心からのずれ px）にある地点を選ぶ */
  const pickAt = useCallback((ox: number, oy: number) => {
    const { center: c0, zoom: z0 } = view.current;
    const p = project(c0, z0);
    const at = unproject({ x: p.x + ox, y: p.y + oy }, z0);
    setPicked({ at, result: searchPoint(at) });
  }, []);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setCenter((c) => {
        const p = project(c, zoom);
        return unproject({ x: p.x - dx, y: p.y - dy }, zoom);
      });
    },
    [zoom],
  );

  const zoomAt = useCallback(
    (next: number, ox = 0, oy = 0) => {
      const nz = clampZoom(next);
      setCenter((c) => {
        // 指した所が動かないように、中心をずらす
        const p = project(c, zoom);
        const target = unproject({ x: p.x + ox, y: p.y + oy }, zoom);
        const t = project(target, nz);
        return unproject({ x: t.x - ox, y: t.y - oy }, nz);
      });
      setZoom(nz);
    },
    [zoom],
  );

  const local = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a,button,.map-card")) return;
    const isKnob = (e.target as HTMLElement).closest(".map-split");
    box.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (isKnob) {
      dragging.current = "split";
      return;
    }
    dragging.current = "map";
    if (pickable) {
      if (pointers.current.size > 1) {
        // 2本目の指（ピンチ）は、地点を選ぶ操作ではない
        if (press.current) press.current.spoiled = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
      } else {
        const touch = e.pointerType !== "mouse";
        press.current = { id: e.pointerId, x: e.clientX, y: e.clientY, touch, spoiled: e.button > 0 };
        if (touch && !press.current.spoiled) {
          const l = local(e);
          timer.current = setTimeout(() => {
            timer.current = null;
            if (!press.current || press.current.spoiled) return;
            press.current.spoiled = true; // 離したときに、もう一度選ばない
            pickAt(l.x - l.w / 2, l.y - l.h / 2);
          }, LONG_PRESS_MS);
        }
      }
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pr = press.current;
    if (pr && !pr.spoiled && Math.hypot(e.clientX - pr.x, e.clientY - pr.y) > TAP_SLOP) {
      pr.spoiled = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    }
    if (dragging.current === "split") {
      const l = local(e);
      setSplit(Math.min(100, Math.max(0, (l.x / l.w) * 100)));
      return;
    }
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      setZoom(clampZoom(pinch.current.zoom + Math.log2(d / pinch.current.dist)));
      return;
    }
    panBy(e.clientX - prev.x, e.clientY - prev.y);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const pr = press.current;
    if (pr && pr.id === e.pointerId) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      press.current = null;
      // 動かさずに離した短い押し：札が出ていれば閉じる。マウスなら、ダブルクリックでないときだけ地点を選ぶ
      if (e.type === "pointerup" && !pr.spoiled && pointers.current.size === 1) {
        if (picked) {
          setPicked(null);
        } else if (!pr.touch) {
          if (clickTimer.current) {
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
          } else {
            const l = local(e);
            clickTimer.current = setTimeout(() => {
              clickTimer.current = null;
              pickAt(l.x - l.w / 2, l.y - l.h / 2);
            }, DOUBLE_CLICK_MS);
          }
        }
      }
    }
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) dragging.current = null;
  };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(zoom - e.deltaY * 0.0025, e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, zoomAt]);

  const onKnobKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") setSplit((s) => Math.max(0, s - step));
    else if (e.key === "ArrowRight") setSplit((s) => Math.min(100, s + step));
    else if (e.key === "Home") setSplit(0);
    else if (e.key === "End") setSplit(100);
    else return;
    e.preventDefault();
  };

  const onMapKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && picked) {
      setPicked(null);
      box.current?.focus();
      e.preventDefault();
      return;
    }
    if (e.target !== e.currentTarget) return;
    if (pickable && e.key === "Enter") {
      pickAt(0, 0);
      e.preventDefault();
      return;
    }
    const d = 80;
    if (e.key === "ArrowLeft") panBy(d, 0);
    else if (e.key === "ArrowRight") panBy(-d, 0);
    else if (e.key === "ArrowUp") panBy(0, d);
    else if (e.key === "ArrowDown") panBy(0, -d);
    else if (e.key === "+" || e.key === "=") zoomAt(zoom + 0.5);
    else if (e.key === "-") zoomAt(zoom - 0.5);
    else return;
    e.preventDefault();
  };

  const c = project(center, zoom);

  return (
    <div
      ref={box}
      className={`map ${className ?? ""}`}
      style={{ "--split": `${split}%` } as React.CSSProperties}
      role="region"
      aria-label={`${ariaLabel}。矢印キーで移動、＋と−で拡大・縮小${pickable ? "、Enterで中心の地点を調べる" : ""}`}
      tabIndex={0}
      onKeyDown={onMapKey}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => {
        // タッチの長押しで出るメニューを止める
        if (pickable && press.current?.touch) e.preventDefault();
      }}
      onDoubleClick={(e) => {
        if (clickTimer.current) clearTimeout(clickTimer.current);
        clickTimer.current = null;
        if ((e.target as HTMLElement).closest("a,button,.map-card")) return;
        const l = local(e);
        zoomAt(zoom + 1, l.x - l.w / 2, l.y - l.h / 2);
      }}
    >
      <div className="map-layer map-now">
        <LayerView layer={NOW_MAP} center={center} zoom={zoom} size={size} />
      </div>
      <div className="map-layer map-old">
        <LayerView layer={left} center={center} zoom={zoom} size={size} />
      </div>

      {marks.map((m) => {
        const p = project(m.at, zoom);
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        // 札が枠の端に掛かるときは出さない（切れた札を見せない）
        if (!m.main && (Math.abs(dx) > size.w / 2 - 110 || dy < -size.h / 2 + 90 || dy > size.h / 2 - 24)) return null;
        const style = { left: `calc(50% + ${dx}px)`, top: `calc(50% + ${dy}px)` };
        if (m.main) return <span key={m.id} className="map-pin" style={style} aria-hidden="true" />;
        return m.href ? (
          <a key={m.id} className="map-mark" style={style} href={m.href}>
            {m.label}
          </a>
        ) : (
          <span key={m.id} className="map-mark" style={style}>
            {m.label}
          </span>
        );
      })}

      {picked &&
        (() => {
          const p = project(picked.at, zoom);
          const dx = p.x - c.x;
          const dy = p.y - c.y;
          const half = CARD_W / 2 + 12;
          const cx = Math.max(-size.w / 2 + half, Math.min(size.w / 2 - half, dx));
          const below = dy < -size.h / 2 + 190;
          const r = picked.result;
          return (
            <>
              <span className="map-pin" style={{ left: `calc(50% + ${dx}px)`, top: `calc(50% + ${dy}px)` }} aria-hidden="true" />
              <div
                className={`map-card${below ? " map-card-below" : ""}`}
                style={{ left: `calc(50% + ${cx}px)`, top: `calc(50% + ${dy}px)`, width: CARD_W }}
                role="status"
              >
                {r.kind === "found" ? (
                  <>
                    <p className="map-card-town">
                      {r.place.town}
                      {r.place.block}
                    </p>
                    <Link className="btn" href={`/tochi/${r.place.slug}`}>
                      この地点の履歴書を見る
                    </Link>
                  </>
                ) : (
                  <p className="map-card-far">ここは調べられる町から遠すぎます</p>
                )}
              </div>
            </>
          );
        })()}

      <div className="map-split">
        <span
          className="map-knob"
          role="slider"
          tabIndex={0}
          aria-label="昔と今の境目"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(split)}
          aria-valuetext={`左から${Math.round(split)}%`}
          onKeyDown={onKnobKey}
        >
          <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true">
            <path d="M8 2 1 9l7 7M18 2l7 7-7 7M1 9h24" fill="none" stroke="currentColor" strokeWidth="2.4" />
          </svg>
        </span>
      </div>

      <span className="map-tag map-tag-l">{leftLabel}</span>
      <span className="map-tag map-tag-r">{rightLabel}</span>

      <div className="map-zoom">
        <button type="button" aria-label="拡大" onClick={() => zoomAt(zoom + 1)}>
          ＋
        </button>
        <button type="button" aria-label="縮小" onClick={() => zoomAt(zoom - 1)}>
          −
        </button>
      </div>
    </div>
  );
}
