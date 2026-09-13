/**
 * エンドフィールドの職業・属性の対応表。
 *
 * ★ 何のためにあるか
 *   記事は日本語（「前衛」「灼熱」）で書いてあり、公式サイトのアイコンは
 *   英字のキー（`guard` / `fire`）でファイル名が付いている。橋渡しがここ。
 *
 * ★ どこで確かめたか（2026-09-13）
 *   公式サイト <https://endfield.gryphline.com/ja-jp/operator> の絞り込みを読んだ。
 *   「職業」のドロップダウンに `data-key` と日本語ラベルが対で入っている:
 *     guard=前衛 / caster=術師 / support=補助 / shielder=重装 / vanguard=先鋒 / assault=突撃
 *   「属性」も同じ作り:
 *     fire=灼熱 / ice=寒冷 / electric=電磁 / nature=自然 / physic=物理
 *   **推測ではなく公式の画面から取った対応**なので、勝手に足したり言い換えたりしないこと。
 */

/** 職業（クラス）。並びは公式のドロップダウンと同じ */
export const EF_CLASSES: { key: string; label: string }[] = [
  { key: 'guard', label: '前衛' },
  { key: 'caster', label: '術師' },
  { key: 'support', label: '補助' },
  { key: 'shielder', label: '重装' },
  { key: 'vanguard', label: '先鋒' },
  { key: 'assault', label: '突撃' },
];

/** 属性。並びは公式のドロップダウンと同じ */
export const EF_ELEMENTS: { key: string; label: string }[] = [
  { key: 'fire', label: '灼熱' },
  { key: 'ice', label: '寒冷' },
  { key: 'electric', label: '電磁' },
  { key: 'nature', label: '自然' },
  { key: 'physic', label: '物理' },
];

const classKey = new Map(EF_CLASSES.map((c) => [c.label, c.key]));
const elementKey = new Map(EF_ELEMENTS.map((e) => [e.label, e.key]));

/** 日本語の職業名 → アイコンのキー。分からなければ null */
export const efClassKey = (label?: string): string | null =>
  (label && classKey.get(label)) || null;

/** 日本語の属性名 → アイコンのキー。分からなければ null */
export const efElementKey = (label?: string): string | null =>
  (label && elementKey.get(label)) || null;

/**
 * 属性の色。同梱した公式のアイコン画像から、**地の色の画素を読んで**求めた値
 * （2026-09-13 実測。左上から 4px の位置）。目分量ではない。
 */
export const EF_ELEMENT_HUE: Record<string, string> = {
  fire: '#fe633c',
  ice: '#20c7d1',
  electric: '#febf03',
  nature: '#c3e354',
  physic: '#444444',
};
