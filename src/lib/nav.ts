/** サイトのナビゲーション定義。
 *  - SECTIONS: コンテンツコレクション＝専用ページ群のメタ（サイドバー/トップ/ナビ共通）。
 *  - PRIMARY_NAV: ヘッダー/ドロワーのグローバルナビ。
 *  - 属性(ELEMENT)・ロール(ROLE)の表示メタ。 */

export interface SectionMeta {
  /** astro:content のコレクション名 */
  collection: string;
  /** URL ベース（例: '/characters/'） */
  href: string;
  label: string;
  icon: string; // lucide アイコン名
  /** 一覧/サイドバーの説明 */
  blurb: string;
}

/** エンティティ系コレクションのセクション（表示順） */
export const SECTIONS: SectionMeta[] = [
  {
    collection: 'characters',
    href: '/characters/',
    label: 'キャラクター',
    icon: 'users',
    blurb: 'エスパー（プレイアブル）の属性・ロール・性能まとめ。',
  },
  {
    collection: 'systems',
    href: '/systems/',
    label: 'システム',
    icon: 'settings-2',
    blurb: '戦闘・属性相性・ガチャ・スタミナなどの仕組み解説。',
  },
  {
    collection: 'guides',
    href: '/guides/',
    label: 'ガイド',
    icon: 'compass',
    blurb: '初心者・リセマラ・ガチャ戦略・ティア解説など。',
  },
  {
    collection: 'locations',
    href: '/locations/',
    label: 'ロケーション',
    icon: 'map',
    blurb: '都市ヘゼルロー各区・島・アノマリーゾーンなどの地理。',
  },
  {
    collection: 'enemies',
    href: '/enemies/',
    label: '敵・アノマリー',
    icon: 'skull',
    blurb: '雑魚・エリート・ボス・アノマリーと弱点。',
  },
  {
    collection: 'items',
    href: '/items/',
    label: 'アイテム',
    icon: 'package',
    blurb: '通貨・育成素材・消費アイテムと用途。',
  },
  {
    collection: 'story',
    href: '/story/',
    label: 'ストーリー',
    icon: 'scroll-text',
    blurb: '章ごとのあらすじ（ネタバレは折りたたみ）。',
  },
];

export function sectionByCollection(collection: string): SectionMeta | undefined {
  return SECTIONS.find((s) => s.collection === collection);
}

/** 主要なグローバルナビ（ヘッダーアイコン＋ドロワー） */
export const PRIMARY_NAV = [
  { label: 'ホーム', href: '/', icon: 'home' },
  { label: 'キャラ', href: '/characters/', icon: 'users' },
  { label: 'ツール', href: '/tools/', icon: 'wrench' },
  { label: 'ティア表', href: '/tools/tier-list/', icon: 'bar-chart-3' },
  { label: '更新履歴', href: '/release-notes/', icon: 'history' },
  { label: '設定', href: '/settings/', icon: 'settings' },
];

/** モバイル下部ナビ（指が届く範囲の主要導線） */
export const BOTTOM_NAV = [
  { label: 'ホーム', href: '/', icon: 'home' },
  { label: 'キャラ', href: '/characters/', icon: 'users' },
  { label: 'ツール', href: '/tools/', icon: 'wrench' },
  { label: '設定', href: '/settings/', icon: 'settings' },
];

// --- 属性 / ロールの表示メタ ------------------------------------------------

export interface ElementMeta {
  id: string;
  label: string;
  /** テーマ非依存の識別色（CSS変数 --el-* を使う） */
  hue: string;
}

/** 属性メタ。色は雰囲気の識別用（出典の配色に厳密一致ではない）。 */
export const ELEMENT_META: Record<string, ElementMeta> = {
  Cosmos: { id: 'Cosmos', label: 'Cosmos', hue: '#6366f1' },
  Anima: { id: 'Anima', label: 'Anima', hue: '#10b981' },
  Incantation: { id: 'Incantation', label: 'Incantation', hue: '#f59e0b' },
  Chaos: { id: 'Chaos', label: 'Chaos', hue: '#a855f7' },
  Psyche: { id: 'Psyche', label: 'Psyche', hue: '#ec4899' },
  Lakshana: { id: 'Lakshana', label: 'Lakshana', hue: '#06b6d4' },
};

export function elementMeta(id: string): ElementMeta {
  return ELEMENT_META[id] ?? { id, label: id, hue: '#94a3b8' };
}

export interface RoleMeta {
  id: string;
  label: string;
  icon: string;
}

export const ROLE_META: Record<string, RoleMeta> = {
  DPS: { id: 'DPS', label: 'アタッカー (DPS)', icon: 'swords' },
  Survival: { id: 'Survival', label: 'サバイバル (回復/防御)', icon: 'shield' },
  Buff: { id: 'Buff', label: 'バッファー (支援)', icon: 'sparkles' },
};

export function roleMeta(id: string): RoleMeta {
  return ROLE_META[id] ?? { id, label: id, icon: 'user' };
}
