/** スタミナ/リソース計算: 全回復までの所要時間・到達時刻（汎用）。 */
import { useEffect, useState } from 'preact/hooks';

export default function Stamina() {
  const [current, setCurrent] = useState(80);
  const [max, setMax] = useState(240);
  const [perMin, setPerMin] = useState(6); // 1回復に要する分
  const [now, setNow] = useState(() => Date.now());

  // 表示用に1分ごとに現在時刻を更新
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const cur = Math.max(0, Math.floor(current));
  const mx = Math.max(0, Math.floor(max));
  const rate = Math.max(0, perMin); // 分/1回復

  const remainingPoints = Math.max(0, mx - cur);
  const minutesToFull = rate > 0 ? remainingPoints * rate : Infinity;
  const full = cur >= mx;

  const eta = isFinite(minutesToFull) ? new Date(now + minutesToFull * 60_000) : null;

  function fmtDuration(min: number): string {
    if (!isFinite(min)) return '—';
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    if (h === 0) return `${m}分`;
    return `${h}時間${m}分`;
  }

  return (
    <div class="tool">
      <div class="row" style={{ gap: '8px' }}>
        <div class="field" style={{ flex: 1, marginBottom: 0 }}>
          <label for="s-cur">現在値</label>
          <input id="s-cur" class="input" type="number" min={0} value={current}
            onInput={(e) => setCurrent(Number((e.target as HTMLInputElement).value) || 0)} />
        </div>
        <div class="field" style={{ flex: 1, marginBottom: 0 }}>
          <label for="s-max">最大値</label>
          <input id="s-max" class="input" type="number" min={0} value={max}
            onInput={(e) => setMax(Number((e.target as HTMLInputElement).value) || 0)} />
        </div>
      </div>
      <div class="field">
        <label for="s-rate">回復間隔（分/1ポイント）</label>
        <input id="s-rate" class="input" type="number" min={0} step={0.5} value={perMin}
          onInput={(e) => setPerMin(Number((e.target as HTMLInputElement).value) || 0)} />
        <span class="hint">ゲームの回復速度はご自身で入力してください。</span>
      </div>

      <div class="tool-result stack" style={{ gap: '10px' }}>
        {full ? (
          <p class="big" style={{ fontSize: '1.4rem' }}>すでに最大です</p>
        ) : (
          <>
            <div>
              <p class="muted text-sm mt-0">全回復までの所要時間</p>
              <p class="big">{fmtDuration(minutesToFull)}</p>
            </div>
            <div class="text-sm">
              <span class="muted">全回復の予定時刻: </span>
              <strong>{eta ? eta.toLocaleString('ja-JP', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : '—'}</strong>
            </div>
            <div class="text-sm muted">あと {remainingPoints} ポイント回復</div>
          </>
        )}
      </div>
    </div>
  );
}
