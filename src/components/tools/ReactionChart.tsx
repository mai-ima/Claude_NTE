/**
 * 異能連環チェッカー。属性リング（クリックで選択）＋ Duo反応の一覧表。
 * 選択した属性に関わる反応をハイライトする。
 */
import { useState } from 'preact/hooks';
import { ELEMENT_RING, DUO_REACTIONS, TRIO_REACTIONS, elementMeta } from '../../lib/nav';
import { cssVars } from '../../lib/css';

export default function ReactionChart() {
  const [sel, setSel] = useState<string | null>(null);

  const cx = 100, cy = 100, r = 72;
  const nodes = ELEMENT_RING.map((id, i) => {
    const ang = (-90 + i * 60) * (Math.PI / 180);
    return { id, x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), meta: elementMeta(id) };
  });
  const neighborsOf = (el: string) =>
    DUO_REACTIONS.filter((d) => d.a === el || d.b === el).map((d) => (d.a === el ? d.b : d.a));
  const nb = sel ? neighborsOf(sel) : [];
  const involves = (d: { a: string; b: string }) => !sel || d.a === sel || d.b === sel;

  return (
    <div class="tool">
      <p class="muted text-sm">属性をタップすると、その属性が起こせる反応をハイライトします。</p>
      <div style={{ display: 'grid', placeItems: 'center' }}>
        {/* 中の属性はボタンとして操作できるので role="img"（中身を読ませない）にはしない */}
        <svg
          viewBox="0 0 200 200"
          width="240"
          height="240"
          role="group"
          aria-label="異能連環リング。属性を選ぶと、その属性が起こせる反応をハイライトします"
        >
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" stroke-width="2" />
          {nodes.map((n, i) => {
            const m = nodes[(i + 1) % nodes.length];
            const active = sel && (n.id === sel || m.id === sel);
            return (
              <line key={`e${i}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y}
                stroke={active ? 'var(--accent)' : 'var(--border)'} stroke-width={active ? 3 : 1.5}
                opacity={active ? 1 : 0.5} />
            );
          })}
          {nodes.map((n) => {
            const on = n.id === sel;
            const near = nb.includes(n.id);
            const rad = on ? 21 : near ? 18 : 15;
            const toggle = () => setSel(on ? null : n.id);
            return (
              // マウスだけでなくキーボードでも選べるようにする
              // （tabindex と Enter/Space が無く、キーボードでは操作できない状態だった）
              <g
                key={n.id}
                class="rc-node"
                style={{ cursor: 'pointer' }}
                role="button"
                tabindex={0}
                aria-pressed={on ? 'true' : 'false'}
                aria-label={`${n.meta.label}属性（${n.meta.en}）`}
                onClick={toggle}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle();
                  }
                }}
              >
                <circle cx={n.x} cy={n.y} r={rad} fill={n.meta.hue}
                  opacity={sel && !on && !near ? 0.35 : 1} stroke="#fff" stroke-width={on ? 3 : 1.5} />
                <text x={n.x} y={n.y + 5} text-anchor="middle" font-size={on ? 16 : 13} font-weight="800" fill="#fff">
                  {n.meta.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {sel && (
        <div class="row" style={{ justifyContent: 'center' }}>
          <button class="btn btn-sm btn-ghost" type="button" onClick={() => setSel(null)}>選択を解除</button>
        </div>
      )}

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr><th>反応</th><th>属性ペア</th><th>効果</th></tr>
          </thead>
          <tbody>
            {DUO_REACTIONS.map((d) => {
              const ea = elementMeta(d.a), eb = elementMeta(d.b);
              const hot = sel && involves(d);
              return (
                <tr key={d.name} style={{ opacity: sel && !hot ? 0.4 : 1, background: hot ? 'var(--accent-weak)' : undefined }}>
                  <td><strong>{d.ja}</strong><br /><span class="muted text-sm">{d.name}</span></td>
                  <td>
                    <span class="cluster" style={{ gap: '4px' }}>
                      <span class="el-badge" style={cssVars({ '--el': ea.hue })}>{ea.label}</span>
                      <span>＋</span>
                      <span class="el-badge" style={cssVars({ '--el': eb.hue })}>{eb.label}</span>
                    </span>
                  </td>
                  <td class="text-sm">{d.effect}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div class="callout callout-info">
        <div>
          <p class="callout-title">トリオ反応</p>
          {/* 定義は nav.ts に集約（チームビルダーと同じものを参照する） */}
          <div class="text-sm stack" style={{ gap: '4px' }}>
            {TRIO_REACTIONS.map((t) => (
              <div key={t.name}>
                <strong>
                  {t.ja}（{t.name}）
                </strong>
                （{t.els.map((e) => elementMeta(e).label).join('＋')}）＝{t.effect}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
