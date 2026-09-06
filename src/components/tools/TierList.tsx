/**
 * ティアリスト（キャラクターデータ連携）。
 * - 初期ティアは各キャラ記事の frontmatter `tier`（コミュニティ評価・時点情報）。
 * - タップで選択 → ティア行をタップで移動（モバイルでも操作しやすい方式）。
 * - 並べ替えは端末内(localStorage)に保存。リセットで初期状態に戻る。
 */
import { useState } from 'preact/hooks';
import { useStore } from './useStore';
import { cssVars } from '../../lib/css';
import { ELEMENT_RING, elementMeta } from '../../lib/nav';
import { withBoundary } from './withBoundary';

export interface TierChar {
  id: string;
  name: string;
  element: string;
  rarity: string;
  tier?: string;
  href: string;
  el: string; // 属性色
}

const TIERS: { key: string; color: string }[] = [
  { key: 'SS', color: '#ff4d4f' },
  { key: 'S', color: '#ff9800' },
  { key: 'A', color: '#fbc02d' },
  { key: 'B', color: '#8bc34a' },
  { key: 'C', color: '#03a9f4' },
  { key: '未分類', color: '#9e9e9e' },
];

function TierList({ characters }: { characters: TierChar[] }) {
  const [overrides, setOverrides] = useStore<Record<string, string>>('tool.tierList', {});
  const [selected, setSelected] = useState<string | null>(null);
  const [filterEl, setFilterEl] = useState<string | null>(null);

  const tierOf = (c: TierChar) => overrides[c.id] ?? c.tier ?? '未分類';
  const visible = (c: TierChar) => !filterEl || c.element === filterEl;

  const move = (tier: string) => {
    if (!selected) return;
    setOverrides((p) => ({ ...p, [selected]: tier }));
    setSelected(null);
  };

  return (
    <div class="tool">
      <div class="callout callout-info">
        <div>
          <p class="callout-title">使い方</p>
          <div class="text-sm">
            キャラを<strong>タップして選択</strong>し、移動先のティア行を<strong>タップ</strong>すると入れ替わります。
            初期評価はコミュニティの一例（2026年6月時点）で、あなたの編成に合わせて自由に並べ替えできます。
          </div>
        </div>
      </div>

      <div class="filterbar" role="group" aria-label="属性で絞り込み" style={{ marginBottom: '12px' }}>
        <button
          type="button"
          class={`chip ${filterEl === null ? 'is-on' : ''}`}
          aria-pressed={filterEl === null}
          onClick={() => setFilterEl(null)}
        >
          すべて
        </button>
        {ELEMENT_RING.map((el) => (
          <button
            key={el}
            type="button"
            class={`chip ${filterEl === el ? 'is-on' : ''}`}
            aria-pressed={filterEl === el}
            style={cssVars({ '--el': elementMeta(el).hue })}
            onClick={() => setFilterEl((p) => (p === el ? null : el))}
          >
            <span class="el-dot" />
            {elementMeta(el).label}
          </button>
        ))}
      </div>

      {TIERS.map((t) => {
        const members = characters.filter((c) => tierOf(c) === t.key && visible(c));
        return (
          <div class="tier-row" key={t.key} onClick={() => move(t.key)} role="button" tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && move(t.key)}>
            <div class="tier-label" style={{ background: t.color }}>{t.key === '未分類' ? '—' : t.key}</div>
            <div class="tier-pool">
              {members.length === 0 && <span class="muted text-sm">（タップでここに移動）</span>}
              {members.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  class="tier-chip"
                  style={{
                    outline: selected === c.id ? `2px solid var(--accent)` : 'none',
                    background: selected === c.id ? 'var(--accent-weak)' : undefined,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected((prev) => (prev === c.id ? null : c.id));
                  }}
                >
                  <span class="el-dot" style={cssVars({ '--el': c.el })} />
                  {c.name}
                  <span class="muted" style={{ fontSize: '0.7rem' }}>{c.rarity}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div class="cluster">
        {selected && (
          <span class="text-sm">
            選択中: <strong>{characters.find((c) => c.id === selected)?.name}</strong> — 行をタップして移動
          </span>
        )}
        <button class="btn btn-sm btn-ghost" type="button" onClick={() => setOverrides({})}>
          初期状態にリセット
        </button>
      </div>
    </div>
  );
}

/** 中で例外が出てもページが白くならないよう、エラーバウンダリで包んで公開する。 */
export default withBoundary(TierList);
