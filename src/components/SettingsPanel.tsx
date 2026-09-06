/** 設定パネル: テーマ・新UI(ベータ)・表示/機能の追加設定・データのエクスポート/インポート/初期化。 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { THEMES, getStoredTheme, setTheme, applyTheme, type Theme } from '../lib/theme';
import { getStoredUI, setUI, applyUI, UI_MODES, type UIMode } from '../lib/ui';
import { PREFS, getPref, setPref, type PrefDef } from '../lib/prefs';
import { exportAll, importAll, clearAll } from '../lib/store';

type Msg = { kind: 'ok' | 'err'; text: string } | null;

/** 設定行のアイコン（lucide 風の inline-SVG パス）。Preact 用にアイコン依存を持たない。 */
const ICON_PATHS: Record<string, string> = {
  gauge: 'M12 14l4-4M3.34 19a10 10 0 1 1 17.32 0',
  link: 'M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  text: 'M17 6.1H3M21 12.1H3M15.1 18H3',
  alert: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z M12 9v4 M12 17h.01',
  pencil: 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
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

export default function SettingsPanel() {
  const [theme, setThemeState] = useState<Theme>('minimal');
  const [ui, setUIState] = useState<UIMode>('classic');
  const [prefs, setPrefsState] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setThemeState(getStoredTheme());
    setUIState(getStoredUI());
    setPrefsState(Object.fromEntries(PREFS.map((p) => [p.key, getPref(p.key)])));
    return () => {
      if (flashTimer.current !== undefined) window.clearTimeout(flashTimer.current);
    };
  }, []);

  function togglePref(key: string) {
    const next = !prefs[key];
    setPref(key, next);
    setPrefsState((s) => ({ ...s, [key]: next }));
  }

  const renderRow = (p: PrefDef) => (
    <label key={p.key} class="pref-row">
      <PrefIcon name={p.icon} />
      <span class="pref-text">
        <span class="pref-title">{p.label}</span>
        <span class="muted text-sm">{p.hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={prefs[p.key] ? 'true' : 'false'}
        aria-label={p.label}
        class={`pref-switch ${prefs[p.key] ? 'is-on' : ''}`}
        onClick={() => togglePref(p.key)}
      >
        <span class="pref-knob" aria-hidden="true" />
      </button>
    </label>
  );

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

      {/* 新UI（ベータ） */}
      <section class="card card-pad setting-card">
        <div class="setting-head">
          <div>
            <h2 class="mt-0">
              新UI <span class="beta-pill">BETA</span>
            </h2>
            <p class="muted text-sm">
              4種類の新デザインを試せます。配色テーマとは別に、全ページのレイアウト・質感を切り替えます。
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

      {/* テーマ */}
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

      {/* 表示・機能の追加設定（ベータ） */}
      <section class="card card-pad setting-card">
        <h2 class="mt-0">
          表示と機能 <span class="beta-pill">BETA</span>
        </h2>
        <p class="muted text-sm">
          読みやすさ・操作性のための切り替え。配色テーマや新UIとは別に、全ページへ反映されます。
        </p>

        <p class="pref-group-title">表示・読みやすさ</p>
        <div class="pref-list">{PREFS.filter((p) => p.group === 'reading').map(renderRow)}</div>

        <p class="pref-group-title">機能（ベータ）</p>
        <div class="pref-list">{PREFS.filter((p) => p.group === 'feature').map(renderRow)}</div>

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
