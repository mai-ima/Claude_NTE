/**
 * 表示・操作の追加設定。テーマ/UIモードとは独立した軽量な切り替え。
 *
 * 2種類ある:
 *   - toggle … ON/OFF。localStorage に '1' / '0' を保存する。
 *   - choice … 3〜4段階から選ぶ。localStorage に選んだ value をそのまま保存する。
 *
 * 反映のしかたは共通で、`<html>` の data-* 属性に値を書き、効果は CSS
 * （src/styles/prefs.css・ios.css）が担う。choice は「既定値のときは属性を書かない」
 * ことで、CSS 側は素の状態を既定として書けばよい。
 *
 * 起動時（描画前）の適用は BaseLayout の is:inline スクリプトが行うが、そちらは
 * **この PREFS から自動生成**しているので、ここを編集しても向こうを直す必要はない。
 * src/lib/store.ts の「初期化しても残すキー」も PREFS から導出している。
 */

/** 設定パネルでのグループ分け */
export type PrefGroup = 'reading' | 'list' | 'wiki' | 'touch' | 'feature';

interface PrefBase {
  /** localStorage キー（nte.*） */
  key: string;
  /**
   * data-<attr> の attr 名。
   * 省略すると `<html>` に属性を書かない（＝JS から読むだけの設定）。
   */
  attr?: string;
  label: string;
  hint: string;
  group: PrefGroup;
  /** 設定パネルのアイコン（SettingsPanel 内の inline-SVG マップのキー） */
  icon: string;
}

/** ON/OFF の切り替え。保存は '1' / '0'。 */
export interface TogglePref extends PrefBase {
  type: 'toggle';
  /** 有効時に data 属性へ入れる値 */
  on: string;
}

/** 3〜4段階から選ぶ設定。保存は value をそのまま。 */
export interface ChoicePref extends PrefBase {
  type: 'choice';
  choices: { value: string; label: string }[];
  /** 既定値。この値のときは data 属性を付けない（＝CSS の素の状態） */
  def: string;
}

export type PrefDef = TogglePref | ChoicePref;

export const PREFS: PrefDef[] = [
  // ---- 読みやすさ -------------------------------------------------------
  {
    type: 'toggle',
    key: 'nte.motion',
    attr: 'motion',
    on: 'reduce',
    label: 'モーションを軽減',
    hint: 'アニメーションや光沢・屈折などの動きを抑えます（OSの設定にも追従します）。',
    group: 'reading',
    icon: 'gauge',
  },
  {
    type: 'toggle',
    key: 'nte.autoterm',
    attr: 'autoterm',
    on: 'off',
    label: '用語の自動リンクを無効化',
    hint: '本文中で自動的に付く用語リンクを、ふつうの文章表示に戻します。',
    group: 'reading',
    icon: 'link',
  },
  {
    type: 'toggle',
    key: 'nte.spoiler',
    attr: 'spoiler',
    on: 'open',
    label: 'ネタバレを最初から開く',
    hint: '折りたたまれたネタバレ（[Spoiler]）を既定で開いた状態にします。',
    group: 'reading',
    icon: 'eye',
  },
  {
    type: 'toggle',
    key: 'nte.width',
    attr: 'width',
    on: 'wide',
    label: '本文を広く表示',
    hint: '記事本文の最大幅を広げ、大きな画面で1行をより長く表示します。',
    group: 'reading',
    icon: 'text',
  },
  {
    type: 'toggle',
    key: 'nte.draftmark',
    attr: 'draftmark',
    on: 'on',
    label: '未検証（要確認）を強調',
    hint: '「要確認」バッジを目立たせ、未検証の情報をひと目で分かるようにします（誠実性の可視化）。',
    group: 'reading',
    icon: 'alert',
  },

  // ---- 機能（ベータ） ---------------------------------------------------
  {
    type: 'toggle',
    key: 'nte.edit',
    attr: 'edit',
    on: 'on',
    label: 'ページの編集機能',
    hint: '各記事の末尾に GitHub の編集（→プルリク）リンクを表示します。ベータ機能です。',
    group: 'feature',
    icon: 'pencil',
  },
];

/** key から定義を引く */
export function prefDef(key: string): PrefDef | undefined {
  return PREFS.find((p) => p.key === key);
}

/** toggle 設定の現在値。未保存は false。 */
export function getPref(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

/** choice 設定の現在値。未保存・不正な値は既定値を返す。 */
export function getPrefValue(key: string): string {
  const def = prefDef(key);
  if (!def || def.type !== 'choice') return '';
  try {
    const raw = localStorage.getItem(key);
    return def.choices.some((c) => c.value === raw) ? (raw as string) : def.def;
  } catch {
    return def.def;
  }
}

/**
 * 値を `<html>` の data-* 属性へ反映する。
 * 「効いていない状態」（toggle が false／choice が既定値／attr を持たない設定）では
 * 属性そのものを消す。属性が残ったまま遷移して前ページの見た目を引きずらないようにする。
 */
export function applyPref(key: string, val: boolean | string): void {
  const def = prefDef(key);
  if (!def || !def.attr) return;
  const root = document.documentElement;
  const name = `data-${def.attr}`;
  if (def.type === 'toggle') {
    if (val === true || val === '1') root.setAttribute(name, def.on);
    else root.removeAttribute(name);
    return;
  }
  const v = typeof val === 'string' && def.choices.some((c) => c.value === val) ? val : def.def;
  if (v === def.def) root.removeAttribute(name);
  else root.setAttribute(name, v);
}

/** 保存して反映する。toggle は boolean、choice は value（文字列）を渡す。 */
export function setPref(key: string, val: boolean | string): void {
  try {
    const def = prefDef(key);
    const raw = def?.type === 'choice' ? String(val) : val ? '1' : '0';
    localStorage.setItem(key, raw);
  } catch {
    /* 保存不可でも適用は行う */
  }
  applyPref(key, val);
}

/** すべての設定を localStorage から読み出して適用（クライアント起動時など）。 */
export function applyAllPrefs(): void {
  for (const p of PREFS) {
    applyPref(p.key, p.type === 'choice' ? getPrefValue(p.key) : getPref(p.key));
  }
}

/**
 * 起動スクリプト（BaseLayout の is:inline）へ渡す最小データ。
 * ここを唯一の真実にして、レイアウト側にキーを二重管理させない。
 */
export function prefBootData(): {
  k: string;
  a: string;
  on?: string;
  def?: string;
  vals?: string[];
}[] {
  return PREFS.filter((p) => p.attr).map((p) =>
    p.type === 'toggle'
      ? { k: p.key, a: p.attr as string, on: p.on }
      : { k: p.key, a: p.attr as string, def: p.def, vals: p.choices.map((c) => c.value) },
  );
}
