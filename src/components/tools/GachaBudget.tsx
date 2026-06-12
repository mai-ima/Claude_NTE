/**
 * ガチャ予算プランナー。
 * 目標連数・現在の天井カウント・所持円石/サイコロ・1日の円石収入から、
 * 必要円石／不足分／到達日数／課金目安（リフトクリスタル1:1）を算出する。
 * 数値は端末内(localStorage)に保存。既定値は2026/6時点のコミュニティ情報。
 */
import { useStore } from './useStore';

const PER_DIE = 160; // 円石160 = サイコロ1

export default function GachaBudget() {
  const [goal, setGoal] = useStore<number>('tool.budget.goal', 90); // 目標連数（90=確定）
  const [pity, setPity] = useStore<number>('tool.budget.pity', 0); // 現在の天井カウント
  const [annulith, setAnnulith] = useStore<number>('tool.budget.annulith', 0); // 所持円石
  const [dice, setDice] = useStore<number>('tool.budget.dice', 0); // 所持サイコロ
  const [perDay, setPerDay] = useStore<number>('tool.budget.perDay', 0); // 1日の円石収入

  const g = Math.max(1, Math.floor(goal) || 1);
  const p = Math.min(g, Math.max(0, Math.floor(pity)));
  const needPulls = Math.max(0, g - p); // 目標までに必要な連数
  const needDice = needPulls; // 1連=サイコロ1
  // 所持サイコロ＋（所持円石÷160）でまかなえる連数
  const haveDiceFromAnnulith = Math.floor(Math.max(0, annulith) / PER_DIE);
  const haveTotalDice = Math.max(0, Math.floor(dice)) + haveDiceFromAnnulith;
  const shortDice = Math.max(0, needDice - haveTotalDice); // 不足サイコロ
  const shortAnnulith = shortDice * PER_DIE; // 不足円石
  const daysToGoal = perDay > 0 ? Math.ceil(shortAnnulith / perDay) : Infinity;

  // 課金目安（円石→リフトクリスタル1:1のざっくり換算。実際のパック構成は要確認）
  const reachable = shortDice === 0;

  const num = (v: string) => Number(v) || 0;

  return (
    <div class="tool stack" style={{ gap: '16px' }}>
      <section class="card card-pad">
        <div class="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <label class="field" style={{ flex: '1 1 110px', marginBottom: 0 }}>
            <span class="text-sm">目標連数</span>
            <input class="input" type="number" min={1} value={goal} onInput={(e) => setGoal(num((e.target as HTMLInputElement).value))} />
          </label>
          <label class="field" style={{ flex: '1 1 110px', marginBottom: 0 }}>
            <span class="text-sm">現在の天井</span>
            <input class="input" type="number" min={0} value={pity} onInput={(e) => setPity(num((e.target as HTMLInputElement).value))} />
          </label>
        </div>
        <div class="row" style={{ gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          <label class="field" style={{ flex: '1 1 110px', marginBottom: 0 }}>
            <span class="text-sm">所持 円石</span>
            <input class="input" type="number" min={0} value={annulith} onInput={(e) => setAnnulith(num((e.target as HTMLInputElement).value))} />
          </label>
          <label class="field" style={{ flex: '1 1 110px', marginBottom: 0 }}>
            <span class="text-sm">所持 サイコロ</span>
            <input class="input" type="number" min={0} value={dice} onInput={(e) => setDice(num((e.target as HTMLInputElement).value))} />
          </label>
          <label class="field" style={{ flex: '1 1 110px', marginBottom: 0 }}>
            <span class="text-sm">1日の円石収入</span>
            <input class="input" type="number" min={0} value={perDay} onInput={(e) => setPerDay(num((e.target as HTMLInputElement).value))} />
          </label>
        </div>
        <p class="hint" style={{ marginTop: '8px' }}>
          目標90連＝注目S確定（すり抜け無し）。70連でボード転換（確率上昇）。円石160＝サイコロ1。
        </p>
      </section>

      <section class="tool-result stack" style={{ gap: '10px' }}>
        <div class="row row-between">
          <span class="muted text-sm">目標まで必要</span>
          <span>
            <strong class="big" style={{ fontSize: '1.5rem' }}>{needPulls}</strong> 連（サイコロ {needDice} 個）
          </span>
        </div>
        <div class="row row-between text-sm">
          <span class="muted">所持でまかなえる連数</span>
          <span>
            <strong>{haveTotalDice}</strong> 連
            <span class="muted">（サイコロ{Math.max(0, Math.floor(dice))}＋円石換算{haveDiceFromAnnulith}）</span>
          </span>
        </div>
        <div class="row row-between">
          <span class="muted text-sm">不足</span>
          <span>
            {reachable ? (
              <strong style={{ color: 'var(--success, #2f855a)' }}>到達可能！（不足なし）</strong>
            ) : (
              <span>
                サイコロ <strong>{shortDice}</strong> 個 ／ 円石 <strong>{shortAnnulith.toLocaleString()}</strong>
              </span>
            )}
          </span>
        </div>
        {!reachable && (
          <div class="row row-between text-sm">
            <span class="muted">日収から到達まで</span>
            <span>
              {isFinite(daysToGoal) ? (
                <strong>約 {daysToGoal} 日</strong>
              ) : (
                <span class="muted">（1日の円石収入を入力）</span>
              )}
            </span>
          </div>
        )}
      </section>

      <p class="hint">
        課金で補う場合の目安: 不足 {shortAnnulith.toLocaleString()} 円石 ぶんのリフトクリスタル（円石へ1:1変換）。
        実際のパック構成・レートはゲーム内表示が優先（要確認）。
      </p>
    </div>
  );
}
