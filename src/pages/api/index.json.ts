/**
 * 記事データの目次（JSON）。
 *
 * ★ 何のためにあるか
 *   1. **iOS アプリ（SwiftUI）から読むため**。ページの HTML を剥がさずに済む。
 *   2. **データベースへ移すときの受け渡し**。1行 = 1記事の平らな形にしてある。
 *
 * ★ 出しているのは、**すでに公開しているページと同じ内容**だけ。
 *   下書き（`status: draft` の非公開扱い）は `publishedEntries` が外す。
 *
 * ここは目次だけ。各コレクションの中身は `/api/<コレクション名>.json` にある。
 */
import type { APIRoute } from 'astro';
import { WIKI_LIST } from '../../lib/wikis';
import { publishedEntries } from '../../lib/content';

/** この API の形。変えるときは番号を上げる（アプリ側が見る） */
export const API_VERSION = 1;

export const GET: APIRoute = async () => {
  const wikis = [];
  for (const w of WIKI_LIST) {
    const collections = [];
    for (const s of w.sections) {
      const items = await publishedEntries(s.collection);
      collections.push({
        collection: s.collection,
        label: s.label,
        href: s.href,
        count: items.length,
        endpoint: `/api/${s.collection}.json`,
      });
    }
    wikis.push({
      id: w.id,
      name: w.siteName,
      base: w.base,
      kind: w.kind ?? 'live',
      collections,
    });
  }

  return new Response(
    JSON.stringify(
      {
        apiVersion: API_VERSION,
        generatedAt: new Date().toISOString(),
        note: '非公式ファンサイトのデータです。ゲームの権利は各運営元にあります。',
        wikis,
      },
      null,
      2,
    ),
    { headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
};
