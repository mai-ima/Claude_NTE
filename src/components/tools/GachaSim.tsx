/**
 * ガチャ・シミュレーター（すごろく式ボード）。
 * 検証済みモデル: 基礎S率1.87% → 70連でボード転換（19.59%へ上昇）→ 90連で確定。
 * すり抜け無し（注目バナーのSは常に注目キャラ）。1連=サイコロ1（円石160）。
 * 乱数は端末内のみ。結果は保存せずセッション内で完結（リセット可）。
 * 既定値は2026/6時点のコミュニティ情報。最新はゲーム内「詳細」を参照。
 */
import { useState } from 'preact/hooks';

const BASE = 0.0187; // 基礎S率
const SOFT = 0.1959; // 転換後S率
const SOFT_AT = 70; // ボード転換
const HARD_AT = 90; // 確定
const PER_DIE = 160; // 円石/サイコロ

interface Pull {
  n: number; // 通算何連目
  s: boolean; // S が出たか
  pityAtHit: number; // S のとき、何連でS（直前のSからの連数）
  guaranteed: boolean; // 90確定で出たか
  shifted: boolean; // 転換後(71+)で出たか
}

function rateAt(pity: number): number {
  // pity = 現在の天井カウント（次の1連は pity+1 連目）
  const pull = pity + 1;
  if (pull >= HARD_AT) return 1;
  if (pull > SOFT_AT) return SOFT;
  return BASE;
}

export default function GachaSim() {
  const [pity, setPity] = useState(0);
  const [total, setTotal] = useState(0);
  const [sCount, setSCount] = useState(0);
  const [last, setLast] = useState<Pull[]>([]); // 直近バッチ
  const [hits, setHits] = useState<Pull[]>([]); // S 履歴
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.dataset.motion === 'reduce');

  function pullOnce(p: number, n: number): Pull {
    const r = rateAt(p);
    const s = Math.random() < r;
    const pull = p + 1;
    return {
      n,
      s,
      pityAtHit: s ? pull : 0,
      guaranteed: s && pull >= HARD_AT,
      shifted: s && pull > SOFT_AT && pull < HARD_AT,
    };
  }

  function draw(count: number) {
    let p = pity;
    let n = total;
    let sc = sCount;
    const batch: Pull[] = [];
    const newHits: Pull[] = [];
    for (let i = 0; i < count; i++) {
      n += 1;
      const res = pullOnce(p, n);
      batch.push(res);
      if (res.s) {
        sc += 1;
        newHits.push(res);
        p = 0; // S で天井リセット
      } else {
        p += 1;
      }
    }
    setPity(p);
    setTotal(n);
    setSCount(sc);
    setLast(batch);
    if (newHits.length) setHits((h) => [...newHits.reverse(), ...h].slice(0, 30));
  }

  function reset() {
    setPity(0);
    setTotal(0);
    setSCount(0);
    setLast([]);
    setHits([]);
  }

  const toGuaranteed = Math.max(0, HARD_AT - pity);
  const spentDie = total;
  const spentAnnulith = total * PER_DIE;
  const avgPerS = sCount > 0 ? total / sCount : 0;
  // 期待値: 累積でこの連数までにS1体出る期待は概ね60〜62連。平均がそれより下なら引き強い。
  const luck =
    sCount === 0 ? null : avgPerS <= 55 ? '引きが強い！' : avgPerS >= 75 ? '渋め…' : 'ふつう';

  return (
    <div class="tool stack" style={{ gap: '16px' }}>
      {/* 状態バンド */}
      <section class="card card-pad">
        <div class="sim-stats">
          <div class="sim-stat">
            <span class="sim-num" style={{ color: 'var(--accent)' }}>{total}</span>
            <span class="muted text-sm">通算連数</span>
          </div>
          <div class="sim-stat">
            <span class="sim-num">{sCount}</span>
            <span class="muted text-sm">S獲得</span>
          </div>
          <div class="sim-stat">
            <span class="sim-num">{pity}</span>
            <span class="muted text-sm">現在の天井</span>
          </div>
          <div class="sim-stat">
            <span class="sim-num">{toGuaranteed}</span>
            <span class="muted text-sm">確定まで</span>
          </div>
        </div>
        {/* 天井プログレス */}
        <div class="progress" style={{ marginTop: '12px' }} role="progressbar" aria-valuenow={pity} aria-valuemax={HARD_AT}>
          <span style={{ width: `${(pity / HARD_AT) * 100}%` }} />
        </div>
        <div class="row row-between text-sm muted" style={{ marginTop: '4px' }}>
          <span>0</span>
          <span>転換 {SOFT_AT}</span>
          <span>確定 {HARD_AT}</span>
        </div>
      </section>

      {/* 引くボタン */}
      <div class="cluster" style={{ gap: '8px' }}>
        <button class="btn btn-primary" type="button" onClick={() => draw(1)}>1連 引く</button>
        <button class="btn btn-primary" type="button" onClick={() => draw(10)}>10連 引く</button>
        <button class="btn" type="button" onClick={() => draw(toGuaranteed || HARD_AT)}>確定まで（{toGuaranteed || HARD_AT}連）</button>
        <button class="btn btn-ghost" type="button" onClick={reset}>リセット</button>
      </div>

      {/* 直近の結果 */}
      {last.length > 0 && (
        <section class="tool-result">
          <p class="muted text-sm mt-0">直近の結果（{last.length}連）</p>
          <div class="sim-strip">
            {last.map((p) => (
              <span
                key={p.n}
                class={`sim-chip ${p.s ? 'is-s' : ''} ${p.s && !reduce ? 'pop' : ''}`}
                title={p.s ? `${p.n}連目: 注目S！` : `${p.n}連目`}
              >
                {p.s ? 'S' : '・'}
              </span>
            ))}
          </div>
          {last.some((p) => p.s) ? (
            <p class="text-sm" style={{ marginTop: '8px' }}>
              🎉 このバッチで <strong>{last.filter((p) => p.s).length}</strong> 体の注目Sを獲得！
            </p>
          ) : (
            <p class="text-sm muted" style={{ marginTop: '8px' }}>このバッチではSなし。天井が貯まっています。</p>
          )}
        </section>
      )}

      {/* 統計 */}
      {sCount > 0 && (
        <section class="card card-pad stack" style={{ gap: '8px' }}>
          <div class="row row-between text-sm">
            <span class="muted">平均何連でS</span>
            <span><strong>{avgPerS.toFixed(1)}</strong> 連/体 {luck && <span class="badge badge-accent" style={{ marginLeft: '6px' }}>{luck}</span>}</span>
          </div>
          <div class="row row-between text-sm">
            <span class="muted">消費</span>
            <span>サイコロ <strong>{spentDie}</strong> ／ 円石 <strong>{spentAnnulith.toLocaleString()}</strong></span>
          </div>
          {hits.length > 0 && (
            <div class="text-sm" style={{ marginTop: '4px' }}>
              <span class="muted">S獲得履歴: </span>
              {hits.slice(0, 12).map((h) => (
                <span key={h.n} class="badge" style={{ marginRight: '4px' }}>
                  {h.pityAtHit}連{h.guaranteed ? '(確定)' : h.shifted ? '(転換)' : ''}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <p class="hint">
        モデル: 基礎S率 {(BASE * 100).toFixed(2)}% → {SOFT_AT}連でボード転換（{(SOFT * 100).toFixed(2)}%）→ {HARD_AT}連で確定・すり抜け無し。
        あくまでシミュレーションで、実際の排出を保証しません。最新の確率はゲーム内「詳細」を参照（要確認）。
      </p>
    </div>
  );
}
