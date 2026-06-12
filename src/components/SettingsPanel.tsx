/** 設定パネル: テーマ・新UI(ベータ)・データのエクスポート/インポート/初期化。 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { THEMES, getStoredTheme, setTheme, applyTheme, type Theme } from '../lib/theme';
import { getStoredUI, setUI, applyUI, UI_MODES, type UIMode } from '../lib/ui';
import { exportAll, importAll, clearAll } from '../lib/store';

type Msg = { kind: 'ok' | 'err'; text: string } | null;

export default function SettingsPanel() {
  const [theme, setThemeState] = useState<Theme>('minimal');
  const [ui, setUIState] = useState<UIMode>('classic');
  const [msg, setMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setThemeState(getStoredTheme());
    setUIState(getStoredUI());
    return () => {
      if (flashTimer.current !== undefined) window.clearTimeout(flashTimer.current);
    };
  }, []);

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
    if (!confirm('メモ・ツール・個人メモなど、この端末に保存したデータをすべて削除します。よろしいですか？（テーマ・UI設定は残ります）')) {
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
