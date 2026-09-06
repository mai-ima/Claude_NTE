/**
 * ガチャ計画ダッシュボード。
 * 現在の天井・所持円石/サイコロ・1日収入・目標から、「いつ何連引けるか」「目標到達日」
 * 「現在から注目Sを引ける累積確率」を1画面に統合。既存 gacha-odds/budget の検証済みモデルを集約。
 * 基礎S率0.99% → 70連でボード転換(19.59%) → 90連で確定・すり抜け無し。1連=サイコロ1（円石160）。
 */
import { useStore } from './useStore';
import { LineChart } from './chart';

// 出典: ゲームウィズ「ガチャの排出確率と仕様」ほか（2026-09 再確認）。
// ※ 以前ここを 1.87% としていたが誤り。実際の基礎S率は 0.99% で、
//    1.87% では「70連で73%引ける」と実際（約50%）よりかなり楽観的に出ていた。
const BASE = 0.0099;
const SOFT = 0.1959;
const SOFT_AT = 70;
const HARD_AT = 90;
const PER_DIE = 160;

export default function GachaDashboard() {
  const [pity, setPity] = useStore<number>('tool.dash.pity', 0);
  const [annulith, setAnnulith] = useStore<number>('tool.dash.annulith', 0);
  const [dice, setDice] = useStore<number>('tool.dash.dice', 0);
  const [perDay, setPerDay] = useStore<number>('tool.dash.perDay', 0);
  const [target, setTarget] = useStore<number>('tool.dash.target', 90);

  const num = (v: string) => Math.max(0, Number(v) || 0);
  const p = Math.min(HARD_AT, Math.max(0, Math.floor(pity)));
  const tgt = Math.min(HARD_AT, Math.max(1, Math.floor(target) || 1));

  // 所持で引ける連数
  const fromAnnulith = Math.floor(Math.max(0, annulith) / PER_DIE);
  const ownPulls = Math.max(0, Math.floor(dice)) + fromAnnulith;

  // 現在の天井からの1連あたりS率と累積確率
  const rateAt = (pull: number) => (pull >= HARD_AT ? 1 : pull > SOFT_AT ? SOFT : BASE);
  const maxK = HARD_AT - p;
  const cum: number[] = [0];
  let survive = 1;
  for (let k = 1; k <= maxK; k++) {
    survive *= 1 - rateAt(p + k);
    cum.push(1 - survive);
  }
  const probAtOwn = ownPulls >= maxK ? 1 : cum[Math.max(0, ownPulls)] ?? 0;

  // 目標到達まで
  const needPulls = Math.max(0, tgt - p);
  const shortDice = Math.max(0, needPulls - ownPulls);
  const shortAnnulith = shortDice * PER_DIE;
  const daysToTarget = shortDice === 0 ? 0 : perDay > 0 ? Math.ceil(shortAnnulith / perDay) : Infinity;

  // n% 到達に必要な連数
  const reach = (t: number) => {
    for (let k = 1; k < cum.length; k++) if (cum[k] >= t) return k;
    return maxK;
  };

  const markers = [];
  if (SOFT_AT - p > 0) markers.push({ x: SOFT_AT - p, label: `転換`, color: 'var(--accent)' });
  markers.push({ x: maxK, label: `確定`, color: 'var(--warning)' });
  if (ownPulls > 0 && ownPulls < maxK) markers.push({ x: ownPulls, label: `所持${ownPulls}`, color: 'var(--success, #2f855a)' });

  const field = (label: string, value: number, set: (n: number) => void, min = 0) => (
    <label class="field" style={{ flex: '1 1 100px', marginBottom: 0 }}>
      <span class="text-sm">{label}</span>
      <input class="input" type="number" inputmode="decimal" min={min} value={value} onInput={(e) => set(num((e.target as HTMLInputElement).value))} />
    </label>
  );

  return (
    <div class="tool stack" style={{ gap: '16px' }}>
      <section class="card card-pad">
        <div class="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          {field('現在の天井', pity, setPity)}
          {field('目標連数', target, setTarget, 1)}
        </div>
        <div class="row" style={{ gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          {field('所持 円石', annulith, setAnnulith)}
          {field('所持 サイコロ', dice, setDice)}
          {field('1日の円石収入', perDay, setPerDay)}
        </div>
      </section>

      {/* サマリーカード */}
      <div class="grid grid-cards">
        <div class="tool-result">
          <p class="muted text-sm mt-0">所持で引ける</p>
          <p class="big">{ownPulls} 連</p>
          <p class="text-sm muted">サイコロ{Math.max(0, Math.floor(dice))}＋円石換算{fromAnnulith}</p>
        </div>
        <div class="tool-result">
          <p class="muted text-sm mt-0">所持を使い切った時のS確率</p>
          <p class="big" style={{ color: 'var(--accent)' }}>{Math.round(probAtOwn * 100)}%</p>
          <p class="text-sm muted">現在{p}連 →{p + Math.min(ownPulls, maxK)}連</p>
        </div>
        <div class="tool-result">
          <p class="muted text-sm mt-0">確定（{tgt}連）まで</p>
          <p class="big">{needPulls} 連</p>
          <p class="text-sm muted">{shortDice === 0 ? '所持で到達可能！' : `不足 ${shortAnnulith.toLocaleString()} 円石`}</p>
        </div>
        <div class="tool-result">
          <p class="muted text-sm mt-0">日収から到達</p>
          <p class="big">{shortDice === 0 ? '達成' : isFinite(daysToTarget) ? `約${daysToTarget}日` : '—'}</p>
          <p class="text-sm muted">{!isFinite(daysToTarget) && shortDice > 0 ? '日収を入力' : `1日${perDay}円石`}</p>
        </div>
      </div>

      <section class="card card-pad">
        <div class="row row-between" style={{ marginBottom: '6px' }}>
          <strong class="text-sm">現在から注目Sを引ける累積確率</strong>
          <span class="muted text-sm">{p}連 → {HARD_AT}連</span>
        </div>
        <LineChart data={cum} markers={markers} xLabels={[{ x: 0, label: `${p}連` }, { x: maxK, label: `${HARD_AT}連` }]} />
        <div class="table-scroll" style={{ marginTop: '10px' }}>
          <table class="data-table">
            <thead><tr><th>到達確率</th><th>必要連数</th><th>必要円石</th></tr></thead>
            <tbody>
              {[0.5, 0.75, 0.9, 0.99].map((t) => {
                const k = reach(t);
                return (
                  <tr key={t}>
                    <td><strong>{Math.round(t * 100)}%</strong></td>
                    <td>{p + k}連（あと{k}）</td>
                    <td>{(k * PER_DIE).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p class="hint">
        各連が独立・確率一定（70連の転換後は上昇）と仮定した近似。90連で確定・すり抜け無し・円石160＝サイコロ1。
        既定値は2026年6月時点のコミュニティ情報で、最新はゲーム内「詳細」を参照（要確認）。
      </p>
    </div>
  );
}
