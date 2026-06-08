/** 確率/期待値: ガチャ等の一般的な確率計算（数値はユーザー入力）。 */
import { useState } from 'preact/hooks';

export default function Probability() {
  // 1回あたりの当選確率(%)
  const [rate, setRate] = useState(0.6);
  // 試行回数
  const [pulls, setPulls] = useState(90);

  const p = Math.min(1, Math.max(0, rate / 100));
  const n = Math.max(0, Math.floor(pulls));

  const atLeastOne = p === 0 ? 0 : 1 - Math.pow(1 - p, n); // n回で1回以上当たる確率
  const expectedHits = n * p; // n回での期待当選数
  const expectedTrials = p === 0 ? Infinity : 1 / p; // 期待試行回数(1回当てるまで)
  // 90%以上引くのに必要な試行回数: ceil(log(1-0.9)/log(1-p))
  const need90 =
    p === 0 || p === 1 ? (p === 1 ? 1 : Infinity) : Math.ceil(Math.log(1 - 0.9) / Math.log(1 - p));

  const fmtPct = (x: number) => `${(x * 100).toFixed(2)}%`;
  const fmtNum = (x: number) =>
    !isFinite(x) ? '—' : x.toLocaleString('ja-JP', { maximumFractionDigits: 2 });

  return (
    <div class="tool">
      <div class="field">
        <label for="p-rate">1回あたりの当選確率（%）</label>
        <input
          id="p-rate"
          class="input"
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={rate}
          onInput={(e) => setRate(Number((e.target as HTMLInputElement).value) || 0)}
        />
        <span class="hint">ゲーム内の確率はご自身で入力してください（当wikiでは固有値を断定しません）。</span>
      </div>
      <div class="field">
        <label for="p-pulls">試行回数</label>
        <input
          id="p-pulls"
          class="input"
          type="number"
          min={0}
          step={1}
          value={pulls}
          onInput={(e) => setPulls(Number((e.target as HTMLInputElement).value) || 0)}
        />
      </div>

      <div class="grid grid-cards">
        <div class="tool-result">
          <p class="muted text-sm mt-0">{n}回で1回以上当たる確率</p>
          <p class="big">{fmtPct(atLeastOne)}</p>
        </div>
        <div class="tool-result">
          <p class="muted text-sm mt-0">{n}回での期待当選数</p>
          <p class="big">{fmtNum(expectedHits)} 回</p>
        </div>
        <div class="tool-result">
          <p class="muted text-sm mt-0">1回当てるまでの期待試行回数</p>
          <p class="big">{fmtNum(expectedTrials)} 回</p>
        </div>
        <div class="tool-result">
          <p class="muted text-sm mt-0">90%の確率で当てるのに必要な試行回数</p>
          <p class="big">{fmtNum(need90)} 回</p>
        </div>
      </div>

      <details class="card card-pad">
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>計算式について</summary>
        <ul class="text-sm muted" style={{ marginTop: '8px' }}>
          <li>1回以上当たる確率 = 1 − (1 − p)ⁿ</li>
          <li>期待当選数 = n × p</li>
          <li>期待試行回数 = 1 / p</li>
          <li>90%到達に必要な回数 = ⌈ log(1−0.9) / log(1−p) ⌉</li>
        </ul>
        <p class="text-sm muted">※ 各試行が独立で確率一定の場合の一般式です。天井（保証）やピックアップ確率変動は含みません。</p>
      </details>
    </div>
  );
}
