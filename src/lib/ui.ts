/**
 * UIモード（ベータ機能）の定義と適用ロジック。
 * - 'classic': 従来のUI（既定）
 * - 'beta'   : 新デザインUI（ベータ）。html[data-ui='beta'] でスタイルを切り替える。
 * テーマ（配色）とは独立して保存・適用される。
 */

export type UIMode = 'classic' | 'beta';

export const UI_KEY = 'nte.ui';
const DEFAULT_UI: UIMode = 'classic';

export function getStoredUI(): UIMode {
  try {
    const v = localStorage.getItem(UI_KEY) as UIMode | null;
    if (v === 'classic' || v === 'beta') return v;
  } catch {
    /* localStorage 不可環境は既定値 */
  }
  return DEFAULT_UI;
}

export function applyUI(mode: UIMode): void {
  document.documentElement.setAttribute('data-ui', mode);
}

export function setUI(mode: UIMode): void {
  try {
    localStorage.setItem(UI_KEY, mode);
  } catch {
    /* 保存不可でも適用は行う */
  }
  applyUI(mode);
}
