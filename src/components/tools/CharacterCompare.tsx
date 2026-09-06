/**
 * キャラ比較ツール。2〜4体を選んで属性・レア度・ロール・ティア・武器・実装・CV・
 * 隣接反応を横並びで比較。選択キャラ同士で成立する連環反応も表示する。
 * 表示データはすべて frontmatter（検証済み）由来。Tier はコミュニティ評価。
 */
import type { ComponentChildren } from 'preact';
import { useStore } from './useStore';
import { elementMeta, roleMeta, reactionsFor, DUO_REACTIONS } from '../../lib/nav';
import { cssVars } from '../../lib/css';
import { withBoundary } from './withBoundary';

export interface CmpChar {
  id: string;
  name: string;
  element: string;
  rarity: string;
  role: string;
  tier?: string;
  weapon?: string;
  version?: string;
  cv?: string;
  href: string;
}

const MAX = 4;

/** 2属性間で成立する Duo 反応（無ければ null） */
function reactionBetween(a: string, b: string) {
  return DUO_REACTIONS.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a)) ?? null;
}

function CharacterCompare({ characters }: { characters: CmpChar[] }) {
  const [ids, setIds] = useStore<string[]>('tool.compare.ids', []);
  const byId = (id: string) => characters.find((c) => c.id === id);
  const selected = ids.map(byId).filter(Boolean) as CmpChar[];

  function toggle(id: string) {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX) return prev; // 上限
      return [...prev, id];
    });
  }
  const clear = () => setIds([]);

  // 選択キャラ同士で成立する連環反応（隣接属性ペア）
  const pairs: { a: CmpChar; b: CmpChar; name: string; ja: string; effect: string }[] = [];
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const r = reactionBetween(selected[i].element, selected[j].element);
      if (r) pairs.push({ a: selected[i], b: selected[j], name: r.name, ja: r.ja, effect: r.effect });
    }
  }

  const rows: { label: string; render: (c: CmpChar) => ComponentChildren }[] = [
    { label: 'レア度', render: (c) => `${c.rarity}ランク` },
    {
      label: '属性',
      render: (c) => {
        const m = elementMeta(c.element);
        return (
          <span class="row" style={{ gap: '6px', justifyContent: 'center' }}>
            <span class="el-dot" style={cssVars({ '--el': m.hue })} />
            {m.label}（{m.en}）
          </span>
        );
      },
    },
    { label: 'ロール', render: (c) => roleMeta(c.role).label },
    { label: 'ティア', render: (c) => (c.tier ? <span class="badge badge-accent">{c.tier}</span> : '—') },
    { label: '武器(弧盤)', render: (c) => c.weapon ?? '—' },
    { label: '実装', render: (c) => c.version ?? '—' },
    { label: '声優', render: (c) => c.cv ?? '—' },
    {
      label: '起こせる反応',
      render: (c) => (
        <span class="text-sm">
          {reactionsFor(c.element).map((rx, i) => (
            <span key={rx.name}>
              {i > 0 && '・'}
              {rx.ja}
            </span>
          ))}
        </span>
      ),
    },
  ];

  return (
    <div class="tool stack" style={{ gap: '16px' }}>
      {/* 選択 */}
      <section class="card card-pad">
        <div class="row row-between" style={{ marginBottom: '8px' }}>
          <strong class="text-sm">比較するキャラを選択（最大{MAX}体）</strong>
          {selected.length > 0 && (
            <button class="btn btn-sm btn-ghost" type="button" onClick={clear}>クリア</button>
          )}
        </div>
        <div class="cmp-pick">
          {characters.map((c) => {
            const on = ids.includes(c.id);
            const m = elementMeta(c.element);
            const dis = !on && ids.length >= MAX;
            return (
              <button
                key={c.id}
                type="button"
                class={`chip ${on ? 'is-on' : ''}`}
                aria-pressed={on}
                disabled={dis}
                style={on ? cssVars({ '--el': m.hue }, { borderColor: m.hue }) : undefined}
                onClick={() => toggle(c.id)}
                title={dis ? `最大${MAX}体まで` : c.name}
              >
                <span class="el-dot" style={cssVars({ '--el': m.hue })} />
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {selected.length < 2 ? (
        <p class="empty">2体以上を選ぶと比較表が表示されます。</p>
      ) : (
        <>
          {/* 比較表 */}
          <div class="cmp-scroll">
            <table class="cmp-table">
              <thead>
                <tr>
                  <th class="cmp-rowhead" />
                  {selected.map((c) => {
                    const m = elementMeta(c.element);
                    return (
                      <th key={c.id} style={cssVars({ '--el': m.hue })}>
                        <a href={c.href} class="cmp-charhead">
                          <span class="cmp-avatar" style={cssVars({ '--el': m.hue })}>{c.name.slice(0, 1)}</span>
                          <span class="cmp-charname">{c.name}</span>
                        </a>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th class="cmp-rowhead">{r.label}</th>
                    {selected.map((c) => (
                      <td key={c.id}>{r.render(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 選択キャラ同士の連環反応 */}
          <section class="tool-result">
            <p class="muted text-sm mt-0">選択キャラ同士で起こせる連環反応（隣接属性）</p>
            {pairs.length === 0 ? (
              <p class="text-sm">この組み合わせでは隣接属性の反応は成立しません（属性が離れています）。</p>
            ) : (
              <ul class="text-sm" style={{ margin: 0, paddingLeft: '1.1em' }}>
                {pairs.map((p) => (
                  <li key={`${p.a.id}-${p.b.id}`}>
                    <strong>{p.a.name} ×️ {p.b.name}</strong>：<strong>{p.ja}</strong>（{p.name}）— {p.effect}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p class="hint">
        属性・ロール・武器・実装・声優は各キャラの登録データ（出典確認済み）に基づきます。ティアはコミュニティ評価の一例で変動します。
      </p>
    </div>
  );
}

/** 中で例外が出てもページが白くならないよう、エラーバウンダリで包んで公開する。 */
export default withBoundary(CharacterCompare);
