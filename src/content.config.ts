import { defineCollection, z } from 'astro:content';
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

const source = z.object({ label: z.string(), url: z.string().url() });

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

export const collections = { characters, locations, enemies, systems, story, items, guides, events };
