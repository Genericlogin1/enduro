type LngLat = [number, number];

export default function RoutePreview({ geojson, className = '' }: { geojson: any; className?: string }) {
  let coords: LngLat[] = [];
  try {
    const g = geojson?.geometry || geojson;
    if (g?.type === 'LineString' && Array.isArray(g.coordinates)) coords = g.coordinates as LngLat[];
    else if (Array.isArray(geojson?.coordinates)) coords = geojson.coordinates as LngLat[];
  } catch {}
  if (coords.length < 2) {
    return <div className={'w-full aspect-[16/10] bg-elev2 flex items-center justify-center text-muted text-xs ' + className}>no path</div>;
  }
  const xs = coords.map(c => c[0]);
  const ys = coords.map(c => c[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = 160, h = 100, pad = 8;
  const sx = (x: number) => maxX === minX ? w / 2 : pad + ((x - minX) / (maxX - minX)) * (w - pad * 2);
  const sy = (y: number) => maxY === minY ? h / 2 : h - (pad + ((y - minY) / (maxY - minY)) * (h - pad * 2));
  const d = coords.map((c, i) => (i === 0 ? 'M' : 'L') + sx(c[0]).toFixed(1) + ' ' + sy(c[1]).toFixed(1)).join(' ');
  const start = coords[0], end = coords[coords.length - 1];
  return (
    <div className={'w-full aspect-[16/10] bg-elev2 overflow-hidden ' + className}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0H0V10" fill="none" stroke="rgb(60,54,44)" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#grid)" />
        <path d={d} fill="none" stroke="rgb(196,110,60)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={sx(start[0])} cy={sy(start[1])} r="2.4" fill="rgb(154,175,113)" />
        <circle cx={sx(end[0])} cy={sy(end[1])} r="2.4" fill="rgb(222,130,75)" />
      </svg>
    </div>
  );
}
