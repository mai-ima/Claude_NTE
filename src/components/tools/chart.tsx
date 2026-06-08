/** ツール用の軽量SVGチャート（依存なし）。折れ線・横棒・スパークライン。 */

interface Marker {
  x: number; // データindex
  label: string;
  color?: string;
}

/** 0..1 に正規化済みの系列を折れ線＋エリアで描画。x軸はindex。 */
export function LineChart({
  data,
  color = 'var(--accent)',
  height = 160,
  yTicks = [0.25, 0.5, 0.75, 1],
  xLabels,
  markers = [],
  fmtY = (v: number) => `${Math.round(v * 100)}%`,
}: {
  data: number[];
  color?: string;
  height?: number;
  yTicks?: number[];
  xLabels?: { x: number; label: string }[];
  markers?: Marker[];
  fmtY?: (v: number) => string;
}) {
  const W = 320;
  const H = height;
  const padL = 34;
  const padB = 18;
  const padT = 6;
  const padR = 6;
  const innerW = W - padL - padR;
  const innerH = H - padB - padT;
  const n = data.length;
  const xAt = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
  const yAt = (v: number) => padT + (1 - Math.min(1, Math.max(0, v))) * innerH;

  const line = data.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
  const area = `${padL},${padT + innerH} ${line} ${xAt(n - 1)},${padT + innerH}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="折れ線グラフ" style={{ display: 'block' }}>
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={yAt(t)} x2={W - padR} y2={yAt(t)} stroke="var(--border)" stroke-width="1" opacity="0.6" />
          <text x={padL - 4} y={yAt(t) + 3} text-anchor="end" font-size="9" fill="var(--muted)">{fmtY(t)}</text>
        </g>
      ))}
      {markers.map((m) => (
        <g key={m.label}>
          <line x1={xAt(m.x)} y1={padT} x2={xAt(m.x)} y2={padT + innerH} stroke={m.color ?? 'var(--warning)'} stroke-width="1.5" stroke-dasharray="3 3" />
          <text x={xAt(m.x)} y={padT + 8} text-anchor="middle" font-size="8" font-weight="700" fill={m.color ?? 'var(--warning)'}>{m.label}</text>
        </g>
      ))}
      <polygon points={area} fill={color} opacity="0.14" />
      <polyline points={line} fill="none" stroke={color} stroke-width="2.5" stroke-linejoin="round" />
      {(xLabels ?? []).map((xl) => (
        <text key={xl.label} x={xAt(xl.x)} y={H - 4} text-anchor="middle" font-size="9" fill="var(--muted)">{xl.label}</text>
      ))}
    </svg>
  );
}

/** 横棒グラフ */
export function HBars({
  items,
  max,
}: {
  items: { label: string; value: number; color?: string; sub?: string }[];
  max?: number;
}) {
  const m = Math.max(1, max ?? Math.max(...items.map((i) => i.value)));
  return (
    <div class="stack" style={{ gap: '6px' }}>
      {items.map((it) => (
        <div class="dist-row" key={it.label}>
          <span class="text-sm" style={{ minWidth: '5.5em', fontWeight: 600 }}>{it.label}</span>
          <div class="dist-bar">
            <span style={{ width: `${(it.value / m) * 100}%`, background: it.color ?? 'var(--accent)' }} />
          </div>
          <span class="muted text-sm" style={{ minWidth: '2.5em', textAlign: 'right' }}>{it.sub ?? it.value}</span>
        </div>
      ))}
    </div>
  );
}
