"use client";

// 昔と今を、境目を指でずらして左右で比べる地図。拡大・縮小・移動は自由。
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { project, unproject, type LatLon } from "@/lib/geo";
import { NOW_MAP, type Layer } from "@/lib/layers";
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
};

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
    if ((e.target as HTMLElement).closest("a,button")) return;
    const isKnob = (e.target as HTMLElement).closest(".map-split");
    box.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (isKnob) {
      dragging.current = "split";
      return;
    }
    dragging.current = "map";
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
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
    if (e.target !== e.currentTarget) return;
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
      aria-label={`${ariaLabel}。矢印キーで移動、＋と−で拡大・縮小`}
      tabIndex={0}
      onKeyDown={onMapKey}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={(e) => {
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
