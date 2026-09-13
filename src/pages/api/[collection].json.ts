/**
 * コレクション1つぶんの記事データ（JSON）。
 *
 * 1件 = 1行の平らな形にしてある。**そのままデータベースの表へ入れられる**し、
 * iOS アプリからも読める。目次は `/api/index.json`。
 *
 * ★ `body` は記事の**原文（Markdown）**。HTML ではない。
 *   見出しのリンクや用語リンクはビルド時に足しているので、
 *   原文には含まれない（アプリ側で必要なら同じ規則で足す）。
 *
 * ★ 下書きは出さない。`publishedEntries` が公開分だけを返す。
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { WIKI_LIST } from '../../lib/wikis';
import { publishedEntries, titleOf, hrefOf, type AnyEntry } from '../../lib/content';

/** frontmatter のうち、日付は ISO 文字列へ揃える（JSON に Date は無い） */
function plain(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = plain(v);
    return out;
  }
  return value;
}

export const getStaticPaths: GetStaticPaths = () => {
  const seen = new Set<string>();
  const paths: { params: { collection: string } }[] = [];
  for (const w of WIKI_LIST) {
    for (const s of w.sections) {
      if (seen.has(s.collection)) continue;
      seen.add(s.collection);
      paths.push({ params: { collection: s.collection } });
    }
  }
  return paths;
};

export const GET: APIRoute = async ({ params }) => {
  const collection = params.collection ?? '';
  const entries = await publishedEntries(collection);

  const items = entries.map((e: AnyEntry) => ({
    id: e.id,
    collection,
    title: titleOf(e),
    href: hrefOf(collection, e.id),
    data: plain(e.data),
    body: (e as { body?: string }).body ?? '',
  }));

  return new Response(
    JSON.stringify({ collection, count: items.length, items }, null, 2),
    { headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
};
