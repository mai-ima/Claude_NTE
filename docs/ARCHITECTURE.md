# ARCHITECTURE — このリポジトリの構造（調べ直さないための地図）

> このファイルは「**どこに何があるか**」の地図です。
> 「今どうなっているか・何をしたか」は [CONTEXT.md](../CONTEXT.md)、
> 「〜を足すときの手順」は [RECIPES.md](./RECIPES.md)、
> 「検査が何を禁じているか」は [CHECKS.md](./CHECKS.md) にあります。
>
> 最終更新: 2026-09-06

---

## 0. 全体像

Astro 6 の**静的サイト**。1サイトに**複数ゲームの wiki を並置**する。

| wiki | URL | レイアウト | CSS | View Transitions |
| --- | --- | --- | --- | --- |
| NTE 完全攻略wiki（既定） | `/` | `BaseLayout.astro` | `themes/base/components/ui-*/prefs/ios` | **あり**（`ClientRouter`） |
| αテスト（仮）wiki | `/alpha/` | `AlphaLayout.astro` | **`alpha.css` のみ** | なし |

- `trailingSlash: 'always'` / `base = "/"` / 出力は `dist/`（Vercel が配信）
- **本番は `main` ブランチのみ**。作業ブランチは Vercel のプレビューURLにしか出ない。

---

## 1. ルート直下

| パス | 役割 |
| --- | --- |
| `astro.config.mjs` | サイト設定・統合・**旧URLのリダイレクト**・Markdown プロセッサ（`unified()`） |
| `CLAUDE.md` | 作業時の入口（最初に読むもの） |
| `CONTEXT.md` | **記憶ファイル**（現在の状態・作業ログ・守るルール） |
| `README.md` | 利用者・貢献者向けの説明 |
| `docs/` | このディレクトリ（構造の知識） |
| `scripts/` | 検査スクリプト（`check-content` / `check-links` / `check-ui`）と `gen-icons.mjs` |
| `test/` | vitest（`wikis` / `nav` / `path` / `content` / `lib-misc`） |
| `.github/workflows/verify.yml` | push ごとに `pnpm verify` 相当を実行 |
| `.claude/` | `settings.json` と `hooks/load-context.sh`（セッション開始・圧縮時に CONTEXT.md を出力） |

---

## 2. `src/lib/` — ロジックの本体

**すべて相互 import が浅い**（`prefs` / `theme` / `ui` / `path` は他を import しない）。

### `wikis.ts` — マルチwikiの定義（★ここが中心）

```ts
type WikiId = 'nte' | 'alpha';
interface WikiNavItem { label: string; href: string; icon: string }
interface WikiMeta {
  id; base;              // base はURL接頭辞。ルート wiki は ''（空文字）
  mark; brand; siteName; tagline; description;
  accent;                // wiki を識別する色
  footer;                // フッターの注記
  sections: SectionMeta[];
  primaryNav: WikiNavItem[];   // ヘッダー／ドロワー
  bottomNav: WikiNavItem[];    // モバイル下部タブ
  hasOgImages: boolean;
}

WIKIS: Record<WikiId, WikiMeta>    // { nte, alpha }
WIKI_LIST: WikiMeta[]              // 表示順。[0] は必ずルート wiki（nte）
DEFAULT_WIKI: WikiId               // 'nte'
wiki(id?): WikiMeta                        // 未知の id は既定 wiki へフォールバック
wikiOfCollection(collection): WikiMeta     // 'characters'→nte / 'alphaTerms'→alpha
wikiOfPath(pathname): WikiMeta             // '/alpha/…'→alpha / それ以外→nte
```

import しているのは 8 ファイル:
`pages/index.astro` / `pages/alpha/index.astro` / `lib/content.ts` /
`layouts/BaseLayout.astro` / `layouts/AlphaLayout.astro` /
`components/EntityDetail.astro` / `components/EntityList.astro` /
`components/Sidebar.astro` / `components/MobileDrawer.astro`

### `nav.ts` — セクション定義と属性メタ

