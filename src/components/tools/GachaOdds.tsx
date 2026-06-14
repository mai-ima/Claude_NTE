/**
 * ガチャ確率グラフ。
 * - 天井込み（70でボード転換＝確率上昇、90で確定）の「n連までに注目Sを引ける累積確率」を折れ線表示。
 * - 期待連数・必要円石、50/75/90/99%到達ライン、汎用の「1回以上当たる確率」計算。
 * 既定値は2026/6時点のコミュニティ情報。ゲーム内で最新値をご確認ください。
 */
import { useState } from 'preact/hooks';
import { LineChart } from './chart';

export default function GachaOdds() {
  const [base, setBase] = useState(1.87);
  const [soft, setSoft] = useState(19.59);
  const [softAt, setSoftAt] = useState(70);
  const [hardAt, setHardAt] = useState(90);
  const [pity, setPity] = useState(0);
  const [perDie, setPerDie] = useState(160);

  const p0 = Math.min(1, Math.max(0, base / 100));
  const p1 = Math.min(1, Math.max(0, soft / 100));
  const start = Math.min(Math.max(0, pity), hardAt);

  // 絶対pull番号(1始まり)での1連あたり確率
  const rateAt = (pull: number) => (pull >= hardAt ? 1 : pull > softAt ? p1 : p0);

  // start から先の累積確率（k連目までに引ける確率）
  const maxK = hardAt - start;
  const cum: number[] = [];
  let survive = 1;
  cum.push(0);
  for (let k = 1; k <= maxK; k++) {
    survive *= 1 - rateAt(start + k);
    cum.push(1 - survive);
  }
  // 期待連数（最初の1体まで）
  let expected = 0;
  let s = 1;
  for (let k = 0; k < maxK; k++) {
    expected += s;
    s *= 1 - rateAt(start + k + 1);
  }
  const expDie = expected * perDie;

  // n% 到達に必要な連数
  const reach = (target: number) => {
    for (let k = 1; k < cum.length; k++) if (cum[k] >= target) return k;
    return maxK;
  };

  const markers = [];
  if (softAt - start > 0 && softAt < hardAt) markers.push({ x: softAt - start, label: `転換${softAt}`, color: 'var(--accent)' });
  markers.push({ x: hardAt - start, label: `確定${hardAt}`, color: 'var(--warning)' });

  const xLabels = [
    { x: 0, label: `${start}連` },
    { x: maxK, label: `${hardAt}連` },
  ];

  const num = (setter: (n: number) => void) => (e: Event) =>
    setter(Number((e.target as HTMLInputElement).value) || 0);

  return (
    <div class="tool">
      <div class="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
        <label class="field" style={{ flex: '1 1 90px', marginBottom: 0 }}>
          <span class="text-sm">現在の天井</span>
          <input class="input" type="number" inputmode="decimal" min={0} value={pity} onInput={num(setPity)} />
        </label>
        <label class="field" style={{ flex: '1 1 90px', marginBottom: 0 }}>
          <span class="text-sm">基礎S率(%)</span>
          <input class="input" type="number" inputmode="decimal" step={0.01} value={base} onInput={num(setBase)} />
        </label>
        <label class="field" style={{ flex: '1 1 90px', marginBottom: 0 }}>
          <span class="text-sm">転換後S率(%)</span>
          <input class="input" type="number" inputmode="decimal" step={0.01} value={soft} onInput={num(setSoft)} />
        </label>
      </div>

      <div class="card card-pad">
        <div class="row row-between" style={{ marginBottom: '6px' }}>
          <strong class="text-sm">注目Sを引ける累積確率</strong>
          <span class="muted text-sm">現在 {start} 連から</span>
        </div>
        <LineChart data={cum} markers={markers} xLabels={xLabels} />
      </div>

      <div class="grid grid-cards">
        <div class="tool-result">
          <p class="muted text-sm mt-0">期待連数（最初の1体）</p>
          <p class="big">{expected.toFixed(1)} 連</p>
        </div>
        <div class="tool-result">
          <p class="muted text-sm mt-0">期待で必要な円石</p>
          <p class="big" style={{ fontSize: '1.5rem' }}>{Math.round(expDie).toLocaleString()}</p>
        </div>
      </div>

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr><th>到達確率</th><th>必要な連数</th><th>必要な円石</th></tr>
          </thead>
          <tbody>
            {[0.5, 0.75, 0.9, 0.99].map((t) => {
              const k = reach(t);
              return (
                <tr key={t}>
                  <td><strong>{Math.round(t * 100)}%</strong></td>
                  <td>{start + k} 連（あと {k}）</td>
                  <td>{(k * perDie).toLocaleString()} 円石</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details>
        <summary class="text-sm muted" style={{ cursor: 'pointer' }}>天井・円石レートを調整 / 計算式</summary>
        <div class="row" style={{ gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <label class="field" style={{ flex: '1 1 100px', marginBottom: 0 }}>
            <span class="text-sm">転換(ソフト)</span>
            <input class="input" type="number" inputmode="decimal" value={softAt} onInput={num(setSoftAt)} />
          </label>
          <label class="field" style={{ flex: '1 1 100px', marginBottom: 0 }}>
            <span class="text-sm">確定(ハード)</span>
            <input class="input" type="number" inputmode="decimal" value={hardAt} onInput={num(setHardAt)} />
          </label>
          <label class="field" style={{ flex: '1 1 100px', marginBottom: 0 }}>
            <span class="text-sm">1ダイスの円石</span>
            <input class="input" type="number" inputmode="decimal" value={perDie} onInput={num(setPerDie)} />
          </label>
        </div>
        <ul class="text-sm muted" style={{ marginTop: '8px' }}>
          <li>各連が独立・確率一定（転換後は確率上昇）と仮定した近似です。</li>
          <li>累積確率 = 1 −∏(1 − 各連の確率)、{hardAt}連で確定（100%）。</li>
        </ul>
      </details>
      <p class="hint">既定値は2026年6月時点のコミュニティ情報。最新値はゲーム内「詳細」で確認してください。</p>
    </div>
  );
}
