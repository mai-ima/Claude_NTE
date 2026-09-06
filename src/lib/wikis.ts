/**
 * マルチwiki（複数ゲーム）の定義。
 *
 * このサイトは「1サイト＝1ゲーム」ではなく、**wiki を並置**できる構成にしてある。
 *  - NTE wiki      : ルート（/）に置く既定の wiki。
 *  - αテスト wiki  : /alpha/ 配下。NTE とはコレクション・ナビ・レイアウトを完全分離。
 *
 * 新しいゲームの wiki を足すときは
 *   1. src/lib/nav.ts に <GAME>_SECTIONS を定義（コレクション名は wiki 間で一意に）
 *   2. src/content.config.ts にコレクションを追加
 *   3. ここに WikiMeta を1件足す
 *   4. src/pages/<base>/ 配下にページを置く
 * の4手順で済む。共通コンポーネント（BaseLayout / EntityList / EntityDetail / Sidebar）は
 * すべて `wiki` prop で切り替わる。
 */
import { SECTIONS, ALPHA_SECTIONS, type SectionMeta } from './nav';

export type WikiId = 'nte' | 'alpha';

export interface WikiNavItem {
  label: string;
  href: string;
  icon: string;
}

export interface WikiMeta {
  id: WikiId;
  /** URL の接頭辞。ルート wiki は ''（空） */
  base: string;
  /** ヘッダーの角丸マーク（短い記号・略称） */
  mark: string;
  /** マークの右に出す名前 */
  brand: string;
  /** <title> やフッターで使う正式名 */
  siteName: string;
  /** 一覧・切替UIに出す短い説明 */
  tagline: string;
  /** 既定のメタディスクリプション */
  description: string;
  /** wiki を識別する CSS フック（html[data-wiki]）。配色のアクセントを変える */
  accent: string;
  /** フッターの注記（権利表記など） */
  footer: string;
  /** データベース（コレクション）セクション */
  sections: SectionMeta[];
  /** ヘッダー／ドロワーのグローバルナビ */
  primaryNav: WikiNavItem[];
  /** モバイル下部ナビ */
  bottomNav: WikiNavItem[];
  /** OG画像を /og/ に生成しているか（未生成の wiki では既定アイコンを使う） */
  hasOgImages: boolean;
}

const NTE: WikiMeta = {
  id: 'nte',
  base: '',
  mark: 'NTE',
  brand: '完全攻略wiki',
  siteName: 'NTE 完全攻略wiki',
  tagline: 'Neverness to Everness の攻略・データベース',
  description:
    'NTE（Neverness to Everness）に関する攻略・情報をまとめた非公式ファンwiki + 各種ツール。',
  accent: '#3b82f6',
  footer:
    'NTE 完全攻略wiki — 非公式ファンサイト。各記事は出典を明記し、未確認情報には「要確認」を付しています。ゲーム内画像・地図等の権利はすべて Hotta Studio / Perfect World Games に帰属します。',
  sections: SECTIONS,
  primaryNav: [
    { label: 'ホーム', href: '/', icon: 'home' },
    { label: 'ガチャ/イベント', href: '/events/', icon: 'calendar-clock' },
    { label: 'キャラ', href: '/characters/', icon: 'users' },
    { label: '用語集', href: '/terms/', icon: 'book-a' },
    { label: 'ツール', href: '/tools/', icon: 'wrench' },
    { label: 'ティア表', href: '/tools/tier-list/', icon: 'bar-chart-3' },
    { label: '更新履歴', href: '/release-notes/', icon: 'history' },
    { label: '設定', href: '/settings/', icon: 'settings' },
  ],
  bottomNav: [
    { label: 'ホーム', href: '/', icon: 'home' },
    { label: 'キャラ', href: '/characters/', icon: 'users' },
    { label: 'ツール', href: '/tools/', icon: 'wrench' },
    { label: '設定', href: '/settings/', icon: 'settings' },
  ],
  hasOgImages: true,
};

const ALPHA: WikiMeta = {
  id: 'alpha',
  base: '/alpha',
  mark: 'α',
  brand: 'αテストwiki',
  siteName: 'αテスト（仮）wiki',
  tagline: 'マルチwiki機能の検証用サンプル',
  description:
    'マルチwiki機能を検証するためのサンプルwiki。「αテスト（仮）」は実在のゲームではなく、複数ゲームのwikiを1サイトに並置できるかを確かめるための仮のタイトルです。',
  accent: '#a855f7',
  footer:
    'αテスト（仮）wiki — マルチwiki機能の検証用サンプルです。「αテスト（仮）」は実在のゲームではなく、記事の内容もすべてサンプルデータです。NTE の情報とは切り離して管理しています。',
  sections: ALPHA_SECTIONS,
  // 注意: ここに**他 wiki のページを混ぜない**こと。混ざると α のタブやナビから
  // NTE 側へ飛ばされてしまう（実際に一度そうなった）。テストでも検査している。
  primaryNav: [
    { label: 'ホーム', href: '/alpha/', icon: 'home' },
    { label: 'キャラクター', href: '/alpha/characters/', icon: 'users' },
    { label: 'システム', href: '/alpha/systems/', icon: 'settings-2' },
    { label: 'ガイド', href: '/alpha/guides/', icon: 'compass' },
    { label: '用語集', href: '/alpha/terms/', icon: 'book-a' },
  ],
  bottomNav: [
    { label: 'ホーム', href: '/alpha/', icon: 'home' },
    { label: 'キャラクター', href: '/alpha/characters/', icon: 'users' },
    { label: 'システム', href: '/alpha/systems/', icon: 'settings-2' },
    { label: 'ガイド', href: '/alpha/guides/', icon: 'compass' },
    { label: '用語集', href: '/alpha/terms/', icon: 'book-a' },
  ],
  hasOgImages: false,
};

export const WIKIS: Record<WikiId, WikiMeta> = { nte: NTE, alpha: ALPHA };

/** 切替UIの表示順（ルート wiki が先） */
export const WIKI_LIST: WikiMeta[] = [NTE, ALPHA];

export const DEFAULT_WIKI: WikiId = 'nte';

export function wiki(id: WikiId = DEFAULT_WIKI): WikiMeta {
  return WIKIS[id] ?? WIKIS[DEFAULT_WIKI];
}

/** コレクション名からそれが属する wiki を引く（不明なら既定 wiki）。 */
export function wikiOfCollection(collection: string): WikiMeta {
  for (const w of WIKI_LIST) {
    if (w.sections.some((s) => s.collection === collection)) return w;
  }
  return WIKIS[DEFAULT_WIKI];
}

/**
 * パス（base を除いたサイト内パス）から wiki を判定する。
 * 例: '/alpha/characters/foo/' → alpha、'/characters/foo/' → nte。
 * base 付き（'/claude_nte/alpha/…'）でも動くよう、部分一致で判定する。
 */
export function wikiOfPath(pathname: string): WikiMeta {
  const p = pathname.endsWith('/') ? pathname : `${pathname}/`;
  for (const w of WIKI_LIST) {
    if (w.base && (p.includes(`${w.base}/`) || p.endsWith(w.base))) return w;
  }
  return WIKIS[DEFAULT_WIKI];
}
