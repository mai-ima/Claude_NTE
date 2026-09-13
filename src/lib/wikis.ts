/**
 * マルチwiki（複数ゲーム）の定義。
 *
 * このサイトは「1サイト＝1ゲーム」ではなく、**wiki を並置**できる構成にしてある。
 *
 * | wiki | base | 状態 | UI |
 * | --- | --- | --- | --- |
 * | NTE                    | `/`         | 運用中 | 共通レイアウト（BaseLayout） |
 * | アークナイツ：エンドフィールド | `/endfield/` | 運用中 | **専用**（EndfieldLayout + endfield.css） |
 * | 原神                   | `/genshin/` | 準備中 | **専用**（GenshinLayout + genshin.css） |
 * | 鳴潮                   | `/wuwa/`    | 準備中 | **専用**（WuwaLayout + wuwa.css） |
 * | 崩壊：スターレイル       | `/hsr/`     | 準備中 | **専用**（HsrLayout + hsr.css） |
 * | αテスト（仮）           | `/alpha/`   | サンプル | **専用**（AlphaLayout + alpha.css） |
 *
 * 一覧の正は docs/WIKIS.md。追加手順は docs/RECIPES.md「wiki を1つ足す」。
 *
 * 新しいゲームの wiki を足すときは
 *   1. src/lib/nav.ts に <GAME>_SECTIONS を定義（コレクション名は wiki 間で一意に）
 *   2. src/content.config.ts にコレクションを追加
 *   3. ここに WikiMeta を1件足す
 *   4. src/pages/<base>/ 配下にページを置く
 * の4手順で済む。共通コンポーネント（BaseLayout / EntityList / EntityDetail / Sidebar）は
 * すべて `wiki` prop で切り替わる。**専用UIの wiki はそれらを使わず自前で組む。**
 */
import { SECTIONS, ALPHA_SECTIONS, ENDFIELD_SECTIONS, type SectionMeta } from './nav';

