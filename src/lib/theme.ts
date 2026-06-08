/** テーマの定義と適用ロジック（クライアント側で利用） */

export type Theme = 'minimal' | 'dark' | 'soft' | 'auto';

export const THEMES: { value: Theme; label: string; hint: string }[] = [
  { value: 'minimal', label: 'ミニマル / クリーン', hint: '明るく余白を活かした既定テーマ' },
  { value: 'dark', label: 'ダークモダン', hint: 'コントラストの効いた暗色' },
  { value: 'soft', label: 'ソフト / 温かみ', hint: '暖色・柔らかい角丸' },
  { value: 'auto', label: 'おまかせ（OS連動）', hint: '端末の配色設定に追従' },
];

export const THEME_KEY = 'nte.theme';
const DEFAULT_THEME: Theme = 'minimal';

/** theme-color メタタグの色（ブラウザUI連動）。auto は light 既定値を用いる */
const THEME_COLORS: Record<Theme, string> = {
  minimal: '#fafafa',
  dark: '#0f1115',
  soft: '#faf6f0',
  auto: '#fafafa',
};

export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY) as Theme | null;
    if (v && THEMES.some((t) => t.value === v)) return v;
  } catch {
    /* localStorage 不可環境は既定値 */
  }
  return DEFAULT_THEME;
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  let color = THEME_COLORS[theme];
  if (theme === 'auto') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    color = dark ? '#0f1115' : '#fafafa';
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* 保存不可でも適用は行う */
  }
  applyTheme(theme);
}
