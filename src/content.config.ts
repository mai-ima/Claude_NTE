import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * NTE 攻略wiki のコンテンツコレクション。
 *
 * エンティティ種別ごとに型付きコレクションを分け、1エンティティ＝1専用ページで
 * 描画する。各記事は Web 調査に基づく事実のみを書き、`sources`（出典URL）と
 * `updated`（最終更新日）を必ず添える（誠実性プロトコル）。
 *
 * status:
 *   - 'verified' : 出典で裏が取れている内容
 *   - 'draft'    : 未検証の数値・仕様を含む下書き（UIに「要確認」バッジ）
 */

const source = z.object({ label: z.string(), url: z.url() });

/**
 * 全コレクション共通のベースフィールド。
 *
 * `description` と `updated` は**必須**にしてある。このサイトの根幹ルール
 * （「いつ時点の情報か」を必ず示す・一覧とSEOに出す説明を持つ）を、
 * 検査スクリプトの警告ではなく**ビルドが落ちる形**で守るため。
 * 以前は両方とも任意で、書き忘れても気づけなかった（現状は全264記事にある）。
 */
const base = {
  description: z.string().min(1, 'description は必須です（一覧とSEOに使います）'),
  status: z.enum(['verified', 'draft']).default('draft'),
  order: z.number().default(100),
  tags: z.array(z.string()).default([]),
  updated: z.coerce.date(),
  /**
   * 最終「確認」日。内容は変えていないが、出典に当たり直して
   * **現行バージョンでも正しいと確かめた**日を入れる。
   *
   * `updated`（＝本文を書き換えた日）と分けているのは誠実さのため。
   * 確認しただけの記事の `updated` を今日にすると「書き直した」と誤解され、
   * 逆に何も書かないと「3ヶ月前の情報」に見えてしまう。両方を持てば
   * 「6/11 に書き、9/6 に現行版でも正しいと確認した」と正確に言える。
   */
  checked: z.coerce.date().optional(),
  sources: z.array(source).default([]),
  draft: z.boolean().default(false), // ビルドから完全除外したい場合
};

/** NTE の属性（要素）。研究で名称が変わっても壊れないよう string も許容。 */
export const ELEMENTS = [
  'Cosmos',
  'Anima',
  'Incantation',
  'Chaos',
  'Psyche',
  'Lakshana',
] as const;

/** ロール */
export const ROLES = ['DPS', 'Survival', 'Buff'] as const;

const characters = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/characters' }),
  schema: ({ image }) =>
    z.object({
      ...base,
      name: z.string(),
      nameJa: z.string().optional(),
      // 実装済みは必須相当だが、未実装（告知済み）キャラは属性等が未確定なため optional。
      rarity: z.enum(['S', 'A', 'B']).optional(),
      element: z.string().optional(), // ELEMENTS 推奨
      role: z.string().optional(), // ROLES 推奨
      implemented: z.boolean().default(true), // false=実装予定（未実装）
      weapon: z.string().optional(),
      faction: z.string().optional(),
      version: z.string().optional(), // 実装バージョン/バナー
      tier: z.enum(['SS', 'S', 'A', 'B', 'C']).optional(),
      cv: z.string().optional(), // 声優
      birthday: z.string().optional(),
      image: image().optional(),
      /**
       * 公式サイトの画像 URL。**UIモード `base` で「公式の画像も使う」を選んだ端末**でだけ
       * 表示される（→ `src/lib/images.ts`）。画像は同梱せず、参照するだけ。
       * 権利は運営元にあるので、書くかどうかはサイトの管理者が判断する。
       */
      officialImage: z.url().optional(),
      title: z.string().optional(), // 表示名のオーバーライド（既定は name）
    }),
});

const locations = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/locations' }),
  schema: ({ image }) =>
    z.object({
      ...base,
      title: z.string(),
      type: z.enum(['city', 'district', 'island', 'anomaly-zone', 'landmark']).default('district'),
      region: z.string().optional(),
      image: image().optional(),
    }),
});

