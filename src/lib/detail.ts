/**
 * 詳細ページ（各コレクションの [slug].astro）共通ロジック。
 * 12 個のほぼ同型だったページから、getStaticPaths のボイラープレートと
 * EntityDetail へ渡す共通 props の組み立てを集約し、`as any` を局所化する。
 *  - detailPaths(): 公開エントリ→{params,props(entry/prev/next/related)} を生成。
 *  - renderEntry(): astro:content の render を型キャストごと内包。
 *  - baseDetailProps(): collection 共通の EntityDetail props を返す。
 * 各ページは「コレクション固有の rows/pills/aside」だけを残せばよい。
 */
import { render } from 'astro:content';
import { sectionByCollection } from './nav';
import { titleOf, hrefOf, publishedEntries, type AnyEntry } from './content';

type Data = Record<string, any>;
const data = (e: AnyEntry): Data => e.data as Data;

export interface DetailLink {
  href: string;
  title: string;
}

export interface DetailPathProps {
  entry: AnyEntry;
  prev: AnyEntry | null;
  next: AnyEntry | null;
  related?: DetailLink[];
}

/**
 * getStaticPaths 用。公開エントリを order 順で並べ、前後リンク付きで返す。
 * relatedBy を渡すと、同じフィールド値を持つ兄弟を「関連項目」として最大 limit 件付与する。
 */
export async function detailPaths(
  collection: string,
  opts: { relatedBy?: string; relatedLimit?: number } = {},
): Promise<{ params: { slug: string }; props: DetailPathProps }[]> {
  const sorted = await publishedEntries(collection);
  return sorted.map((entry, i) => {
    const props: DetailPathProps = {
      entry,
      prev: sorted[i - 1] ?? null,
      next: sorted[i + 1] ?? null,
    };
    if (opts.relatedBy) {
      const key = opts.relatedBy;
      const val = data(entry)[key];
      if (val != null && val !== '') {
        props.related = sorted
          .filter((e) => e.id !== entry.id && data(e)[key] === val)
          .slice(0, opts.relatedLimit ?? 14)
          .map((e) => ({ href: hrefOf(collection, e.id), title: titleOf(e) }));
      }
    }
    return { params: { slug: entry.id }, props };
  });
}

/** astro:content の render（Content コンポーネント＋見出し）を型キャストごと取得。 */
export async function renderEntry(entry: AnyEntry) {
  return render(entry as Parameters<typeof render>[0]);
}

/** 全コレクション共通の EntityDetail props（rows/pills/headings/各種フラグは各ページで付与）。 */
export function baseDetailProps(collection: string, entry: AnyEntry, prev: AnyEntry | null, next: AnyEntry | null) {
  const section = sectionByCollection(collection)!;
  const d = data(entry);
  return {
    collection,
    currentId: entry.id,
    sectionLabel: section.label,
    sectionHref: section.href,
    sectionIcon: section.icon,
    title: titleOf(entry),
    lead: d.description as string | undefined,
    status: d.status as 'verified' | 'draft',
    updated: d.updated as Date | undefined,
    checked: d.checked as Date | undefined,
    tags: d.tags as string[] | undefined,
    sources: d.sources as { label: string; url: string }[] | undefined,
    prev: prev ? { href: hrefOf(collection, prev.id), title: titleOf(prev) } : null,
    next: next ? { href: hrefOf(collection, next.id), title: titleOf(next) } : null,
    /**
     * 「このページを編集」の宛先になる実ファイルパス。
     * これが無いと EntityDetail は拡張子を .md と決め打ちするため、
     * **.mdx の記事で編集リンクが存在しないファイルを指す**。
     * 以前は一部のページだけが個別に渡しており、.mdx を足す場所によっては
     * 壊れる状態だったので、ここで全コレクション分をまとめて渡す。
     */
    editPath: (entry as unknown as { filePath?: string }).filePath,
  };
}
