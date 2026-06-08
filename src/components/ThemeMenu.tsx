/** テーマ切替メニュー（Preact アイランド）。ヘッダーに表示。 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { THEMES, getStoredTheme, setTheme, applyTheme, type Theme } from '../lib/theme';

const ICON: Record<Theme, string> = {
  minimal: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.36 6.36l-.7-.7M6.34 6.34l-.7-.7m12.72 0l-.7.7M6.34 17.66l-.7.7M12 8a4 4 0 100 8 4 4 0 000-8z',
  dark: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  soft: 'M12 2a7 7 0 00-4 12.74V17a2 2 0 002 2h4a2 2 0 002-2v-2.26A7 7 0 0012 2z',
  auto: 'M12 3a9 9 0 000 18zM12 3a9 9 0 010 18',
};

export default function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Theme>('minimal');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = getStoredTheme();
    setCurrent(t);
    applyTheme(t);
    // auto の場合 OS 配色変更に追従
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getStoredTheme() === 'auto') applyTheme('auto');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  function choose(t: Theme) {
    setTheme(t);
    setCurrent(t);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        class="btn btn-icon btn-ghost"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="テーマを変更"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ width: 18, height: 18 }}>
          <path d={ICON[current]} />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          class="card"
          style={{
            position: 'absolute',
            right: 0,
            top: '46px',
            width: '240px',
            padding: '6px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
          }}
        >
          {THEMES.map((t) => (
            <button
              key={t.value}
              role="menuitemradio"
              aria-checked={current === t.value}
              class="nav-link"
              style={{ width: '100%', textAlign: 'left', border: 0, background: 'transparent' }}
              onClick={() => choose(t.value)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ width: 18, height: 18, flex: 'none' }}>
                <path d={ICON[t.value]} />
              </svg>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>{t.label}</span>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--muted)' }}>{t.hint}</span>
              </span>
              {current === t.value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style={{ width: 16, height: 16, color: 'var(--accent)' }}>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