const enemies = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/enemies' }),
  schema: ({ image }) =>
    z.object({
      ...base,
      title: z.string(),
      type: z.enum(['anomaly', 'boss', 'elite', 'mob']).default('mob'),
      element: z.string().optional(),
      weakness: z.string().optional(),
      location: z.string().optional(),
      image: image().optional(),
    }),
});

const systems = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/systems' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      category: z.string().default('システム'),
    }),
});

const story = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/story' }),
  schema: ({ image }) =>
    z.object({
      ...base,
      title: z.string(),
      arc: z.string().optional(),
      spoiler: z.boolean().default(false),
      image: image().optional(),
    }),
});

const items = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/items' }),
  schema: ({ image }) =>
    z.object({
      ...base,
      title: z.string(),
      type: z.enum(['currency', 'material', 'consumable', 'gear']).default('material'),
      usedFor: z.string().optional(),
      image: image().optional(),
    }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: ({ image }) =>
    z.object({
      ...base,
      title: z.string(),
      category: z.string().default('ガイド'),
      image: image().optional(),
    }),
});

/**
 * events: 現在開催中/予定のガチャ（ピックアップ）・期間限定イベント。
 * 開催状況（current/upcoming/ended）は start/end と現在日時から算出するため
 * frontmatter には持たせない（status は通常どおり verified/draft）。
 */
const events = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/events' }),
  schema: ({ image }) =>
    z.object({
      ...base,
      title: z.string(),
      kind: z.enum(['banner', 'weapon-banner', 'event']).default('event'),
      featured: z.array(z.string()).default([]), // 注目キャラ/弧盤などの表示名
      start: z.coerce.date().optional(),
      end: z.coerce.date().optional(),
      version: z.string().optional(), // 実装バージョン（例: v1.1）
      image: image().optional(),
    }),
});

/**
 * shops: 店・商店・交換所・バトルパスなど「商品を扱う場所」。
 * 本文に取扱商品（販売/交換ラインナップ）を表で明記する。
 */
const shops = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/shops' }),
  schema: ({ image }) =>
    z.object({
      ...base,
      title: z.string(),
      type: z.enum(['shop', 'exchange', 'hub', 'pass']).default('shop'),
      currency: z.string().optional(), // 主に使用する通貨/ポイント
      unlock: z.string().optional(), // 解放条件
      aliases: z.array(z.string()).default([]), // 自動リンク用の別名（短縮形など）
      image: image().optional(),
    }),
});

/**
 * terms: NTE 固有・難解な用語の専門ページ（1用語=1ページ）。
 * 既に専用ページがある語は短い定義＋当該ページへのリンクに留める。
 */
const terms = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/terms' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(), // 見出し語（日本版表記）
      reading: z.string().optional(), // よみ
      en: z.string().optional(), // 英語表記
      category: z.string().default('用語'),
      aliases: z.array(z.string()).default([]),
    }),
});

/**
 * vehicles: 都市生活で使う乗り物（ビークル）のデータベース。1台1ページ。
 * スクーター/バイク/車などを、入手方法・同乗効果とともに収録。
 */
const vehicles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/vehicles' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      type: z.enum(['scooter', 'bike', 'car', 'special']).default('car'),
      acquisition: z.string().optional(), // 入手方法
      perk: z.string().optional(), // 同乗効果・特性など
      price: z.string().optional(), // 購入額
      topSpeed: z.string().optional(), // 最高速
      shop: z.string().optional(), // 購入できるカーショップ
    }),
});

/**
 * arcs: 武器「弧盤（Arc）」の個別データベース。1弧盤1ページ。
 * レア度・物質形態・入手方法・おすすめキャラを収録（特に無課金で狙えるS弧盤）。
 */