```ts
interface SectionMeta {
  collection;   // astro:content のコレクション名（wiki 間で一意）
  href;         // URL ベース（例 '/characters/'）
  label; icon; blurb;
  dir?;         // src/content 配下のディレクトリ名。既定はコレクション名と同じ
}

SECTIONS: SectionMeta[]        // NTE の 13 セクション（dir は全件 undefined）
ALPHA_SECTIONS: SectionMeta[]  // α の 4 セクション（dir は全件ケバブ名）
sectionByCollection(collection) // 全 wiki 横断で引く
ELEMENT_META / elementMeta(id)  // 光/霊/呪/闇/魂/相 の色・ラベル
ELEMENT_RING / DUO_REACTIONS / reactionsFor(el)
ROLE_META / roleMeta(id)
```

**NTE の 13 セクション**（表示順）:
events / characters / people / systems / guides / terms / locations / shops / vehicles /
arcs / enemies / items / story

**α の 4 セクション**: alphaCharacters / alphaSystems / alphaGuides / alphaTerms
（`dir` はそれぞれ `alpha-characters` … のケバブ名）

> ⚠ `nav.ts` の `PRIMARY_NAV` / `BOTTOM_NAV` は**現在どこからも使われていない死んだ定義**。
> ナビの実体は `wikis.ts` の `WikiMeta.primaryNav` / `bottomNav`。
> `BaseLayout.astro:54-55` が `const PRIMARY_NAV = w.primaryNav` とローカルに置き直しているため
> 名前が同じで紛らわしい。**触るのは `wikis.ts` の方**。

### `content.ts` — コレクション横断ヘルパ

```ts
titleOf(entry): string             // characters は name、他は title
enNameOf(entry): string
hrefOf(collection, id): string     // セクションの href を基準にするので /alpha/ にも自動追従
publishedEntries(collection)       // draft 除外＋既定順ソート
recentEntries(limit = 6, sections = SECTIONS): RecentEntry[]
loadNavSections(sections = SECTIONS): NavSection[]
backlinksFor(collection, id)       // wikiOfCollection で同一 wiki 内に限定
phaseOf(nowMs, startMs, endMs): 'current' | 'upcoming' | 'ended'
loadEvents(now = new Date())       // ★NTE の events 決め打ち（他 wiki では使えない）
```

**`sections` 引数がマルチwikiの鍵**。`wiki('alpha').sections` を渡せば α のデータが取れる
（実例: `AlphaLayout.astro:39`、`pages/alpha/index.astro:9,11`）。
`recentEntries` / `loadNavSections` は wiki ごとにキャッシュされる。

### `path.ts`

```ts
withBase(path = '/'): string   // base を付け、末尾スラッシュを強制（'#'/'?'/拡張子つきはそのまま）
activeHref(currentPath, hrefs): string | null  // 最長一致1件。ホームは完全一致のみ
```

### `prefs.ts` — 表示の追加設定

```ts
interface PrefDef { key; attr; on; label; hint; group: 'display'|'feature'; icon }
PREFS: PrefDef[]
getPref(key): boolean          // localStorage が '1' か
applyPref(key, val)            // 真 → html.setAttribute('data-'+attr, on) / 偽 → removeAttribute
setPref(key, val)              // 保存してから applyPref
applyAllPrefs()
```

効果の実装は **CSS 側**（`src/styles/prefs.css` の `html[data-<attr>='<on>']`）。

### `theme.ts` / `ui.ts`

```ts
// theme.ts
type Theme = 'minimal' | 'dark' | 'soft' | 'auto';
THEMES / THEME_KEY='nte.theme' / THEME_COLORS
getStoredTheme() / applyTheme(theme)  // html[data-theme] ＋ meta[name=theme-color]
setTheme(theme)

// ui.ts
type UIMode = 'classic'|'new-classic'|'editorial'|'liquid'|'aurora'|'apple'|'terminal'|'clay'|'blueprint';
UI_MODES / UI_KEY='nte.ui'
getStoredUI() / applyUI(mode)         // html[data-ui]。旧値 'beta' → 'editorial' を移行
setUI(mode)
```

