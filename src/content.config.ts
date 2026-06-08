import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * wiki コレクション
 * NTE に関する「なんでも」攻略記事を MDX で管理する。
 *
 * status:
 *   - 'verified' : 一般的に正しい/出典確認済みの内容
 *   - 'draft'    : ゲーム固有の未検証数値などを含む下書き（UIに「要確認」バッジ）
 */
const wiki = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/wiki' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().default(''),
      category: z.string(),
      tags: z.array(z.string()).default([]),
      status: z.enum(['verified', 'draft']).default('draft'),
      order: z.number().default(100),
      updated: z.coerce.date().optional(),
      hero: image().optional(),
      sources: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
      draft: z.boolean().default(false), // ビルドから完全除外したい場合
    }),
});

export const collections = { wiki };
