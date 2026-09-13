/**
 * 自動リンクの辞書（`src/lib/rehype-term-links.mjs` の `WIKI_GROUPS`）の検査。
 *
 * ★ なぜこの検査があるか
 *   `WIKI_GROUPS` に載せ忘れたコレクションの記事に、**別の wiki の用語リンクが張られていた**。
 *   `/endfield/guides/beginner/` の本文から `/terms/role/` など NTE の記事へ飛ぶ状態だった
 *   （原因は `endfield-guides` と `endfield-story` の載せ忘れ）。
 *   コレクションを増やしたときに気づけるよう、ここで突き合わせる。
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { WIKI_GROUPS } from '../src/lib/rehype-term-links.mjs';

const CONTENT_DIR = path.resolve('src/content');

/** 記事を持つコレクションのディレクトリ名を実際に読む */
function contentDirs(): string[] {
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** 辞書に載っているディレクトリ名 */
function listedDirs(): string[] {
  return WIKI_GROUPS.flatMap((g: { collections: { dir: string }[] }) =>
    g.collections.map((c) => c.dir),
  ).sort();
}

describe('自動リンクの辞書', () => {
  it('src/content の全コレクションが、どれかの wiki に載っている', () => {
    const listed = new Set(listedDirs());
    const missing = contentDirs().filter((d) => !listed.has(d));
    // 載せ忘れがあると、その記事には**別の wiki の辞書が当たりうる**
    expect(missing).toEqual([]);
  });

  it('辞書にあるディレクトリは、実際に存在する', () => {
    const actual = new Set(contentDirs());
    const ghosts = listedDirs().filter((d) => !actual.has(d));
    expect(ghosts).toEqual([]);
  });

  it('同じコレクションを2つの wiki に登録していない', () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const g of WIKI_GROUPS as { id: string; collections: { dir: string }[] }[]) {
      for (const c of g.collections) {
        if (seen.has(c.dir)) dupes.push(`${c.dir}（${seen.get(c.dir)} と ${g.id}）`);
        else seen.set(c.dir, g.id);
      }
    }
    expect(dupes).toEqual([]);
  });

  it('base は / で始まり / で終わる', () => {
    const bad: string[] = [];
    for (const g of WIKI_GROUPS as { collections: { dir: string; base: string }[] }[]) {
      for (const c of g.collections) {
        if (!c.base.startsWith('/') || !c.base.endsWith('/')) bad.push(`${c.dir}: ${c.base}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('endfield のコレクションの base は /endfield/ の下にある', () => {
    const ef = (WIKI_GROUPS as { id: string; collections: { dir: string; base: string }[] }[]).find(
      (g) => g.id === 'endfield',
    );
    expect(ef).toBeTruthy();
    const outside = ef!.collections.filter((c) => !c.base.startsWith('/endfield/'));
    expect(outside).toEqual([]);
  });

  it('alpha のコレクションの base は /alpha/ の下にある', () => {
    const a = (WIKI_GROUPS as { id: string; collections: { dir: string; base: string }[] }[]).find(
      (g) => g.id === 'alpha',
    );
    expect(a).toBeTruthy();
    const outside = a!.collections.filter((c) => !c.base.startsWith('/alpha/'));
    expect(outside).toEqual([]);
  });
});