### `store.ts` — localStorage

```ts
STORE_PREFIX = 'nte.' / SCHEMA_VERSION = 1
load<T>(name, fallback) / save<T>(name, value) / remove(name) / uid()
exportAll()   // nte.* を生文字列のまま集める（ラウンドトリップ安全）
importAll(json): { ok, imported, error? }
clearAll(): number   // KEEP_ON_CLEAR に無い nte.* を全消去
```

### そのほか

| ファイル | 役割 |
| --- | --- |
| `detail.ts` | 詳細ページ共通（`detailPaths` / `renderEntry` / `baseDetailProps`） |
| `edit-url.ts` | GitHub の編集リンク（`editUrl` / `editUrlFor`） |
| `css.ts` | `cssVars(...)` — インライン CSS 変数の組み立て |
| `rehype-term-links.mjs` | 本文の**用語自動リンク**。`WIKI_GROUPS` で wiki ごとに辞書を分ける |

---

## 3. `src/layouts/`

### `BaseLayout.astro`（NTE 用・545行）

props: `title` / `description` / `image` / `wikiId`（既定 `'nte'`）ほか。

構造: `header.app-header`（`transition:persist`）／`MobileDrawer`／`main.app-main`／
`footer.app-footer`／`nav.bottom-nav`

**head の is:inline スクリプト（`:145-190` 付近）が起動時の要**。`data-astro-rerun` 付きで
View Transitions の swap 後にも再実行される。ここで:

1. `data-theme` を確定（＋ `meta[theme-color]`）
2. **`data-ios` を付与／除去**（UA が iPhone/iPad か。iPadOS は Mac を名乗るので `maxTouchPoints` で判別）
3. `data-ui` を確定（旧値 `'beta'` の移行を含む）
4. `PREFS` 相当の配列をループして `data-*` を付与

続く 2 本目のスクリプトが `data-reveal`（入場アニメ用。`data-astro-rerun` は**付けない**）。

`:490-525` 付近にクライアントスクリプト:
`astro:before-swap` で検索ダイアログとドロワーを閉じる（`<dialog>` の top-layer 残留対策）／
`astro:after-swap` で `data-reveal` を外す／`astro:page-load` でナビの現在地を同期。

### `AlphaLayout.astro`（α 専用・231行）

**`alpha.css` だけを import する**（NTE の CSS を一切読まない）。`ClientRouter` も積まない。

構造: `.a-shell` ＞ `.a-top` / `.a-side` / `.a-main` / `.a-foot` / `.a-tabs`
テーマは `localStorage['alpha.theme']`（NTE とは別キー）。

---

## 4. `src/components/`

| ファイル | 役割 |
| --- | --- |
| `EntityList.astro` | 汎用一覧（characters 以外）。Pagefind 検索・グルーピング・チップ絞り込み |
| `EntityDetail.astro` | 記事詳細の共通レイアウト（情報パネル＋本文＋出典＋個人メモ） |
| `Sidebar.astro` | デスクトップ左サイドバー（props: `currentCollection`, `wikiId`） |
| `MobileDrawer.astro` | モバイル左ドロワー（props: `currentPath`, `wikiId`）。**wiki 切替あり** |
| `Avatar.astro` | 公式アートを使わない生成アバター（属性グラデ＋頭文字＋レア度） |
| `Callout.astro` | 注意書き（`info`/`warning`/`note`/`tip`/`success`/`danger`/`lore`） |
| `Spoiler.astro` | `<details>` のネタバレ折りたたみ |
| `StatusBadge.astro` | `verified` / `draft`（要確認）のバッジ |
| `Toc.astro` | 目次 |
| `Figure.astro` / `VideoEmbed.astro` | 図版／YouTube nocookie 埋め込み |
| `AnomalyClassChart.astro` / `ElementMatchup.astro` / `EsperRing.astro` | 自前生成の図解 |
| `SettingsPanel.tsx` | 設定パネル（Preact・`client:only`）。**inline-SVG の `ICON_PATHS` を自前で持つ** |
| `ThemeMenu.tsx` | ヘッダーのテーマ切替（Preact・`client:load`） |
| `PersonalNote.tsx` | 記事ごとの個人メモ（localStorage） |
| `alpha/AlphaList.astro` | α の一覧（クライアント側フィルタ。Pagefind 不使用） |
| `alpha/AlphaArticle.astro` | α の記事本体（1カラム・目次・出典・前後リンク） |
| `tools/registry.ts` | ツールの登録簿。**ここに1件足せば `/tools/[id]/` が生える** |
| `tools/ToolHost.tsx` | id でツールを描画。`useErrorBoundary` で白画面化を防ぐ |
| `tools/useStore.ts` / `tools/chart.tsx` | ツール共通の状態フックとチャート描画 |

