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

/** 全コレクション共通のベースフィールド */
const base = {
  description: z.string().default(''),
  status: z.enum(['verified', 'draft']).default('draft'),
  order: z.number().default(100),
  tags: z.array(z.string()).default([]),
  updated: z.coerce.date().optional(),
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
      rarity: z.enum(['S', 'A']),
      element: z.string(), // ELEMENTS 推奨
      role: z.string(), // ROLES 推奨
      weapon: z.string().optional(),
      faction: z.string().optional(),
      version: z.string().optional(), // 実装バージョン/バナー
      tier: z.enum(['SS', 'S', 'A', 'B', 'C']).optional(),
      cv: z.string().optional(), // 声優
      birthday: z.string().optional(),
      image: image().optional(),
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
};
