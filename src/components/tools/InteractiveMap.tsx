/**
 * インタラクティブ・マップ。
 * - 著作権配慮のため公式地図は同梱しない。オリジナルの簡易区画図をベースにする。
 * - 任意で自分用の地図画像URLを背景に設定可能（巨大データはlocalStorageに保存しないためURL参照のみ）。
 * - ピン（収集物・行き先など）を追加/チェック/削除でき、座標等の軽量データだけ端末内に保存。
 */
import { useRef, useState } from 'preact/hooks';
import { useStore } from './useStore';
import { uid } from '../../lib/store';

interface Pin {
  id: string;
  x: number; // 0-100 (%)
  y: number;
  label: string;
  cat: string;
  done: boolean;
}

const CATS = ['宝箱', 'アノマリー', '電話ボックス', 'ビューポイント', 'その他'];

export default function InteractiveMap() {
  const [pins, setPins] = useStore<Pin[]>('tool.map.pins', []);
  const [imgUrl, setImgUrl] = useStore<string>('tool.map.imgUrl', '');
  const [adding, setAdding] = useState(false);
  const [cat, setCat] = useState(CATS[0]);
  const [hideDone, setHideDone] = useState(false);
  const [imgError, setImgError] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const onMapClick = (e: MouseEvent) => {
    if (!adding || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    const label = prompt('ピンのラベル（任意）') ?? '';
    setPins((p) => [...p, { id: uid(), x, y, label, cat, done: false }]);
  };

  const toggle = (id: string) => setPins((p) => p.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const remove = (id: string) => {
    if (confirm('このピンを削除しますか？')) setPins((p) => p.filter((x) => x.id !== id));
  };

  // 長押し（モバイル/デスクトップ共通）で削除。発火したらタップのトグルは抑止する。
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const startPress = (id: string) => {
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      remove(id);
    }, 550);
  };
  const cancelPress = () => {
    if (pressTimer.current != null) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const visible = pins.filter((p) => !hideDone || !p.done);
  const doneCount = pins.filter((p) => p.done).length;

  return (
    <div class="tool">
      <div class="cluster">
        <button class="btn btn-sm" type="button" aria-pressed={adding} onClick={() => setAdding((v) => !v)}
          style={adding ? { background: 'var(--accent)', color: 'var(--accent-contrast)', borderColor: 'var(--accent)' } : undefined}>
          {adding ? 'ピン追加中…（地図をタップ）' : '＋ ピンを追加'}
        </button>
        <select class="select" style={{ width: 'auto' }} value={cat} onChange={(e) => setCat((e.target as HTMLSelectElement).value)}>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label class="row text-sm" style={{ gap: '6px' }}>
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone((e.target as HTMLInputElement).checked)} />
          完了を隠す
        </label>
        <span class="muted text-sm">{doneCount}/{pins.length} 完了</span>
      </div>

      <div class="map-wrap" ref={wrapRef} onClick={onMapClick} style={{ cursor: adding ? 'crosshair' : 'default' }}>
        {imgUrl && !imgError ? (
          <img src={imgUrl} alt="ユーザー設定の地図" onError={() => setImgError(true)} />
        ) : (
          <Schematic />
        )}
        {visible.map((p) => (
          <button
            key={p.id}
            type="button"
            class={`map-pin${p.done ? ' done' : ''}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            title={`${p.cat}${p.label ? ' / ' + p.label : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (longPressed.current) {
                longPressed.current = false;
                return; // 長押し削除直後のクリックは無視
              }
              toggle(p.id);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              startPress(p.id);
            }}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span aria-hidden="true">{p.done ? '✓' : '●'}</span>
          </button>
        ))}
      </div>

      <p class="hint">
        ピンを<strong>タップで完了/未完了</strong>、<strong>長押しで削除</strong>。区画図はオリジナルの概略図です（公式地図は権利配慮で非同梱）。
      </p>

      <details>
        <summary class="text-sm muted" style={{ cursor: 'pointer' }}>自分用の地図画像を背景にする（URL）</summary>
        <div class="field" style={{ marginTop: '8px' }}>
          <input class="input" placeholder="https://… の画像URL" value={imgUrl} onInput={(e) => { setImgError(false); setImgUrl((e.target as HTMLInputElement).value); }} />
          <span class="hint">画像URLのみ保存します（画像データ自体は保存しません）。空にすると概略図に戻ります。</span>
        </div>
      </details>

      {pins.length > 0 && (
        <button class="btn btn-sm btn-danger" type="button" onClick={() => confirm('すべてのピンを削除しますか？') && setPins([])}>
          すべてのピンを削除
        </button>
      )}
    </div>
  );
}

/** オリジナルの簡易区画図（ヘテロシティ4区＋ヒナタ島の概念図） */
function Schematic() {
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label="ヘテロシティ概略図">
      <rect x="0" y="0" width="400" height="300" fill="var(--surface-2)" />
      {/* 海 */}
      <rect x="0" y="0" width="400" height="300" fill="color-mix(in srgb, var(--accent) 6%, transparent)" />
      {/* 4区 */}
      <g stroke="var(--border)" stroke-width="1.5">
        <rect x="20" y="30" width="160" height="110" rx="8" fill="color-mix(in srgb, #10b981 14%, var(--surface))" />
        <rect x="200" y="30" width="180" height="110" rx="8" fill="color-mix(in srgb, #6366f1 14%, var(--surface))" />
        <rect x="20" y="160" width="160" height="110" rx="8" fill="color-mix(in srgb, #f59e0b 14%, var(--surface))" />
        <rect x="200" y="160" width="120" height="110" rx="8" fill="color-mix(in srgb, #a855f7 14%, var(--surface))" />
        {/* 島 */}
        <circle cx="358" cy="225" r="30" fill="color-mix(in srgb, #06b6d4 18%, var(--surface))" />
      </g>
      <g fill="var(--text)" font-size="12" font-weight="700" text-anchor="middle" font-family="sans-serif">
        <text x="100" y="88">未聞浦</text>
        <text x="290" y="88">ニューホランド</text>
        <text x="100" y="218">ミゲル区</text>
        <text x="260" y="218">橋間地</text>
        <text x="358" y="226" font-size="10">ヒナタ島</text>
      </g>
    </svg>
  );
}