export type WikiId = 'nte' | 'endfield' | 'genshin' | 'wuwa' | 'hsr' | 'alpha';

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
  /**
   * wiki 一覧（/wikis/）での位置づけ。省略時は 'live'。
   *
   *  - 'live'    : 通常運用の wiki
   *  - 'planned' : **準備中**。ページは1枚だけで、記事コレクションを持たない（sections が空）
   *  - 'sample'  : 実在しないゲームのダミーデータ（マルチwiki機能の検証用）
   */
  kind?: 'live' | 'planned' | 'sample';
  /**
   * そのゲームの公式サイト。準備中の wiki で「中身はまだ無いが公式はここ」と案内するために使う。
   * **URL は実在を確認してから書くこと**（リンク切れは誠実さの問題になる）。
   */
  officialUrl?: string;
  /** 権利表記に出す権利者名（開発・配信元） */
  rightsHolder?: string;
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
  kind: 'live',
  primaryNav: [
    { label: 'ホーム', href: '/', icon: 'home' },
    { label: 'ガチャ/イベント', href: '/events/', icon: 'calendar-clock' },
    { label: 'キャラ', href: '/characters/', icon: 'users' },
    { label: '用語集', href: '/terms/', icon: 'book-a' },
    { label: 'ツール', href: '/tools/', icon: 'wrench' },
    { label: 'ティア表', href: '/tools/tier-list/', icon: 'bar-chart-3' },
    { label: '保存したページ', href: '/favorites/', icon: 'bookmark' },
    { label: '更新履歴', href: '/release-notes/', icon: 'history' },
    { label: 'wiki 一覧', href: '/wikis/', icon: 'library' },
    { label: '設定', href: '/settings/', icon: 'settings' },
  ],
  bottomNav: [
    { label: 'ホーム', href: '/', icon: 'home' },
    { label: 'キャラ', href: '/characters/', icon: 'users' },
    { label: 'ツール', href: '/tools/', icon: 'wrench' },
    { label: '保存', href: '/favorites/', icon: 'bookmark' },
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
  kind: 'sample',
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

/**
 * アークナイツ：エンドフィールド wiki。
 * NTE の共通レイアウトは使わず、**EndfieldLayout + endfield.css** で独自に組む。
 */
const ENDFIELD: WikiMeta = {
  id: 'endfield',
  base: '/endfield',
  mark: 'EF',
  brand: 'エンドフィールド攻略',
  siteName: 'アークナイツ：エンドフィールド 攻略wiki',
  tagline: '惑星タロIIの開拓を進めるための攻略・データベース',
  description:
    'アークナイツ：エンドフィールド（Arknights: Endfield）の攻略・データベースをまとめた非公式ファンwiki。オペレーター・武器・集成工業システム・エリアなどを収録します。',
  accent: '#f0a020',
  footer:
    'アークナイツ：エンドフィールド 攻略wiki — 非公式ファンサイトです。各記事は出典を明記し、未確認情報には「要確認」を付しています。ゲームの著作権はすべて Hypergryph / MOUNTAIN CONTOUR / GRYPHLINE に帰属します。',
  sections: ENDFIELD_SECTIONS,
  kind: 'live',
  officialUrl: 'https://endfield.gryphline.com/ja-jp',
  rightsHolder: 'Hypergryph / MOUNTAIN CONTOUR / GRYPHLINE',
  // 他 wiki のページを混ぜないこと（test/wikis.test.ts が検査している）
  primaryNav: [
    { label: 'ホーム', href: '/endfield/', icon: 'home' },
    { label: 'オペレーター', href: '/endfield/operators/', icon: 'users' },
    { label: '武器', href: '/endfield/weapons/', icon: 'sword' },
    { label: 'システム', href: '/endfield/systems/', icon: 'settings-2' },
    { label: '用語集', href: '/endfield/terms/', icon: 'book-a' },
  ],
  bottomNav: [
    { label: 'ホーム', href: '/endfield/', icon: 'home' },
    { label: 'オペレーター', href: '/endfield/operators/', icon: 'users' },
    { label: 'システム', href: '/endfield/systems/', icon: 'settings-2' },
    { label: '用語集', href: '/endfield/terms/', icon: 'book-a' },
  ],
  hasOgImages: false,
};

/**
 * 準備中（`kind: 'planned'`）の wiki。
 *
 * - **記事コレクションを持たない**（`sections: []`）。ページはトップ1枚だけ
 * - それぞれ**そのゲームのUIを再現した専用レイアウト**で表示する
 *   （見た目だけ用意して中身が無い、ではなく「そのゲームの wiki がこれから建つ」と伝える）
 * - `noindex` にし、sitemap からも外す（中身の無いページを検索に載せない）
 * - 公式サイトの URL は **2026-09-07 に HTTP 200 を確認済み**
 */
const GENSHIN: WikiMeta = {
  id: 'genshin',
  base: '/genshin',
  mark: '原',
  brand: '原神攻略',
  siteName: '原神 攻略wiki（準備中）',
  tagline: '準備中 — これから作ります',
  description:
    '原神（Genshin Impact）の攻略wiki。現在準備中です。公式サイトへのご案内のみ掲載しています。',
  accent: '#c8a35a',
  footer:
    '原神 攻略wiki（準備中）— 非公式ファンサイトです。ゲームの著作権はすべて COGNOSPHERE PTE. LTD. / miHoYo に帰属します。',
  sections: [],
  kind: 'planned',
  officialUrl: 'https://genshin.hoyoverse.com/ja/',
  rightsHolder: 'COGNOSPHERE PTE. LTD. / miHoYo',
  primaryNav: [{ label: 'ホーム', href: '/genshin/', icon: 'home' }],
  bottomNav: [{ label: 'ホーム', href: '/genshin/', icon: 'home' }],
  hasOgImages: false,
};

const WUWA: WikiMeta = {
  id: 'wuwa',
  base: '/wuwa',
  mark: '鳴',
  brand: '鳴潮攻略',
  siteName: '鳴潮 攻略wiki（準備中）',
  tagline: '準備中 — これから作ります',
  description:
    '鳴潮（Wuthering Waves）の攻略wiki。現在準備中です。公式サイトへのご案内のみ掲載しています。',
  accent: '#2dd4bf',
  footer:
    '鳴潮 攻略wiki（準備中）— 非公式ファンサイトです。ゲームの著作権はすべて KURO GAMES に帰属します。',
  sections: [],
  kind: 'planned',
  officialUrl: 'https://wutheringwaves.kurogames.com/',
  rightsHolder: 'KURO GAMES',
  primaryNav: [{ label: 'ホーム', href: '/wuwa/', icon: 'home' }],
  bottomNav: [{ label: 'ホーム', href: '/wuwa/', icon: 'home' }],
  hasOgImages: false,
};

const HSR: WikiMeta = {
  id: 'hsr',
  base: '/hsr',
  mark: '星',
  brand: 'スターレイル攻略',
  siteName: '崩壊：スターレイル 攻略wiki（準備中）',
  tagline: '準備中 — これから作ります',
  description:
    '崩壊：スターレイル（Honkai: Star Rail）の攻略wiki。現在準備中です。公式サイトへのご案内のみ掲載しています。',
  accent: '#8b7fd4',
  footer:
    '崩壊：スターレイル 攻略wiki（準備中）— 非公式ファンサイトです。ゲームの著作権はすべて COGNOSPHERE PTE. LTD. / miHoYo に帰属します。',
  sections: [],
  kind: 'planned',
  officialUrl: 'https://hsr.hoyoverse.com/ja-jp/',
  rightsHolder: 'COGNOSPHERE PTE. LTD. / miHoYo',
  primaryNav: [{ label: 'ホーム', href: '/hsr/', icon: 'home' }],
  bottomNav: [{ label: 'ホーム', href: '/hsr/', icon: 'home' }],
  hasOgImages: false,
};

export const WIKIS: Record<WikiId, WikiMeta> = {
  nte: NTE,
  endfield: ENDFIELD,
  genshin: GENSHIN,
  wuwa: WUWA,
  hsr: HSR,
  alpha: ALPHA,
};

/**
 * 切替UIの表示順。
 * **先頭は必ずルート wiki（nte）**。運用中 → 準備中 → サンプルの順に並べ、
 * α（実在しないゲームの検証用サンプル）を末尾に置く。
 */
export const WIKI_LIST: WikiMeta[] = [NTE, ENDFIELD, GENSHIN, WUWA, HSR, ALPHA];

/** 通常運用中の wiki だけ（フッターの羅列など、全部並べると長すぎる場所で使う） */
export const LIVE_WIKIS: WikiMeta[] = WIKI_LIST.filter((w) => (w.kind ?? 'live') === 'live');

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
