const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 6;
const GAP = 3; // pixels between slices (exploded effect)
const LABEL_RADIUS = RADIUS * 0.62; // where % labels sit inside slices

function toRad(angle) {
  return ((angle - 90) * Math.PI) / 180;
}

function polarToCartesian(angle, r = RADIUS) {
  const rad = toRad(angle);
  return {
    x: CENTER + r * Math.cos(rad),
    y: CENTER + r * Math.sin(rad),
  };
}

function slicePath(startAngle, endAngle, cx, cy) {
  const r = RADIUS;
  if (endAngle - startAngle >= 359.999) {
    const mid = startAngle + 180;
    const s = polar(startAngle, r, cx, cy);
    const m = polar(mid, r, cx, cy);
    return [
      `M ${cx} ${cy}`,
      `L ${s.x} ${s.y}`,
      `A ${r} ${r} 0 0 1 ${m.x} ${m.y}`,
      `A ${r} ${r} 0 0 1 ${s.x} ${s.y}`,
      'Z',
    ].join(' ');
  }
  const s = polar(startAngle, r, cx, cy);
  const e = polar(endAngle, r, cx, cy);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${s.x} ${s.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`,
    'Z',
  ].join(' ');
}

function polar(angle, r, cx, cy) {
  const rad = toRad(angle);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function PieChart({ slices }) {
  let angle = 0;

  const sliceData = slices.map((s) => {
    const sweep = (s.pct / 100) * 360;
    const startAngle = angle;
    angle += sweep;
    const midAngle = startAngle + sweep / 2;

    // Offset center for exploded gap
    const offsetRad = toRad(midAngle);
    const cx = CENTER + GAP * Math.cos(offsetRad);
    const cy = CENTER + GAP * Math.sin(offsetRad);

    // Label position inside the slice
    const label = polarToCartesian(midAngle, LABEL_RADIUS);

    return { ...s, startAngle, sweep, midAngle, cx, cy, label };
  });

  return (
    <div className="ma-chart-wrapper">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="ma-chart-svg"
      >
        {/* Shadow */}
        <defs>
          <filter id="pie-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12" />
          </filter>
        </defs>
        <g filter="url(#pie-shadow)">
          {sliceData.map((s) => {
            if (s.sweep < 0.1) return null;
            return (
              <path
                key={s.name}
                d={slicePath(s.startAngle, s.startAngle + s.sweep, s.cx, s.cy)}
                fill={s.color}
                stroke="#fafbf6"
                strokeWidth="1.5"
              />
            );
          })}
        </g>
        {/* Percentage labels inside slices */}
        {sliceData.map((s) => {
          if (s.sweep < 18) return null; // skip label for tiny slices
          return (
            <text
              key={`label-${s.name}`}
              x={s.label.x}
              y={s.label.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="ma-chart-inner-label"
            >
              {Math.round(s.pct)}%
            </text>
          );
        })}
      </svg>
      <div className="ma-chart-legend">
        {slices.map((s) => (
          <div key={s.name} className="ma-chart-legend-item">
            <span className="ma-chart-dot" style={{ background: s.color }} />
            <span className="ma-chart-legend-name">{s.name}</span>
            <span className="ma-chart-legend-pct">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
