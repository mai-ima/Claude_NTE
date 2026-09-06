/** 設定パネル: 外観（テーマ・新UI）／読みやすさ／一覧／wiki／タッチ操作／機能／データ。 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { THEMES, getStoredTheme, setTheme, applyTheme, type Theme } from '../lib/theme';
import { getStoredUI, setUI, applyUI, UI_MODES, type UIMode } from '../lib/ui';
import { PREFS, getPref, getPrefValue, setPref, type PrefDef, type PrefGroup } from '../lib/prefs';
import { exportAll, importAll, clearAll } from '../lib/store';

type Msg = { kind: 'ok' | 'err'; text: string } | null;

/** 設定行のアイコン（lucide 風の inline-SVG パス）。Preact 用にアイコン依存を持たない。
 *  ※ PREFS に設定を足したら、その icon をここにも必ず足すこと。
 *    足し忘れてもエラーにはならず、静かに空アイコンになるだけなので気づきにくい。 */
const ICON_PATHS: Record<string, string> = {
  gauge: 'M12 14l4-4M3.34 19a10 10 0 1 1 17.32 0',
  link: 'M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  text: 'M17 6.1H3M21 12.1H3M15.1 18H3',
  alert: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z M12 9v4 M12 17h.01',
  pencil: 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
  type: 'M4 7V5h16v2 M9 19h6 M12 5v14',
  rows: 'M3 5h18 M3 12h18 M3 19h18',
  layout: 'M3 4h18v16H3z M3 10h18 M9 10v10',
  sort: 'M3 6h13 M3 12h9 M3 18h5 M18 9l3 3-3 3',
  library: 'M4 4h5v16H4z M11 4h5v16h-5z M18.5 5l2.5 14',
  touch: 'M9 11V5a2 2 0 1 1 4 0v6 M13 11V4a2 2 0 1 1 4 0v7 M17 11v-.5a2 2 0 1 1 4 0V16a6 6 0 0 1-6 6h-2a7 7 0 0 1-7-7v-3a2 2 0 1 1 4 0',
  panel: 'M3 4h18v16H3z M3 15h18',
  hand: 'M18 11V6a2 2 0 0 0-4 0v5 M14 10V4a2 2 0 0 0-4 0v7 M10 10.5V6a2 2 0 0 0-4 0v9 M6 14l-1.5-1.5a2 2 0 0 0-3 3L6 20a6 6 0 0 0 5 2h2a7 7 0 0 0 7-7v-4',
};

function PrefIcon({ name }: { name: string }) {
  return (
    <svg
      class="pref-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name] ?? ''} />
    </svg>
  );
}

// アイコンの足し忘れは無言で空アイコンになるので、開発時だけ気づけるようにする。
if (import.meta.env.DEV) {
  const missing = PREFS.filter((p) => !ICON_PATHS[p.icon]).map((p) => `${p.key}(${p.icon})`);
  if (missing.length) console.warn('[SettingsPanel] ICON_PATHS に無いアイコン:', missing.join(', '));
}

