/**
 * ガチャ天井トラッカー（NTE「Scarborough Fair」式）。
 * - ソフト天井70（Board Modification で確率上昇）/ ハード天井90（確定）/ 50:50なし。
 * - 出典の数値は既定値として入れているが、ユーザーが上書き可能。
 * - pity（最後のS以降の引き数）と履歴を端末内(localStorage)に保存。
 */
import { useStore } from './useStore';

interface PityState {
  pity: number;
  softAt: number;
  hardAt: number;
  baseRate: number; // %
  softRate: number; // %（ソフト天井後）
  annulithPerDie: number;
  history: { at: string; pity: number }[];
}

const DEFAULT: PityState = {
  pity: 0,
  softAt: 70,
  hardAt: 90,
  baseRate: 1.87,
  softRate: 19.59,
  annulithPerDie: 160,
  history: [],
};

export default function GachaPity() {
  const [s, set] = useStore<PityState>('tool.gachaPity', DEFAULT);

  const hardAt = Math.max(1, Math.floor(s.hardAt) || 1); // 0/空入力でも壊さない
  const pity = Math.min(Math.max(0, s.pity), hardAt);
  const inSoft = pity >= s.softAt;
  const toSoft = Math.max(0, s.softAt - pity);
  const toHard = Math.max(0, hardAt - pity);
  const curRate = inSoft ? s.softRate : s.baseRate;
  const diceToHard = toHard;
  const annulithToHard = diceToHard * s.annulithPerDie;

  const addPulls = (n: number) =>
    set((p) => ({ ...p, pity: Math.min(Math.max(1, Math.floor(p.hardAt) || 1), Math.max(0, p.pity + n)) }));

  const gotS = () =>
    set((p) => ({
      ...p,
      history: [{ at: new Date().toISOString(), pity: p.pity }, ...p.history].slice(0, 50),
      pity: 0,
    }));

  const resetPity = () => set((p) => ({ ...p, pity: 0 }));

  const num = (k: keyof PityState, v: string) =>
    set((p) => ({ ...p, [k]: Number(v) || 0 }) as PityState);

  const pct = Math.min(100, Math.round((pity / hardAt) * 100));

  return (
    <div class="tool">
      <div class="tool-result stack" style={{ gap: '12px' }}>
        <div class="row row-between">
          <div>
            <p class="muted text-sm mt-0">現在の天井カウント（最後のS以降）</p>
            <p class="big">
              {pity} <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/ {hardAt}</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p class="muted text-sm mt-0">現在のS排出率(目安)</p>
            <p class="big" style={{ fontSize: '1.4rem' }}>{curRate}%</p>
          </div>
        </div>
        <div class="progress" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div class="text-sm">
          {inSoft ? (
            <strong style={{ color: 'var(--accent)' }}>
              ソフト天井突入中（確率UP）。あと {toHard} 連で確定。
            </strong>
          ) : (
            <span>
              ソフト天井(70連)まで <strong>{toSoft}</strong> 連 / 確定(90連)まで{' '}
              <strong>{toHard}</strong> 連
            </span>
          )}
        </div>
        <div class="text-sm muted">
          確定までに必要: <strong>{diceToHard}</strong> ダイス（≒ {annulithToHard.toLocaleString()}{' '}
          Annulith）
        </div>
      </div>

      <div class="cluster">
        <button class="btn" type="button" onClick={() => addPulls(1)}>
          +1 連
        </button>
        <button class="btn" type="button" onClick={() => addPulls(10)}>
          +10 連
        </button>
        <button class="btn btn-sm" type="button" onClick={() => addPulls(-1)}>
          −1
        </button>
        <button class="btn btn-primary" type="button" onClick={gotS}>
          S入手（天井リセット）
        </button>
        <button class="btn btn-sm btn-ghost" type="button" onClick={resetPity}>
          カウントを0に
        </button>
      </div>

      <details>
        <summary class="text-sm muted" style={{ cursor: 'pointer' }}>
          天井・確率の数値を調整する
        </summary>
        <div class="row" style={{ gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <label class="field" style={{ flex: '1 1 120px', marginBottom: 0 }}>
            <span class="text-sm">ソフト天井</span>
            <input class="input" type="number" inputmode="decimal" value={s.softAt} onInput={(e) => num('softAt', (e.target as HTMLInputElement).value)} />
          </label>
          <label class="field" style={{ flex: '1 1 120px', marginBottom: 0 }}>
            <span class="text-sm">ハード天井</span>
            <input class="input" type="number" inputmode="decimal" value={s.hardAt} onInput={(e) => num('hardAt', (e.target as HTMLInputElement).value)} />
          </label>
          <label class="field" style={{ flex: '1 1 120px', marginBottom: 0 }}>
            <span class="text-sm">基礎S率(%)</span>
            <input class="input" type="number" inputmode="decimal" step={0.01} value={s.baseRate} onInput={(e) => num('baseRate', (e.target as HTMLInputElement).value)} />
          </label>
          <label class="field" style={{ flex: '1 1 120px', marginBottom: 0 }}>
            <span class="text-sm">天井後S率(%)</span>
            <input class="input" type="number" inputmode="decimal" step={0.01} value={s.softRate} onInput={(e) => num('softRate', (e.target as HTMLInputElement).value)} />
          </label>
          <label class="field" style={{ flex: '1 1 120px', marginBottom: 0 }}>
            <span class="text-sm">1ダイスの Annulith</span>
            <input class="input" type="number" inputmode="decimal" value={s.annulithPerDie} onInput={(e) => num('annulithPerDie', (e.target as HTMLInputElement).value)} />
          </label>
        </div>
        <p class="hint" style={{ marginTop: '8px' }}>
          既定値は2026年6月時点のコミュニティ情報（基礎1.87%→天井後19.59%、ソフト70/ハード90、限定はすり抜け無し）。
          ゲーム内の「詳細」で最新値をご確認ください。
        </p>
      </details>

      {s.history.length > 0 && (
        <div>
          <div class="row row-between" style={{ marginBottom: '6px' }}>
            <strong class="text-sm">S入手履歴</strong>
            <button class="btn btn-sm btn-ghost" type="button" onClick={() => set((p) => ({ ...p, history: [] }))}>
              履歴を消去
            </button>
          </div>
          <ul class="list-reset stack" style={{ gap: '4px' }}>
            {s.history.map((h, i) => (
              <li class="row row-between text-sm" key={`${h.at}-${i}`} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span class="muted">{new Date(h.at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span>
                  <strong>{h.pity}</strong> 連で入手
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
