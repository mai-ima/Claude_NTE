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
  /** src/content 配下のディレクトリ名（既定はコレクション名と同じ） */
  dir?: string;
}

/** エンティティ系コレクションのセクション（表示順） */
export const SECTIONS: SectionMeta[] = [
  {
    collection: 'events',
    href: '/events/',
    label: 'ガチャ/イベント',
    icon: 'calendar-clock',
    blurb: '開催中・予定のピックアップガチャと期間限定イベント。',
  },
  {
    collection: 'characters',
    href: '/characters/',
    label: 'キャラクター',
    icon: 'users',
    blurb: 'エスパー（プレイアブル）の属性・ロール・性能まとめ。',
  },
  {
    collection: 'people',
    href: '/people/',
    label: '登場人物',
    icon: 'contact',
    blurb: 'プレイアブル以外の登場人物・NPC・物語上の人物。',
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
    collection: 'terms',
    href: '/terms/',
    label: '用語集',
    icon: 'book-a',
    blurb: 'NTE 固有・難解な用語を1語ずつ意味から解説。',
  },
  {
    collection: 'locations',
    href: '/locations/',
    label: 'ロケーション',
    icon: 'map',
    blurb: '都市ヘテロシティ各区・島・アノマリーゾーンなどの地理。',
  },
  {
    collection: 'shops',
    href: '/shops/',
    label: '店・商店',
    icon: 'store',
    blurb: 'ショップ・交換所・拠点と、その販売/交換ラインナップ。',
  },
  {
    collection: 'vehicles',
    href: '/vehicles/',
    label: 'ビークル',
    icon: 'car',
    blurb: '都市生活で使う乗り物（スクーター/バイク/車）と入手・同乗効果。',
  },
  {
    collection: 'arcs',
    href: '/arcs/',
    label: '弧盤（武器）',
    icon: 'sword',
    blurb: '武器「弧盤」の個別データ。無課金で狙えるS弧盤と入手先。',
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

/**
 * αテスト（仮）wiki のセクション。NTE 側とは**コレクションから分離**しており、
 * URL も /alpha/ 配下に閉じる。別ゲームの wiki を増やすときはこの形を複製する。
 */
export const ALPHA_SECTIONS: SectionMeta[] = [
  {
    collection: 'alphaCharacters',
    dir: 'alpha-characters',
    href: '/alpha/characters/',
    label: 'キャラクター',
    icon: 'users',
    blurb: 'αテスト版で使えるキャラクターと役割。',
  },
  {
    collection: 'alphaSystems',
    dir: 'alpha-systems',
    href: '/alpha/systems/',
    label: 'システム',
    icon: 'settings-2',
    blurb: '戦闘・育成・進行など、αテスト版の仕組み。',
  },
  {
    collection: 'alphaGuides',
    dir: 'alpha-guides',
    href: '/alpha/guides/',
    label: 'ガイド',
    icon: 'compass',
    blurb: 'はじめ方・進め方・テスト参加時の注意。',
  },
  {
    collection: 'alphaTerms',
    dir: 'alpha-terms',
    href: '/alpha/terms/',
    label: '用語集',
    icon: 'book-a',
    blurb: 'αテスト版で使われる用語の意味。',
  },
];

/**
 * アークナイツ：エンドフィールド wiki のセクション（11種）。
 *
 * 区分は**大手攻略サイトの分類と突き合わせて**決めた（オペレーター／武器／装備／設備／
 * マップ／ストーリー／サブクエスト／拠点防衛／アイテム／モンスター）。
 * このゲームは「集成工業システム（AIC）」という工場づくりが看板なので、
 * それは systems に置き、組み方の手順は guides に置く。
 *
 * 並び順（order 相当）は**そのまま画面の番号**になる（01 / OPERATORS …）。
 * URL は /endfield/ 配下に閉じること。
 */
export const ENDFIELD_SECTIONS: SectionMeta[] = [
  {
    collection: 'endfieldOperators',
    dir: 'endfield-operators',
    href: '/endfield/operators/',
    label: 'オペレーター',
    icon: 'users',
    blurb: '★6/★5/★4 のオペレーター。職分・属性・武器種で引ける。',
  },
  {
    collection: 'endfieldWeapons',
    dir: 'endfield-weapons',
    href: '/endfield/weapons/',
    label: '武器',
    icon: 'sword',
    blurb: '片手剣・大剣・長柄武器・拳銃・アーツユニット。',
  },
  {
    collection: 'endfieldGear',
    dir: 'endfield-gear',
    href: '/endfield/gear/',
    label: '装備',
    icon: 'shield',
    blurb: '胴・腕・アクセサリーの装備とセット効果。',
  },
  {
    collection: 'endfieldIndustry',
    dir: 'endfield-industry',
    href: '/endfield/industry/',
    label: '集成工業',
    icon: 'factory',
    blurb: '生産ライン・設備・電力管理。本作の看板システム。',
  },
  {
    collection: 'endfieldEnemies',
    dir: 'endfield-enemies',
    href: '/endfield/enemies/',
    label: '敵・ボス',
    icon: 'skull',
    blurb: 'アンゲロス・ランドブレーカー・野生生物とボス。',
  },
  {
    collection: 'endfieldAreas',
    dir: 'endfield-areas',
    href: '/endfield/areas/',
    label: 'エリア',
    icon: 'map',
    blurb: '惑星タロII の各エリアと探索。',
  },
  {
    collection: 'endfieldSystems',
    dir: 'endfield-systems',
    href: '/endfield/systems/',
    label: 'システム',
    icon: 'settings-2',
    blurb: '戦闘・育成・スカウト（ガチャ）・拠点防衛の仕組み。',
  },
  {
    collection: 'endfieldItems',
    dir: 'endfield-items',
    href: '/endfield/items/',
    label: 'アイテム',
    icon: 'package',
    blurb: '昇進素材・武器素材・スキル強化素材など。',
  },
  {
    collection: 'endfieldEvents',
    dir: 'endfield-events',
    href: '/endfield/events/',
    label: 'バージョン/イベント',
    icon: 'calendar-clock',
    blurb: 'バージョン更新・特別スカウト・期間限定イベント。',
  },
  {
    collection: 'endfieldStory',
    dir: 'endfield-story',
    href: '/endfield/story/',
    label: 'ストーリー',
    icon: 'book-open',
    blurb: '本編の流れ（ネタバレは折りたたみ）。',
  },
  {
    collection: 'endfieldGuides',
    dir: 'endfield-guides',
    href: '/endfield/guides/',
    label: 'ガイド',
    icon: 'compass',
    blurb: 'はじめ方・日課・効率的な進め方。',
  },
  {
    collection: 'endfieldTerms',
    dir: 'endfield-terms',
    href: '/endfield/terms/',
    label: '用語集',
    icon: 'book-a',
    blurb: 'テラ・タロII・アンゲロス・源石など固有の用語。',
  },
];

/** 全 wiki のセクションを横断した検索（コレクション名は wiki 間で重複しない）。 */
export function sectionByCollection(collection: string): SectionMeta | undefined {
  return [...SECTIONS, ...ENDFIELD_SECTIONS, ...ALPHA_SECTIONS].find(
    (s) => s.collection === collection,
  );
}

/** 主要なグローバルナビ（ヘッダーアイコン＋ドロワー） */
export const PRIMARY_NAV = [
  { label: 'ホーム', href: '/', icon: 'home' },
  { label: 'ガチャ/イベント', href: '/events/', icon: 'calendar-clock' },
  { label: 'キャラ', href: '/characters/', icon: 'users' },
  { label: '用語集', href: '/terms/', icon: 'book-a' },
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

/**
 * トリオ反応（3属性が揃うと成立）。
 * 記事側の /terms/charge-discord/ と同じ内容。
 * ※ 以前は異能連環チェッカーとチームビルダーがそれぞれ別に持っていて、
 *   表示（日本語名の有無）が食い違っていたため、ここへ集約した。
 */
export const TRIO_REACTIONS = [
  {
    els: ['Cosmos', 'Anima', 'Lakshana'],
    name: 'Charge',
    ja: '充蓄',
    effect: 'アルティメットエネルギーを獲得',
  },
  {
    els: ['Chaos', 'Psyche', 'Incantation'],
    name: 'Discord',
    ja: '失諧',
    effect: 'ブレイク値を削る',
  },
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
