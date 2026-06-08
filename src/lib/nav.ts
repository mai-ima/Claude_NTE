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
    blurb: '都市ヘテロシティ各区・島・アノマリーゾーンなどの地理。',
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
  label: string; // 日本版公式の属性名（漢字1字）
  en: string; // 英語表記
  /** テーマ非依存の識別色（CSS変数 --el-* を使う） */
  hue: string;
}

/**
 * 属性メタ。日本版の公式属性名「光・霊・呪・闇・魂・相」を表示に使う。
 * frontmatter のキーは英語（Cosmos 等）のまま保持し、表示のみ日本語化する。
 * 異能連環リング順: 光→霊→呪→闇→魂→相→（光へ）。色は識別用。
 * 出典: Game8(JP) https://game8.jp/nte/783376 / ゲームウィズ https://gamewith.jp/nte/552269
 */
export const ELEMENT_META: Record<string, ElementMeta> = {
  Cosmos: { id: 'Cosmos', label: '光', en: 'Cosmos', hue: '#f5a623' },
  Anima: { id: 'Anima', label: '霊', en: 'Anima', hue: '#10b981' },
  Incantation: { id: 'Incantation', label: '呪', en: 'Incantation', hue: '#a855f7' },
  Chaos: { id: 'Chaos', label: '闇', en: 'Chaos', hue: '#475569' },
  Psyche: { id: 'Psyche', label: '魂', en: 'Psyche', hue: '#ec4899' },
  Lakshana: { id: 'Lakshana', label: '相', en: 'Lakshana', hue: '#06b6d4' },
};

export function elementMeta(id: string): ElementMeta {
  return ELEMENT_META[id] ?? { id, label: id, en: id, hue: '#94a3b8' };
}

/** 異能連環リングの並び順（隣接で反応が成立） */
export const ELEMENT_RING = ['Cosmos', 'Anima', 'Incantation', 'Chaos', 'Psyche', 'Lakshana'];

/** 隣接ペアのDuo反応（英語名／日本語名は攻略サイト由来・要原典確認） */
export const DUO_REACTIONS = [
  { a: 'Cosmos', b: 'Anima', name: 'Blossom', ja: '創生', effect: 'AoEの追撃を発生' },
  { a: 'Anima', b: 'Incantation', name: 'Hexed', ja: '覆紋', effect: '記録ダメージを一括解放' },
  { a: 'Incantation', b: 'Chaos', name: 'Scorch', ja: '濁燃', effect: '継続ダメージ(DoT)' },
  { a: 'Chaos', b: 'Psyche', name: 'Nova', ja: '暗星', effect: '遅延爆発(メンタル)' },
  { a: 'Psyche', b: 'Lakshana', name: 'Stain', ja: '浸染', effect: '被ダメージ増加' },
  { a: 'Lakshana', b: 'Cosmos', name: 'Remora', ja: '延滞', effect: '対象をマーク・鈍化' },
];

/** ある属性が隣接で起こせる反応（相手属性＋反応名）を返す */
export function reactionsFor(el: string): { partner: string; name: string; ja: string }[] {
  return DUO_REACTIONS.filter((r) => r.a === el || r.b === el).map((r) => ({
    partner: r.a === el ? r.b : r.a,
    name: r.name,
    ja: r.ja,
  }));
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
