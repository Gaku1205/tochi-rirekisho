// 地図の層を、中心とズームから並べる（動かない地図にも、動く地図にも使う）。
import { project, type LatLon } from "@/lib/geo";
import TileImg from "@/components/TileImg";
import { tileUrl, type Layer, type TileLayer } from "@/lib/layers";

export type Size = { w: number; h: number };

function Tiles({ layer, center, zoom, size }: { layer: TileLayer; center: LatLon; zoom: number; size: Size }) {
  const z = Math.min(layer.maxZoom, Math.max(layer.minZoom, Math.round(zoom)));
  const scale = 2 ** (zoom - z);
  const c = project(center, z);
  const tile = 256 * scale;
  const halfW = size.w / 2 / scale;
  const halfH = size.h / 2 / scale;
  const x0 = Math.floor((c.x - halfW) / 256);
  const x1 = Math.floor((c.x + halfW) / 256);
  const y0 = Math.floor((c.y - halfH) / 256);
  const y1 = Math.floor((c.y + halfH) / 256);
  const imgs = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const left = (x * 256 - c.x) * scale;
      const top = (y * 256 - c.y) * scale;
      imgs.push(
        <TileImg
          key={`${z}/${x}/${y}`}
          src={tileUrl(layer, z, x, y)}
          width={256}
          height={256}
          style={{
            left: `calc(50% + ${left}px)`,
            top: `calc(50% + ${top}px)`,
            width: tile + 0.5,
            height: tile + 0.5,
          }}
        />,
      );
    }
  }
  return <div className="map-tiles">{imgs}</div>;
}

export function LayerView({ layer, center, zoom, size }: { layer: Layer; center: LatLon; zoom: number; size: Size }) {
  if (layer.kind === "tiles") return <Tiles layer={layer} center={center} zoom={zoom} size={size} />;
  const c = project(center, zoom);
  const tl = project(layer.topLeft, zoom);
  const br = project(layer.bottomRight, zoom);
  return (
    <div className="map-tiles">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={layer.src}
        alt=""
        draggable={false}
        width={layer.width}
        height={layer.height}
        className="map-sheet"
        style={{
          left: `calc(50% + ${tl.x - c.x}px)`,
          top: `calc(50% + ${tl.y - c.y}px)`,
          width: br.x - tl.x,
          height: br.y - tl.y,
        }}
      />
    </div>
  );
}


/** 動かない地図。中心の地点を、枠の (fx, fy) の割合の位置に置く */
export function StaticMap({
  layer,
  center,
  zoom,
  fx = 0.5,
  fy = 0.5,
  size = { w: 2400, h: 1600 },
  className,
  children,
}: {
  layer: Layer;
  center: LatLon;
  zoom: number;
  fx?: number;
  fy?: number;
  size?: Size;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`static-map ${className ?? ""}`}>
      <div className="static-map-in" style={{ left: `${(fx - 0.5) * 100}%`, top: `${(fy - 0.5) * 100}%` }}>
        <LayerView layer={layer} center={center} zoom={zoom} size={size} />
        {children}
      </div>
    </div>
  );
}
