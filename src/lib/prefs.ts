/**
 * 表示の追加設定（すべてベータ）。テーマ/UIモードとは独立した軽量トグル。
 * 各設定は localStorage('nte.*') に '1'/'0' で保存し、<html> の data-* 属性へ反映する。
 * 反映は CSS（src/styles/prefs.css）が担う。チラつき防止のため、起動時の適用は
 * BaseLayout の is:inline スクリプトでも（この定義と同じ並びで）行う。
 *  ※ このファイルを編集したら BaseLayout の起動スクリプトの配列も合わせて更新すること。
 */

export interface PrefDef {
  /** localStorage キー（nte.*） */
  key: string;
  /** data-<attr> の attr 名 */
  attr: string;
  /** 有効時に data 属性へ入れる値 */
  on: string;
  label: string;
  hint: string;
  /** 設定パネルでのグループ分け（表示系 / 機能系） */
  group: 'display' | 'feature';
  /** 設定パネルのアイコン（SettingsPanel 内の inline-SVG マップのキー） */
  icon: string;
}

export const PREFS: PrefDef[] = [
  {
    key: 'nte.motion',
    attr: 'motion',
    on: 'reduce',
    label: 'モーションを軽減',
    hint: 'アニメーションや光沢・屈折などの動きを抑えます（OSの設定にも追従します）。',
    group: 'display',
    icon: 'gauge',
  },
  {
    key: 'nte.autoterm',
    attr: 'autoterm',
    on: 'off',
    label: '用語の自動リンクを無効化',
    hint: '本文中で自動的に付く用語リンクを、ふつうの文章表示に戻します。',
    group: 'display',
    icon: 'link',
  },
  {
    key: 'nte.spoiler',
    attr: 'spoiler',
    on: 'open',
    label: 'ネタバレを最初から開く',
    hint: '折りたたまれたネタバレ（[Spoiler]）を既定で開いた状態にします。',
    group: 'display',
    icon: 'eye',
  },
  {
    key: 'nte.width',
    attr: 'width',
    on: 'wide',
    label: '本文を広く表示',
    hint: '記事本文の最大幅を広げ、大きな画面で1行をより長く表示します。',
    group: 'display',
    icon: 'text',
  },
  {
    key: 'nte.draftmark',
    attr: 'draftmark',
    on: 'on',
    label: '未検証（要確認）を強調',
    hint: '「要確認」バッジを目立たせ、未検証の情報をひと目で分かるようにします（誠実性の可視化）。',
    group: 'display',
    icon: 'alert',
  },
  {
    key: 'nte.edit',
    attr: 'edit',
    on: 'on',
    label: 'ページの編集機能',
    hint: '各記事の末尾に GitHub の編集（→プルリク）リンクを表示します。ベータ機能です。',
    group: 'feature',
    icon: 'pencil',
  },
];

export function getPref(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

export function applyPref(key: string, val: boolean): void {
  const def = PREFS.find((p) => p.key === key);
  if (!def) return;
  const root = document.documentElement;
  if (val) root.setAttribute(`data-${def.attr}`, def.on);
  else root.removeAttribute(`data-${def.attr}`);
}

export function setPref(key: string, val: boolean): void {
  try {
    localStorage.setItem(key, val ? '1' : '0');
  } catch {
    /* 保存不可でも適用は行う */
  }
  applyPref(key, val);
}

/** すべての設定を localStorage から読み出して適用（クライアント起動時など）。 */
export function applyAllPrefs(): void {
  for (const p of PREFS) applyPref(p.key, getPref(p.key));
}