登録済みツール（`registry.ts`）: gacha-dashboard / gacha-sim / gacha-pity / reaction-chart /
planner / checklist / timer / notes
※ tier-list / team-builder / map / compare / calendar は**専用ページ**（`pages/tools/*.astro`）

---

## 5. `src/styles/` — 読み込み順が意味を持つ

`BaseLayout.astro:2-14` の import 順がそのまま優先順位（後が勝つ）:

```
themes.css → base.css → components.css
  → ui-new-classic / ui-editorial / ui-liquid / ui-aurora
  → ui-apple / ui-terminal / ui-clay / ui-blueprint
  → prefs.css → ios.css
```

| ファイル | スコープ | 中身 |
| --- | --- | --- |
| `themes.css` | `html[data-theme]` | 4 テーマの CSS 変数 |
| `base.css` | — | リセットと土台 |
| `components.css` | — | **本体（43KB）**。ヘッダー・カード・一覧・下部ナビ・wiki切替など |
| `ui-*.css`（9種） | `html[data-ui]` | 新UIの見た目。**`ui-new.css` だけは骨組みも変える**（下記） |
| `prefs.css` | `html[data-<pref>]` | 表示の追加設定の効果 |
| `ios.css` | `html[data-ios]` | iPhone / iPad 向けの調整（**BaseLayout でのみ読む**） |
| `alpha.css` | — | **α 専用**のデザインシステム（`--a-*` トークン）。末尾に α 用の `html[data-ios]` あり |

### UIモード（`html[data-ui]`）の作り分け

`ui-editorial` / `ui-liquid` / `ui-aurora` / `ui-apple` / `ui-terminal` / `ui-clay` /
`ui-blueprint` / `ui-new-classic` は「質感・タイポ・色」を塗り替えるレイヤーで、
**画面の骨組み（`.app` のグリッド）は classic のまま**です。

**`ui-new.css`（次期ベース候補）だけは構成そのものを変えます**:

- パソコン（960px 以上）: `.app` の `grid-template-areas` を `'rail main' / 'rail footer'` に変え、
  `.app-header` を**左端の縦レール**（幅 `--n-rail`）にする。ヘッダーの中身
  （ブランド／wiki切替／グローバルナビ／検索／テーマ）を縦に積み替える。
- スマホ: `.bottom-nav` を画面端から浮かせた**ドック**にする。
- モーションは scroll-driven animations（`animation-timeline: scroll() / view()`）で、
  `@supports` で囲って対応ブラウザだけに効かせる（非対応では既存の JS リビールが動く）。
- 動きは `prefers-reduced-motion` と `html[data-motion='reduce']` の**両方**で止まる。

骨組みを変える都合で、次の2つは他モードにも影響する形で整理してあります:

- `ThemeMenu` のポップの位置は**インラインスタイルではなく `.theme-menu-pop`**（CSS）にある
  （レールでは出す向きを変える必要があるため）
- 起動スクリプトの UIモード一覧は `UI_MODES` から `define:vars` で流し込む（配列を書き写さない）

`components.css` の目印:

