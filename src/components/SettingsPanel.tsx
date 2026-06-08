/** 設定パネル: テーマ選択・データのエクスポート/インポート/初期化・PWAインストール。 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { THEMES, getStoredTheme, setTheme, applyTheme, type Theme } from '../lib/theme';
import { exportAll, importAll, clearAll } from '../lib/store';

type Msg = { kind: 'ok' | 'err'; text: string } | null;

export default function SettingsPanel() {
  const [theme, setThemeState] = useState<Theme>('minimal');
  const [msg, setMsg] = useState<Msg>(null);
  const [installEvt, setInstallEvt] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setThemeState(getStoredTheme());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function flash(kind: 'ok' | 'err', text: string) {
    setMsg({ kind, text });
    window.setTimeout(() => setMsg(null), 4000);
  }

  function choose(t: Theme) {
    setTheme(t);
    setThemeState(t);
    applyTheme(t);
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
    if (!confirm('メモ・ツール・個人メモなど、この端末に保存したデータをすべて削除します。よろしいですか？（テーマ設定は残ります）')) {
      return;
    }
    const n = clearAll();
    flash('ok', `${n} 件のデータを削除しました。`);
  }

  async function doInstall() {
    if (!installEvt) return;
    installEvt.prompt();
    try {
      await installEvt.userChoice;
    } catch {
      /* noop */
    }
    setInstallEvt(null);
  }

  return (
    <div class="stack" style={{ gap: '24px' }}>
      {msg && (
        <div
          class={`callout ${msg.kind === 'ok' ? 'callout-info' : 'callout-warning'}`}
          role="status"
        >
          <span>{msg.text}</span>
        </div>
      )}

      <section class="card card-pad">
        <h2 class="mt-0">テーマ</h2>
        <p class="muted text-sm">サイト全体の配色を選べます。</p>
        <div class="stack" style={{ marginTop: '12px', gap: '8px' }}>
          {THEMES.map((t) => (
            <label
              key={t.value}
              class="row"
              style={{
                gap: '12px',
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: theme === t.value ? 'var(--accent-weak)' : 'transparent',
                borderColor: theme === t.value ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <input
                type="radio"
                name="theme"
                checked={theme === t.value}
                onChange={() => choose(t.value)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 600 }}>{t.label}</span>
                <span class="muted text-sm">{t.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section class="card card-pad">
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

      <section class="card card-pad">
        <h2 class="mt-0">アプリとしてインストール</h2>
        <p class="muted text-sm">
          ホーム画面に追加すると、アプリのように起動でき、オフラインでも閲覧できます。
        </p>
        <div style={{ marginTop: '14px' }}>
          {installEvt ? (
            <button class="btn btn-primary" type="button" onClick={doInstall}>
              ホーム画面に追加
            </button>
          ) : (
            <p class="muted text-sm">
              ※ この端末ではブラウザのメニュー（「ホーム画面に追加」「アプリをインストール」）から追加できます。
              既にインストール済み、または非対応の場合はボタンは表示されません。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
