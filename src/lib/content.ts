/** コレクション横断のヘルパ。表示タイトル・リンク・サイドバー用データを組み立てる。 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { withBase } from './path';
import { SECTIONS } from './nav';

type AnyEntry = CollectionEntry<
  'characters' | 'locations' | 'enemies' | 'systems' | 'story' | 'items' | 'guides'
>;

/** エントリの表示タイトル（characters は name、他は title） */
export function titleOf(entry: AnyEntry): string {
  const d = entry.data as Record<string, unknown>;
  return (d.title as string) || (d.name as string) || entry.id;
}

/** コレクション内リンク */
export function hrefOf(collection: string, id: string): string {
  return withBase(`/${collection}/${id}/`);
}

export interface NavItem {
  id: string;
  title: string;
  href: string;
  /** characters の属性色など（任意） */
  el?: string;
}

export interface NavSection {
  collection: string;
  label: string;
  icon: string;
  href: string;
  items: NavItem[];
}

const ORDER = (a: AnyEntry, b: AnyEntry) =>
  (a.data.order ?? 100) - (b.data.order ?? 100) ||
  titleOf(a).localeCompare(titleOf(b), 'ja');

/** 公開対象エントリ（draft 除外）を取得 */
export async function publishedEntries(collection: string): Promise<AnyEntry[]> {
  const entries = (await getCollection(collection as 'guides', (e: AnyEntry) => e.data.draft !== true)) as AnyEntry[];
  return entries.sort(ORDER);
}

export interface RecentEntry {
  title: string;
  href: string;
  sectionLabel: string;
  updated: Date;
}

/** 全コレクション横断で「最近更新した記事」を取得 */
export async function recentEntries(limit = 6): Promise<RecentEntry[]> {
  const all: RecentEntry[] = [];
  for (const s of SECTIONS) {
    const entries = await publishedEntries(s.collection);
    for (const e of entries) {
      if (!e.data.updated) continue;
      all.push({
        title: titleOf(e),
        href: hrefOf(s.collection, e.id),
        sectionLabel: s.label,
        updated: e.data.updated,
      });
    }
  }
  return all.sort((a, b) => b.updated.getTime() - a.updated.getTime()).slice(0, limit);
}

/** 全セクション分のナビ用データをまとめて取得（サイドバー/ドロワー共通） */
export async function loadNavSections(): Promise<NavSection[]> {
  const out: NavSection[] = [];
  for (const s of SECTIONS) {
    const entries = await publishedEntries(s.collection);
    if (entries.length === 0) continue;
    out.push({
      collection: s.collection,
      label: s.label,
      icon: s.icon,
      href: s.href,
      items: entries.map((e) => ({
        id: e.id,
        title: titleOf(e),
        href: hrefOf(s.collection, e.id),
        el: (e.data as Record<string, unknown>).element as string | undefined,
      })),
    });
  }
  return out;
}
