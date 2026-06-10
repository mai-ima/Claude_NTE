/** コレクション横断のヘルパ。表示タイトル・リンク・サイドバー用データを組み立てる。 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { withBase } from './path';
import { SECTIONS } from './nav';

type AnyEntry = CollectionEntry<
  | 'characters'
  | 'locations'
  | 'enemies'
  | 'systems'
  | 'story'
  | 'items'
  | 'guides'
  | 'events'
  | 'shops'
  | 'terms'
>;

/** エントリの表示タイトル（日本版名称を優先: nameJa → title → name） */
export function titleOf(entry: AnyEntry): string {
  const d = entry.data as Record<string, unknown>;
  return (d.nameJa as string) || (d.title as string) || (d.name as string) || entry.id;
}

/** 英語名（avatar のイニシャルや併記用）。characters のみ */
export function enNameOf(entry: AnyEntry): string {
  const d = entry.data as Record<string, unknown>;
  return (d.name as string) || (d.title as string) || entry.id;
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
  /** characters のレア度（任意） */
  rarity?: string;
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

// --- backlinks（記事間の被リンク） ------------------------------------------

interface IndexedEntry {
  collection: string;
  id: string;
  title: string;
  href: string;
  sectionLabel: string;
  body: string;
}
let _entryIndex: IndexedEntry[] | null = null;

/** 全公開エントリの本文インデックス（ビルド中キャッシュ） */
async function entryIndex(): Promise<IndexedEntry[]> {
  if (_entryIndex) return _entryIndex;
  const idx: IndexedEntry[] = [];
  for (const s of SECTIONS) {
    for (const e of await publishedEntries(s.collection)) {
      idx.push({
        collection: s.collection,
        id: e.id,
        title: titleOf(e),
        href: hrefOf(s.collection, e.id),
        sectionLabel: s.label,
        body: ((e as { body?: string }).body ?? '') as string,
      });
    }
  }
  _entryIndex = idx;
  return idx;
}

export interface Backlink {
  title: string;
  href: string;
  sectionLabel: string;
}

/** 指定エントリへ本文からリンクしている他記事（被リンク）を返す。 */
export async function backlinksFor(collection: string, id: string): Promise<Backlink[]> {
  const idx = await entryIndex();
  // コンテンツの内部リンクは絶対パス記法 `](/coll/id/)`
  const needles = [`/${collection}/${id}/`, `/${collection}/${id})`];
  return idx
    .filter(
      (e) =>
        !(e.collection === collection && e.id === id) &&
        needles.some((n) => e.body.includes(n)),
    )
    .map(({ title, href, sectionLabel }) => ({ title, href, sectionLabel }));
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
        rarity: (e.data as Record<string, unknown>).rarity as string | undefined,
      })),
    });
  }
  return out;
}

// --- events（ガチャ/イベントの開催状況） --------------------------------------

export type EventPhase = 'current' | 'upcoming' | 'ended';

export interface EventInfo {
  id: string;
  title: string;
  href: string;
  kind: 'banner' | 'weapon-banner' | 'event';
  featured: string[];
  version?: string;
  start?: Date;
  end?: Date;
  phase: EventPhase;
  /** 開催中なら終了まで、予定なら開始までの残り日数（端数切り上げ） */
  daysLeft?: number;
}

const DAY = 86_400_000;
const ceilDays = (from: Date, to: Date) => Math.max(0, Math.ceil((to.getTime() - from.getTime()) / DAY));

/** 全 events を開催状況付きで取得（current → upcoming → ended の順、各内は終了/開始が近い順）。 */
export async function loadEvents(now: Date = new Date()): Promise<EventInfo[]> {
  const entries = await publishedEntries('events');
  const infos: EventInfo[] = entries.map((e) => {
    const d = e.data as Record<string, unknown>;
    const start = d.start as Date | undefined;
    const end = d.end as Date | undefined;
    let phase: EventPhase = 'current';
    if (start && now < start) phase = 'upcoming';
    else if (end && now > end) phase = 'ended';
    const daysLeft =
      phase === 'current' && end ? ceilDays(now, end) : phase === 'upcoming' && start ? ceilDays(now, start) : undefined;
    return {
      id: e.id,
      title: titleOf(e),
      href: hrefOf('events', e.id),
      kind: (d.kind as EventInfo['kind']) ?? 'event',
      featured: (d.featured as string[]) ?? [],
      version: d.version as string | undefined,
      start,
      end,
      phase,
      daysLeft,
    };
  });
  const rank: Record<EventPhase, number> = { current: 0, upcoming: 1, ended: 2 };
  return infos.sort((a, b) => {
    if (rank[a.phase] !== rank[b.phase]) return rank[a.phase] - rank[b.phase];
    if (a.phase === 'ended') return (b.end?.getTime() ?? 0) - (a.end?.getTime() ?? 0); // 新しく終わった順
    return (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999); // 締切/開始が近い順
  });
}