const arcs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/arcs' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      rarity: z.enum(['S', 'A', 'B']).default('S'),
      form: z.string().optional(), // 物質形態（固体/液体/気体/プラズマ/集合）
      acquisition: z.string().optional(), // 入手方法
      free: z.boolean().optional(), // 無課金で入手可
      recommendedFor: z.string().optional(), // おすすめキャラ/属性
    }),
});

/**
 * people（登場人物）: プレイアブル以外のキャラクター・NPC・物語上の人物。
 * 役割・所属・登場章・別名を収録。確証が薄い表記/詳細は要確認を明示する。
 */
const people = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/people' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(), // 表示名（日本版）
      en: z.string().optional(), // 英語表記
      reading: z.string().optional(), // よみ
      role: z.string().optional(), // 立場・役割（例: 緋文字のリーダー）
      faction: z.string().optional(), // 所属
      chapter: z.string().optional(), // 主な登場章
      aliases: z.array(z.string()).default([]),
    }),
});

// ---------------------------------------------------------------------------
// アークナイツ：エンドフィールド wiki のコレクション（12種）。
//
// NTE 側と同じ `base`（description / status / updated / checked / sources / tags）を使う。
// 誠実性ルール（出典で裏が取れた事実だけ verified・未検証は draft ＋本文に「要確認」）を
// 新しい wiki にも同じ形で効かせるため、ここは共有する。
//
// コレクション名は**全 wiki 横断で一意**（test/wikis.test.ts が検査）。
// ディレクトリは src/content/endfield-*/。
// ---------------------------------------------------------------------------

/** エンドフィールドのレア度 */
export const EF_RARITIES = ['★6', '★5', '★4', '★3'] as const;

const endfieldOperators = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-operators' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(), // 日本版の表示名
      en: z.string().optional(),
      reading: z.string().optional(),
      rarity: z.enum(EF_RARITIES).optional(),
      class: z.string().optional(), // 職分（クラス）
      element: z.string().optional(), // 属性
      weaponType: z.string().optional(), // 片手剣 / 大剣 / 長柄武器 / 拳銃 / アーツユニット
      faction: z.string().optional(),
      cv: z.string().optional(),
      version: z.string().optional(), // 実装バージョン
      implemented: z.boolean().default(true), // false = 実装予定（告知済み）
      aliases: z.array(z.string()).default([]),
    }),
});

const endfieldWeapons = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-weapons' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      en: z.string().optional(),
      rarity: z.enum(EF_RARITIES).optional(),
      type: z.string().optional(), // 武器種
      acquisition: z.string().optional(), // 入手方法
      recommendedFor: z.string().optional(),
      aliases: z.array(z.string()).default([]),
    }),
});

const endfieldGear = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-gear' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      slot: z.string().optional(), // 胴 / 腕 / アクセサリー
      quality: z.string().optional(),
      setName: z.string().optional(), // セット名
      acquisition: z.string().optional(),
      aliases: z.array(z.string()).default([]),
    }),
});

/** 集成工業システム（AIC）の設備・生産ライン。本作の看板なので独立させた。 */
const endfieldIndustry = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-industry' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      en: z.string().optional(),
      category: z.string().default('設備'), // 設備 / 生産ライン / 電力 / 図面
      unlock: z.string().optional(),
      aliases: z.array(z.string()).default([]),
    }),
});

const endfieldEnemies = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-enemies' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      en: z.string().optional(),
      type: z.string().default('雑魚'), // アンゲロス / ランドブレーカー / 野生生物 / ボス
      weakness: z.string().optional(),
      area: z.string().optional(),
      aliases: z.array(z.string()).default([]),
    }),
});

const endfieldAreas = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-areas' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      en: z.string().optional(),
      type: z.string().default('エリア'),
      unlock: z.string().optional(),
      version: z.string().optional(),
      aliases: z.array(z.string()).default([]),
    }),
});

const endfieldSystems = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-systems' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      category: z.string().default('システム'),
      aliases: z.array(z.string()).default([]),
    }),
});