- `:335-341` `.grid` / `.grid-cards`（**CSS Grid**。`auto-fill, minmax(240px, 1fr)`）
- `:883-896` `.bottom-nav`（**safe-area 対応済み**。`height: calc(58px + env(safe-area-inset-bottom))`）
- `:1527-1545` `html`/`body` の共通（タップハイライト除去・`scroll-padding-top`・横スクロール抑止）
- `:1899-1972` `.wiki-switch`（ヘッダーの wiki 切替ポップオーバー）

---

## 6. `src/content/` と `src/pages/`

### コレクションと記事数（2026-09-06 時点・全 264 本）

| コレクション | 件数 | | コレクション | 件数 |
| --- | ---: | --- | --- | ---: |
| terms | 105 | | items | 13 |
| characters | 25 | | locations | 9 |
| events | 24 | | guides | 9 |
| enemies | 18 | | shops | 7 |
| systems | 18 | | vehicles | 7 |
| arcs | 13 | | people | 4 |
| story | 4 | | **α（4種 × 2本）** | 8 |

スキーマは `src/content.config.ts`（zod）。共通の `base`（`description` / `status` / `updated` /
`checked` / `sources` / `tags`）＋コレクション固有項目。α は `alphaBase` を使う。

`updated` と `checked` の違い（重要）:

| 項目 | 意味 | 必須 |
| --- | --- | --- |
| `updated` | **本文を書き換えた**日 | 必須 |
| `checked` | 本文は変えていないが、**出典に当たり直して現行版でも正しいと確かめた**日 | 任意 |

分けている理由: 確認しただけの記事の `updated` を今日にすると「書き直した」と誤解され、
何も書かないと「3ヶ月前の情報」に見える。両方持てば「6/11 に書き、9/6 に再確認」と正確に言える。
記事ページの見出し下には `更新: …` の隣に `確認: …` が出る（`checked > updated` のときだけ）。
`pnpm test:content` の鮮度サマリーも新しい方を見る。

### ページ

- NTE: `src/pages/` 直下（各セクションの `index.astro` と `[slug].astro`）
- α: `src/pages/alpha/` 配下（同じ構成）
- 単独ページ: `index` / `wikis`（wiki 一覧＝ハブ）/ `settings` / `release-notes` / `404` /
  `og/[...slug].png.ts`
  - `wikis.astro` は `WIKI_LIST` から中身を組み立てるので、wiki を足しても**触らなくてよい**
- ツール: `tools/index` / `tools/[id]` ＋ 専用 5 ページ

---

## 7. localStorage のキー一覧

| キー | 種別 | 初期化で消える？ |
| --- | --- | --- |
| `nte.theme` | 設定（配色テーマ） | **残る** |
| `nte.ui` | 設定（UIモード） | **残る** |
| `nte.fontsize` / `nte.lineheight`（多値） | 設定（読みやすさ） | **残る** |
| `nte.motion` / `nte.autoterm` / `nte.spoiler` / `nte.width` / `nte.draftmark` | 設定（読みやすさ） | **残る** |
| `nte.listview` / `nte.listsort`（多値） | 設定（一覧） | **残る** |
| `nte.homewiki`（多値・属性を書かない） | 設定（wiki） | **残る** |
| `nte.tapfx`（多値） / `nte.tabbar` / `nte.callout` | 設定（タッチ操作） | **残る** |
| `nte.edit` | 設定（機能） | **残る** |
| `nte.<ツールの状態>` / 個人メモ など | データ | 消える |
| `alpha.theme` | α のテーマ | **対象外**（`nte.` 接頭辞でないため export/clear の対象外） |

「残る」の判定は `src/lib/store.ts` の `KEEP_ON_CLEAR`。
`exportAll()` / `importAll()` は `nte.` 接頭辞のキーだけを扱う。

---

## 8. 検証コマンド

```bash
pnpm verify   # test → test:content → check(astro check) → build → test:ui → test:links
```

個別に走らせるなら `pnpm test` / `pnpm test:content` / `pnpm check` / `pnpm build` /
`pnpm test:ui` / `pnpm test:links`。詳細と「何を禁じているか」は [CHECKS.md](./CHECKS.md)。