export default function SettingsPanel() {
  const [theme, setThemeState] = useState<Theme>('minimal');
  const [ui, setUIState] = useState<UIMode>('classic');
  /** toggle は boolean、choice は選択中の value を持つ */
  const [prefs, setPrefsState] = useState<Record<string, boolean | string>>({});
  const [isIOS, setIsIOS] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setThemeState(getStoredTheme());
    setUIState(getStoredUI());
    setPrefsState(
      Object.fromEntries(
        PREFS.map((p) => [p.key, p.type === 'choice' ? getPrefValue(p.key) : getPref(p.key)]),
      ),
    );
    setIsIOS(document.documentElement.hasAttribute('data-ios'));
    return () => {
      if (flashTimer.current !== undefined) window.clearTimeout(flashTimer.current);
    };
  }, []);

  function change(key: string, next: boolean | string) {
    setPref(key, next);
    setPrefsState((s) => ({ ...s, [key]: next }));
  }

  /** 設定1件を描画する（ON/OFF はスイッチ、多値はセグメンテッドコントロール） */
  const renderRow = (p: PrefDef) => (
    <div key={p.key} class={`pref-row ${p.type === 'choice' ? 'pref-row-choice' : ''}`}>
      <PrefIcon name={p.icon} />
      <span class="pref-text">
        <span class="pref-title">{p.label}</span>
        <span class="muted text-sm">{p.hint}</span>
      </span>
      {p.type === 'toggle' ? (
        <button
          type="button"
          role="switch"
          aria-checked={prefs[p.key] ? 'true' : 'false'}
          aria-label={p.label}
          class={`pref-switch ${prefs[p.key] ? 'is-on' : ''}`}
          onClick={() => change(p.key, !prefs[p.key])}
        >
          <span class="pref-knob" aria-hidden="true" />
        </button>
      ) : (
        <span class="pref-seg" role="radiogroup" aria-label={p.label}>
          {p.choices.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={prefs[p.key] === c.value ? 'true' : 'false'}
              class={`pref-seg-opt ${prefs[p.key] === c.value ? 'is-on' : ''}`}
              onClick={() => change(p.key, c.value)}
            >
              {c.label}
            </button>
          ))}
        </span>
      )}
    </div>
  );

  const groupOf = (g: PrefGroup) => PREFS.filter((p) => p.group === g);

  function flash(kind: 'ok' | 'err', text: string) {
    if (flashTimer.current !== undefined) window.clearTimeout(flashTimer.current);
    setMsg({ kind, text });
    flashTimer.current = window.setTimeout(() => setMsg(null), 4000);
  }

  function choose(t: Theme) {
    setTheme(t);
    setThemeState(t);
    applyTheme(t);
  }

  function chooseUI(mode: UIMode) {
    setUI(mode);
    setUIState(mode);
    applyUI(mode);
    const m = UI_MODES.find((x) => x.value === mode);
    flash('ok', mode === 'classic' ? '従来UIに戻しました。' : `新UI「${m?.label}」に切り替えました。`);
  }

  function doExport() {
    try {
      const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nte-wiki-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flash('ok', 'バックアップを書き出しました。');
    } catch {
      flash('err', 'エクスポートに失敗しました。');
    }
  }

  function onPickFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importAll(String(reader.result ?? ''));
      if (res.ok) flash('ok', `${res.imported} 件のデータを取り込みました。再読み込みで反映されます。`);
      else flash('err', res.error ?? 'インポートに失敗しました。');
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.onerror = () => flash('err', 'ファイルの読み込みに失敗しました。');
    reader.readAsText(file);
  }

  function doClear() {
    if (!confirm('メモ・ツール・個人メモなど、この端末に保存したデータをすべて削除します。よろしいですか？（テーマ・UI・表示設定は残ります）')) {
      return;
    }
    const n = clearAll();
    flash('ok', `${n} 件のデータを削除しました。`);
  }

  return (
    <div class="settings stack" style={{ gap: '20px' }}>
      {msg && (
        <div class={`toast ${msg.kind === 'ok' ? 'toast-ok' : 'toast-err'}`} role="status">
          <span aria-hidden="true">{msg.kind === 'ok' ? '✓' : '!'}</span>
          <span>{msg.text}</span>
        </div>
      )}

      {/* 配色テーマ */}
      <section class="card card-pad setting-card">
        <h2 class="mt-0">配色テーマ</h2>
        <p class="muted text-sm">サイト全体の配色を選べます。</p>
        <div class="theme-grid" style={{ marginTop: '12px' }}>
          {THEMES.map((t) => (
            <label key={t.value} class={`theme-opt ${theme === t.value ? 'is-active' : ''}`}>
              <input
                type="radio"
                name="theme"
                checked={theme === t.value}
                onChange={() => choose(t.value)}
              />
              <span class={`theme-swatch sw-${t.value}`} aria-hidden="true" />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 600 }}>{t.label}</span>
                <span class="muted text-sm">{t.hint}</span>
              </span>
              {theme === t.value && <span class="check" aria-hidden="true">✓</span>}
            </label>
          ))}
        </div>
      </section>

      {/* 新UI（ベータ） */}
      <section class="card card-pad setting-card">
        <div class="setting-head">
          <div>
            <h2 class="mt-0">
              新UI <span class="beta-pill">BETA</span>
            </h2>
            <p class="muted text-sm">
              8種類の新デザインを試せます。配色テーマとは別に、全ページのレイアウト・質感を切り替えます。
            </p>
          </div>
        </div>
        <div class="ui-switch" role="radiogroup" aria-label="UIモード">
          {UI_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              class={`ui-switch-opt ${ui === m.value ? 'is-active' : ''}`}
              aria-pressed={ui === m.value}
              onClick={() => chooseUI(m.value)}
            >
              <span class="ui-switch-title">
                {m.label} {m.beta && <span class="beta-pill">BETA</span>}
              </span>
              <span class="muted text-sm">{m.hint}</span>
            </button>
          ))}
        </div>
        <p class="hint" style={{ marginTop: '10px' }}>
          ベータのため一部表示が崩れる場合があります。いつでも従来UIに戻せます。
        </p>
      </section>

      {/* 読みやすさ */}
      <section class="card card-pad setting-card">
        <h2 class="mt-0">読みやすさ</h2>
        <p class="muted text-sm">
          記事本文の見え方を調整します。文字サイズと行間は本文だけに効くので、
          ナビや一覧のレイアウトは崩れません。
        </p>
        <div class="pref-list" style={{ marginTop: '10px' }}>{groupOf('reading').map(renderRow)}</div>
      </section>

      {/* 一覧の表示 */}
      <section class="card card-pad setting-card">
        <h2 class="mt-0">一覧の表示</h2>
        <p class="muted text-sm">
          キャラクターや用語などの一覧ページの見せ方を選べます。
        </p>
        <div class="pref-list" style={{ marginTop: '10px' }}>{groupOf('list').map(renderRow)}</div>
      </section>

      {/* wiki */}
      <section class="card card-pad setting-card">
        <h2 class="mt-0">wiki</h2>
        <p class="muted text-sm">
          このサイトは複数ゲームの wiki を並べて置けます。記事データは wiki ごとに完全に分かれています。
        </p>
        <div class="pref-list" style={{ marginTop: '10px' }}>{groupOf('wiki').map(renderRow)}</div>
        <p class="hint" style={{ marginTop: '10px' }}>
          <a href="/wikis/">wiki 一覧を開く</a> — 各 wiki の記事数や最近の更新をまとめて見られます。
        </p>
      </section>

      {/* タッチ操作（iPhone / iPad のときだけ出す） */}
      {isIOS && (
        <section class="card card-pad setting-card">
          <h2 class="mt-0">タッチ操作</h2>
          <p class="muted text-sm">
            iPhone / iPad で開いているときの操作感を調整します。
          </p>
          <div class="pref-list" style={{ marginTop: '10px' }}>{groupOf('touch').map(renderRow)}</div>
        </section>
      )}

      {/* 機能（ベータ） */}
      <section class="card card-pad setting-card">
        <h2 class="mt-0">
          機能 <span class="beta-pill">BETA</span>
        </h2>
        <div class="pref-list" style={{ marginTop: '10px' }}>{groupOf('feature').map(renderRow)}</div>
        <p class="hint" style={{ marginTop: '10px' }}>
          設定はこの端末に保存され、バックアップ（書き出し）にも含まれます。
        </p>
      </section>

      {/* データ */}
      <section class="card card-pad setting-card">
        <h2 class="mt-0">データのバックアップ</h2>
        <p class="muted text-sm">
          メモ・チェックリスト・個人メモなどは、この端末（localStorage）に保存されます。
          端末間で移す場合や消える前に、JSONで書き出してください。
        </p>
        <div class="cluster" style={{ marginTop: '14px' }}>
          <button class="btn btn-primary" type="button" onClick={doExport}>
            エクスポート（書き出し）
          </button>
          <button class="btn" type="button" onClick={() => fileRef.current?.click()}>
            インポート（取り込み）
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={onPickFile}
          />
          <button class="btn btn-danger" type="button" onClick={doClear}>
            データを初期化
          </button>
        </div>
      </section>
    </div>
  );
}
