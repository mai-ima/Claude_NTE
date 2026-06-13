/**
 * UIモード（ベータ機能）の定義と適用ロジック。
 * - 'classic'  : 従来のUI（既定）
 * - 'editorial': 紙の特集記事風（太罫線・ハードシャドウ・活字タイポ）
 * - 'liquid'   : 本格リキッドグラス（厚い曇りガラス・カプセル形状）
 * - 'aurora'   : オーロラグラデーション＋グロー
 * - 'apple'    : Apple HIG 風のクリーンなフラット（仮称）
 * html[data-ui='<mode>'] でスタイルを切り替える。テーマ（配色）とは独立。
 */

export type UIMode =
  | 'classic'
  | 'editorial'
  | 'liquid'
  | 'aurora'
  | 'apple'
  | 'terminal'
  | 'clay'
  | 'blueprint';

export const UI_KEY = 'nte.ui';
const DEFAULT_UI: UIMode = 'classic';

export const UI_MODES: { value: UIMode; label: string; hint: string; beta: boolean }[] = [
  { value: 'classic', label: '従来UI', hint: 'これまでのシンプルな表示', beta: false },
  { value: 'editorial', label: 'Editorial', hint: '紙の特集記事風。太い罫線とハードシャドウ', beta: true },
  { value: 'liquid', label: 'Liquid Glass', hint: '本格リキッドグラス。厚い曇りガラスとカプセル', beta: true },
  { value: 'aurora', label: 'Aurora Glass', hint: 'オーロラグラデーションとグロー', beta: true },
  { value: 'apple', label: 'Apple（仮称）', hint: 'HIG風のクリーンなフラットデザイン', beta: true },
  { value: 'terminal', label: 'Terminal', hint: 'レトロCRT/端末風。等幅・走査線・記号UI', beta: true },
  { value: 'clay', label: 'Clay', hint: 'やわらかニューモーフィズム。ぷっくり3D', beta: true },
  { value: 'blueprint', label: 'Blueprint', hint: '製図/設計図風。方眼と四隅のティック', beta: true },
];

const VALID: UIMode[] = UI_MODES.map((m) => m.value);

export function getStoredUI(): UIMode {
  try {
    const v = localStorage.getItem(UI_KEY);
    if (v === 'beta') return 'editorial'; // 旧「新UI(ベータ)」からの移行
    if (VALID.includes(v as UIMode)) return v as UIMode;
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
