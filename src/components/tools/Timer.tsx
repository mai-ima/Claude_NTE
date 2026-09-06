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
  /** 終了したことを画面でも伝える。OS通知を拒否している人にはこれが唯一の合図になる */
  const [done, setDone] = useState(false);
  const endRef = useRef<number>(0);
  /** タイトルを書き換える前の文言。戻すために覚えておく */
  const titleRef = useRef<string>('');

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.max(0, (endRef.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) {
        setRunning(false);
        setDone(true);
        notify();
      }
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [running]);

  // 終了したらタブのタイトルを書き換える。別のタブを見ていても気づけるように。
  useEffect(() => {
    if (!done) return;
    titleRef.current ||= document.title;
    document.title = `⏰ タイマー終了 — ${titleRef.current}`;
    return () => {
      if (titleRef.current) document.title = titleRef.current;
    };
  }, [done]);

  /**
   * 終了を知らせる。
   *
   * 以前は OS の通知だけだったので、**通知を拒否している人には何も起きなかった**。
   * 権限の要らない手段（画面の表示・音・タブのタイトル）を必ず併用する。
   */
  function notify() {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('タイマー終了', { body: '設定した時間が経過しました。' });
      }
    } catch {
      /* 通知不可でも無視 */
    }
    beep();
  }

  /**
   * 短いビープ音。音声ファイルを持たずに Web Audio で鳴らす。
   * 「開始」を押した操作の延長なので、ブラウザの自動再生制限には掛からない。
   * 端末がマナーモードなどで鳴らなくても、画面表示とタイトルで伝わる。
   */
  function beep() {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      // 耳に痛くない音量で、0.6秒かけて減衰させる
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.62);
      osc.onended = () => ctx.close().catch(() => {});
    } catch {
      /* 音が出せない環境でも画面表示で伝わる */
    }
  }

  function start() {
    const total = inputMin * 60 + inputSec;
    if (total <= 0) return;
    setDone(false);
    endRef.current = Date.now() + (remaining > 0 && remaining < total ? remaining : total) * 1000;
    setRemaining(remaining > 0 && remaining < total ? remaining : total);
    setRunning(true);
    if ('Notification' in window && Notification.permission === 'default') {
      // 旧Safari はコールバック型で undefined を返すため Promise.resolve で包む。
      try {
        Promise.resolve(Notification.requestPermission()).catch(() => {});
      } catch {
        /* noop */
      }
    }
  }
  function pause() {
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setRemaining(0);
    setDone(false);
  }

  // --- 汎用カウンター（永続化） ---
  const [count, setCount] = useStore<number>('tool.counter', 0);

  return (
    <div class="tool">
      <section class="card card-pad stack">
        <h3 class="mt-0">カウントダウン</h3>
        {/* `class:list` は Astro の記法。Preact のアイランドでは使えないので素の文字列で組む。 */}
        <div class={`tool-result${done ? ' is-done' : ''}`} style={{ textAlign: 'center' }}>
          <span class="big" style={{ fontSize: '2.6rem' }}>{fmt(remaining)}</span>
        </div>
        {/* OS通知を拒否している人にはこれが唯一の合図になる。role="alert" で読み上げにも届く。 */}
        {done && (
          <p class="callout callout-success" role="alert">
            <strong>時間になりました。</strong> 設定した時間が経過しました。
          </p>
        )}
        <div class="row" style={{ gap: '8px' }}>
          <div class="field" style={{ flex: 1, marginBottom: 0 }}>
            <label for="t-min">分</label>
            <input
              id="t-min"
              class="input"
              type="number" inputmode="decimal"
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
              type="number" inputmode="decimal"
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
          {/* 周回数・素材数を数えるものなので負にはしない */}
          <button class="btn btn-icon" type="button" onClick={() => setCount((c) => Math.max(0, c - 1))} aria-label="減らす">
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
