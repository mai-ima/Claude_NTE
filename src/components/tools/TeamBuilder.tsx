/**
 * チームビルダー（4人編成）。
 * - キャラを選ぶと、エスパーサイクル（属性リング）で発動可能な反応と、
 *   ロール（DPS/サバイバル/バフ）の過不足を可視化する。
 * - 編成は端末内(localStorage)に保存。
 */
import { useStore } from './useStore';

export interface TeamChar {
  id: string;
  name: string;
  element: string;
  role: string;
  rarity: string;
  el: string;
}

// 隣接ペアの Duo 反応 + Trio 反応（出典: zeroluck / Mobalytics 等, 2026/6）
const DUO: { name: string; a: string; b: string; note: string }[] = [
  { name: 'Remora', a: 'Lakshana', b: 'Cosmos', note: '対象を鈍化・マーク' },
  { name: 'Blossom', a: 'Cosmos', b: 'Anima', note: 'AoE追撃' },
  { name: 'Hexed', a: 'Anima', b: 'Incantation', note: '蓄積ダメージを一括解放' },
  { name: 'Scorch', a: 'Incantation', b: 'Chaos', note: '継続ダメージ(DoT)' },
  { name: 'Nova', a: 'Chaos', b: 'Psyche', note: '遅延爆発(メンタル)' },
  { name: 'Stain', a: 'Psyche', b: 'Lakshana', note: '被ダメージ増加' },
];
const TRIO: { name: string; els: string[]; note: string }[] = [
  { name: 'Charge', els: ['Cosmos', 'Anima', 'Lakshana'], note: 'アルティメットエネルギー獲得' },
  { name: 'Discord', els: ['Chaos', 'Psyche', 'Incantation'], note: 'ブレイク値を削る' },
];

const ROLE_JA: Record<string, string> = { DPS: 'アタッカー', Survival: 'サバイバル', Buff: 'バフ' };

export default function TeamBuilder({ characters }: { characters: TeamChar[] }) {
  const [team, setTeam] = useStore<string[]>('tool.teamBuilder', []);

  const picked = team.map((id) => characters.find((c) => c.id === id)).filter(Boolean) as TeamChar[];
  const elements = new Set(picked.map((c) => c.element));

  const toggle = (id: string) =>
    setTeam((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 4 ? p : [...p, id]));

  const duos = DUO.filter((r) => elements.has(r.a) && elements.has(r.b));
  const trios = TRIO.filter((r) => r.els.every((e) => elements.has(e)));

  const roleCount = (role: string) => picked.filter((c) => c.role === role).length;
  const warnings: string[] = [];
  if (picked.length === 4) {
    if (roleCount('Survival') === 0) warnings.push('サバイバル（回復/防御）がいません。');
    if (roleCount('Buff') === 0) warnings.push('バッファー（支援）がいません。火力の底上げが弱めです。');
    if (roleCount('DPS') === 0) warnings.push('アタッカーがいません。');
    if (duos.length === 0) warnings.push('属性反応が成立しません。隣り合う属性を組み合わせましょう。');
  }

  return (
    <div class="tool">
      {/* 編成スロット */}
      <div class="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
        {[0, 1, 2, 3].map((i) => {
          const c = picked[i];
          return (
            <div
              key={i}
              class="card"
              style={{ flex: '1 1 70px', minWidth: '70px', aspectRatio: '3/4', display: 'grid', placeItems: 'center', padding: '6px', textAlign: 'center', borderStyle: c ? 'solid' : 'dashed', borderColor: c ? c.el : 'var(--border)' }}
            >
              {c ? (
                <button type="button" class="list-reset" style={{ background: 'transparent', border: 0, cursor: 'pointer' }} onClick={() => toggle(c.id)}>
                  <span class="el-dot" style={{ ['--el' as any]: c.el, margin: '0 auto 4px' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{c.name}</div>
                  <div class="muted" style={{ fontSize: '0.66rem' }}>{ROLE_JA[c.role] ?? c.role}</div>
                </button>
              ) : (
                <span class="muted text-sm">空き</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 反応 & ロール */}
      <div class="tool-result stack" style={{ gap: '10px' }}>
        <div>
          <p class="muted text-sm mt-0">発動可能な属性反応</p>
          {picked.length < 2 ? (
            <p class="text-sm">2人以上選ぶと表示されます。</p>
          ) : duos.length === 0 && trios.length === 0 ? (
            <p class="text-sm">成立する反応がありません。</p>
          ) : (
            <div class="cluster" style={{ marginTop: '4px' }}>
              {duos.map((r) => (
                <span class="badge badge-accent" title={r.note} key={r.name}>{r.name}</span>
              ))}
              {trios.map((r) => (
                <span class="badge" style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }} title={r.note} key={r.name}>
                  {r.name}（トリオ）
                </span>
              ))}
            </div>
          )}
        </div>
        <div class="text-sm">
          ロール構成: アタッカー {roleCount('DPS')} ・ サバイバル {roleCount('Survival')} ・ バフ {roleCount('Buff')}
        </div>
        {warnings.length > 0 && (
          <ul class="text-sm" style={{ margin: 0, paddingLeft: '1.1em', color: 'var(--warning)' }}>
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        )}
      </div>

      {/* キャラ選択 */}
      <div>
        <div class="row row-between" style={{ marginBottom: '8px' }}>
          <strong class="text-sm">キャラを選ぶ（最大4人）</strong>
          {team.length > 0 && (
            <button class="btn btn-sm btn-ghost" type="button" onClick={() => setTeam([])}>クリア</button>
          )}
        </div>
        <div class="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '8px' }}>
          {characters.map((c) => {
            const on = team.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                class="card card-pad"
                style={{ textAlign: 'left', cursor: 'pointer', padding: '10px', borderColor: on ? c.el : 'var(--border)', background: on ? 'var(--accent-weak)' : undefined }}
                aria-pressed={on}
                onClick={() => toggle(c.id)}
              >
                <div class="row" style={{ gap: '6px' }}>
                  <span class="el-dot" style={{ ['--el' as any]: c.el }} />
                  <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{c.name}</span>
                </div>
                <div class="muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                  {c.rarity} ・ {ROLE_JA[c.role] ?? c.role}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