const endfieldItems = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-items' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      en: z.string().optional(),
      type: z.string().default('素材'), // 素材 / 昇進素材 / 武器素材 / スキル素材 / プレゼント / 通貨
      usedFor: z.string().optional(),
      acquisition: z.string().optional(),
      aliases: z.array(z.string()).default([]),
    }),
});

/**
 * バージョン更新・特別スカウト・期間限定イベント。
 * `start` / `end` は NTE の events と**同じ意味**で持つ（`phaseOf` が開催状況を出す）。
 * ⚠ `end` を空にすると**永久に「開催中」と表示される**（NTE で実際に起きた）。
 *    終了日が未告知なら本文に「終了日は未告知」と書くこと。
 */
const endfieldEvents = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-events' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      kind: z.enum(['version', 'banner', 'event']).default('event'),
      featured: z.array(z.string()).default([]),
      start: z.coerce.date().optional(),
      end: z.coerce.date().optional(),
      version: z.string().optional(),
    }),
});

const endfieldStory = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-story' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      chapter: z.string().optional(),
      spoiler: z.boolean().default(false),
    }),
});

const endfieldGuides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-guides' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      category: z.string().default('ガイド'),
    }),
});

const endfieldTerms = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/endfield-terms' }),
  schema: () =>
    z.object({
      ...base,
      title: z.string(),
      reading: z.string().optional(),
      en: z.string().optional(),
      category: z.string().default('用語'),
      aliases: z.array(z.string()).default([]),
    }),
});

// ---------------------------------------------------------------------------
// αテスト（仮）wiki のコレクション。
//
// 別ゲームの wiki を同じサイトに並置できるかを検証するためのサンプル。
// NTE 側とはコレクション・ディレクトリ・URL（/alpha/…）をすべて分離しており、
// 片方を編集してももう片方には影響しない。実ゲームの wiki を足すときも同じ形で
// `<game>*` のコレクションを追加する。
// ---------------------------------------------------------------------------

/** αテスト wiki 共通のベース（NTE 側の base と同じ誠実性フィールドを持つ） */
const alphaBase = {
  ...base,
  /** サンプルデータであることを明示するフラグ（UIで注意書きを出す） */
  sample: z.boolean().default(true),
};

const alphaCharacters = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/alpha-characters' }),
  schema: () =>
    z.object({
      ...alphaBase,
      title: z.string(),
      en: z.string().optional(),
      rarity: z.enum(['S', 'A', 'B']).optional(),
      role: z.string().optional(),
      element: z.string().optional(),
      build: z.string().optional(), // 実装ビルド（α1 / α2 など）
    }),
});

const alphaSystems = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/alpha-systems' }),
  schema: () =>
    z.object({
      ...alphaBase,
      title: z.string(),
      category: z.string().default('システム'),
    }),
});

const alphaGuides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/alpha-guides' }),
  schema: () =>
    z.object({
      ...alphaBase,
      title: z.string(),
      category: z.string().default('ガイド'),
    }),
});

const alphaTerms = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/alpha-terms' }),
  schema: () =>
    z.object({
      ...alphaBase,
      title: z.string(),
      reading: z.string().optional(),
      en: z.string().optional(),
      category: z.string().default('用語'),
      aliases: z.array(z.string()).default([]),
    }),
});

export const collections = {
  characters,
  locations,
  enemies,
  systems,
  story,
  items,
  guides,
  events,
  shops,
  terms,
  vehicles,
  arcs,
  people,
  // アークナイツ：エンドフィールド wiki
  endfieldOperators,
  endfieldWeapons,
  endfieldGear,
  endfieldIndustry,
  endfieldEnemies,
  endfieldAreas,
  endfieldSystems,
  endfieldItems,
  endfieldEvents,
  endfieldStory,
  endfieldGuides,
  endfieldTerms,
  // αテスト（仮）wiki
  alphaCharacters,
  alphaSystems,
  alphaGuides,
  alphaTerms,
};
