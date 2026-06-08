/** タイマー/カウンター: カウントダウンと汎用カウンター。 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from './useStore';

function fmt(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export default function Timer() {
  // --- カウントダウン ---
  const [inputMin, setInputMin] = useState(5);
  const [inputSec, setInputSec] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const endRef = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, (endRef.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        notify();
      }
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [running]);

  function notify() {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('タイマー終了', { body: '設定した時間が経過しました。' });
      }
    } catch {
      /* 通知不可でも無視 */
    }
  }

  function start() {
    const total = inputMin * 60 + inputSec;
    if (total <= 0) return;
    endRef.current = Date.now() + (remaining > 0 && remaining < total ? remaining : total) * 1000;
    setRemaining(remaining > 0 && remaining < total ? remaining : total);
    setRunning(true);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }
  function pause() {
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setRemaining(0);
  }

  // --- 汎用カウンター（永続化） ---
  const [count, setCount] = useStore<number>('tool.counter', 0);

  return (
    <div class="tool">
      <section class="card card-pad stack">
        <h3 class="mt-0">カウントダウン</h3>
        <div class="tool-result" style={{ textAlign: 'center' }}>
          <span class="big" style={{ fontSize: '2.6rem' }}>{fmt(remaining)}</span>
        </div>
        <div class="row" style={{ gap: '8px' }}>
          <div class="field" style={{ flex: 1, marginBottom: 0 }}>
            <label for="t-min">分</label>
            <input
              id="t-min"
              class="input"
              type="number"
              min={0}
              max={999}
              value={inputMin}
              onInput={(e) => setInputMin(Math.max(0, Number((e.target as HTMLInputElement).value) || 0))}
            />
          </div>
          <div class="field" style={{ flex: 1, marginBottom: 0 }}>
            <label for="t-sec">秒</label>
            <input
              id="t-sec"
              class="input"
              type="number"
              min={0}
              max={59}
              value={inputSec}
              onInput={(e) => setInputSec(Math.min(59, Math.max(0, Number((e.target as HTMLInputElement).value) || 0)))}
            />
          </div>
        </div>
        <div class="row" style={{ gap: '8px' }}>
          {!running ? (
            <button class="btn btn-primary" type="button" onClick={start} style={{ flex: 1 }}>
              {remaining > 0 ? '再開' : '開始'}
            </button>
          ) : (
            <button class="btn" type="button" onClick={pause} style={{ flex: 1 }}>
              一時停止
            </button>
          )}
          <button class="btn" type="button" onClick={reset}>
            リセット
          </button>
        </div>
      </section>

      <section class="card card-pad stack">
        <h3 class="mt-0">カウンター</h3>
        <p class="muted text-sm">周回数・素材数などを数える（自動保存）。</p>
        <div class="row" style={{ justifyContent: 'center', gap: '16px' }}>
          <button class="btn btn-icon" type="button" onClick={() => setCount((c) => c - 1)} aria-label="減らす">
            −
          </button>
          <span class="big" style={{ minWidth: '3ch', textAlign: 'center' }}>{count}</span>
          <button class="btn btn-icon btn-primary" type="button" onClick={() => setCount((c) => c + 1)} aria-label="増やす">
            ＋
          </button>
        </div>
        <div class="row" style={{ justifyContent: 'center' }}>
          <button class="btn btn-sm" type="button" onClick={() => setCount(0)}>
            0にリセット
          </button>
        </div>
      </section>
    </div>
  );
}
