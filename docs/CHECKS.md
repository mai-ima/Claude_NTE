# CHECKS — 検査が何を禁じているか（と、落ちたときの直し方）

> `pnpm verify` が落ちたとき、**どの検査が何を怒っているか**をここで引きます。
> 各検査は「過去に実際に起きた不具合」の再発防止として足されたもので、
> **緩めるのではなく、コード側を直す**のが原則です。
>
> 最終更新: 2026-09-06

```bash
pnpm verify
# = pnpm test → pnpm test:content → pnpm check → pnpm build → pnpm test:ui → pnpm test:links
```

同じ並びが `.github/workflows/verify.yml` で push のたびに走ります。

---

## 1. `pnpm test`（vitest） — 43 テスト

`test/` 配下。**ビルド不要**なので最初に落ちます。

### `test/wikis.test.ts` — wiki 分離の不変条件（★最重要）

ここが赤い＝**マルチwikiの分離が壊れた**合図。テストを直すのではなく、定義を直すこと。

| # | 条件 | 破ると起きること |
| --- | --- | --- |
| 1 | 既定は `nte`、`wiki().base === ''` | ルート wiki が定まらない |
| 2 | 未知の id は既定 wiki へフォールバック | 存在しない wiki で 500 |
| 3 | `WIKI_LIST[0].id === 'nte'`（ルート wiki が先頭） | 切替UIの並びが崩れる |
| 4 | **コレクション名は wiki をまたいで重複しない** | `wikiOfCollection` が誤判定し、記事が別 wiki のURLに出る |
| 5 | α の `sections` の href は全件 `/alpha/` 始まり | α の記事が NTE の URL に出る |
| 6 | NTE の `sections` の href は `/alpha/` に入らない | 同上（逆向き） |
| 7 | `wikiOfCollection` の対応（`characters`→nte / `alphaCharacters`→alpha） | — |
| 8 | `wikiOfPath` の対応（`/alpha/…`→alpha、base 付きでも動く） | — |
| 9 | `sectionByCollection` が両 wiki を横断して引ける | — |
| 10 | α のセクションは全件 `dir` を持ち、`dir !== collection` | 記事ファイルが見つからない |
| 11 | NTE のセクションは `dir` 省略（＝コレクション名＝ディレクトリ名） | 同上 |
| 12 | **`primaryNav` + `bottomNav` の全 href が `wikiOfPath(href).id === その wiki の id`** | **α のタブから NTE に飛ばされる**（実際に起きた） |
| 13 | α のナビに `/settings/` など NTE 専用ページが混ざっていない | 同上 |

> 条件 12 の含意: `/wikis/` のような `/alpha/` 以外のパスは `wikiOfPath` が `nte` を返すので、
> **NTE の nav には入れてよい／α の nav には入れられない**。
> α からそういうページへ導線を出すときは、nav 定義ではなく `AlphaLayout.astro` に直書きし、
> `check-ui.mjs` の許可リストに 1 件足します（→ 4 の例外）。

そのほか: `nav.test.ts`（属性・ロール・Duo反応）／`path.test.ts`（`withBase`・`activeHref`）／
`content.test.ts`（`hrefOf`・`phaseOf`）／`lib-misc.test.ts`（`cssVars`・`editUrl`・`store`）。

---

## 2. `pnpm test:content`（`scripts/check-content.mjs`） — 記事の体裁と誠実性

Markdown の**ソース**を直接読む（ビルド不要）。

| 指摘 | 直し方 |
| --- | --- |
| `verified なのに sources が無い` | 出典を足すか `status: "draft"` にする |
| `updated / description / tags が無い` | frontmatter に足す |
| `リンク先が存在しません: /foo/bar` | 綴りを直す。**非記事ページなら `STATIC_PAGES` に足す** |
| 内部リンクの記法ミス | 末尾スラッシュを付ける／`.md` を外す |
| `同じ表示名の記事があります` | どちらかの名前を変える（同一コレクション内のみ検査） |
| 陳腐化しやすい表現（「実装予定」「最新」）が古い更新日のまま | 記述を現在時点に直すか `updated` を更新 |
| `checked が未来の日付です` | 打ち間違い。今日以前に直す |
| `checked が updated より古いです` | 本文を書き換えたなら確認日も同日以降にする |

`--all` を付けると情報レベルの指摘も出ます。

**新しい静的ページを足したら `STATIC_PAGES`（`scripts/check-content.mjs:46`）に追加**すること。
`URL_BASE` はコレクション → URL の対応表で、wiki を足すときはここにも書きます。

---

## 3. `pnpm check`（`astro check`） — 型

Astro / TypeScript の型エラー。`src/**/*.astro` の frontmatter も対象。

---

## 4. `pnpm test:ui`（`scripts/check-ui.mjs`） — ビルド後の HTML を静的に読む

`dist/` が必要（`pnpm build` の後に実行）。**4 種類**の検査があります。

### 4-1. アイコン（SVG スプライト）の参照切れ

> `xxx.html: アイコンの参照先がありません → ai:lucide:foo`

astro-icon は `<use href="#ai:x">` と `<symbol id="ai:x">` の組で出力します。
参照先の `<symbol>` が**同じページに無い**と、その場所のアイコンが**消えます**。

`transition:persist` を付けたヘッダーが、遷移先のページに無いアイコンを参照すると起きます。
→ 永続要素（ヘッダー・下部ナビ）に新しいアイコンを足すときは、**全ページに symbol が出るか**確認。

### 4-2. wiki をまたぐリンクのフルロード指定漏れ

> `xxx.html: wiki をまたぐリンクに data-astro-reload がありません → /alpha/…`

NTE は View Transitions（`ClientRouter`）、α は独立レイアウトなので、
部分入れ替えされると画面が壊れます。**NTE → α のリンクには `data-astro-reload` が必須**。

本リポジトリのイディオム（`BaseLayout` のヘッダー／フッター、`MobileDrawer` の 3 箇所に既出）:

```astro
{...(target.id === w.id ? {} : { 'data-astro-reload': true })}
```

> 逆向き（α → NTE）は**不要**。α は `ClientRouter` を積んでいないので常にフルロードになります。
> 検査も非αページ→`/alpha/` の向きしか見ていません。

### 4-3. wiki のページに別 wiki のナビが混ざっていないか

> `xxx.html: αのページに NTE のヘッダー／下部ナビが含まれています`
> `xxx.html: α のナビが α の外を指しています → /foo/`

- α のページに `class="app-header"` / `class="bottom-nav"` があると NG
- 非 α のページに `class="a-shell"` / `class="a-tabs"` があると NG
- `<nav class="a-tabs">` / `<nav class="a-side">` の中の `<a href>` は `/alpha/` 始まりのみ許可

**許可されている例外**（`scripts/check-ui.mjs:93-96` 付近）:
`.a-side` ブロック内の `href="/"`（NTE のホーム）と `href="/wikis/"`（wiki ハブ）だけ。
α から別の NTE 側ページへ導線を出したくなったら、ここに 1 件足します。
**記事ページへ直接飛ばす導線は足さないこと**（利用者が「別 wiki に来た」と気づけないため）。
**`.a-foot`（フッター）は検査対象外**なので、フッターへの追加は無検査で通ります。

### 4-4. wiki ごとのスタイルの混線（インライン `<style>` のみ検査）

> `xxx.html: α のページに NTE のスタイル（.app-header）が混ざっています`

α のページに `.app-header` / `.bottom-nav` / `.drawer-panel` の定義が来たら NG。
非 α のページに `.a-shell` / `.a-tabs{` が来たら NG。

**`src/styles/ios.css` を `AlphaLayout` で読ませてはいけません。**
`ios.css` は `.app-header` などを含むので、この検査に必ず引っかかります。
α 用の iOS 調整は `src/styles/alpha.css` の末尾（`html[data-ios]` セクション）に書きます。

---

## 5. `pnpm test:links`（`scripts/check-links.mjs`） — 内部リンク切れ

`dist/` 内の `href="/..."` が実在するかを検査。
新しいページを足したら `dist/<name>/index.html` が出力されているか確認します。

---

## 6. `pnpm test:browser`（`scripts/audit-browser.mjs`） — 実機相当のブラウザ検査

**`pnpm verify` には含まれない**（Chromium を起動するので重い）。ビルド後に手で回す。

```bash
pnpm build && pnpm test:browser
```

40ページ × 2端末（iPhone 14 Pro / デスクトップ 1280×900）で次を見ます。
静的な検査（`test:ui` / `test:links`）では絶対に出ない種類の問題を捕まえる担当です。

| 見るもの | 落ちる条件 |
| --- | --- |
| JS エラー | `pageerror` か `console.error` が1件でも出た |
| **横あふれ** | `documentElement.scrollWidth > clientWidth`（ページ全体が横スクロールする） |
| HTTP 応答 | 400 以上 |
| 極端な入力 | ツールの数値欄に `0` / `-1` / `999999999` を入れて `NaN`・`Infinity`・`undefined%` が出た |
| 保存と復元 | ガチャ天井トラッカーに値を入れ、再読み込みで戻らない |

配信サーバは**スクリプトが自分で立てて閉じる**（`node:http` の最小実装・外部依存なし）。
存在しないパスは **404 を返す**。SPA のように `index.html` を返すと、
リンク切れが 200 に見えて検査の意味が無くなるためです。

| 指摘 | 直し方 |
| --- | --- |
| `横あふれ N>M` | はみ出している要素を探す。**`left`/`right` を持つ要素が `position: relative` のまま**でないか（`.tl-bar` で実際に起きた） |
| `入力 999999999 で表示崩れ` | 0除算・上限の取り扱い。`Number.isFinite` で弾く |
| `再読込で復元されない` | `store.ts` のキーと、`<details>` の中にある入力を見落としていないか |

> ⚠ サーバを止めるのに **`pkill` を使わない**（自分のシェルを kill して exit 144 になった実績あり）。

はみ出している要素を特定するには:

```js
for (const el of document.querySelectorAll('*')) {
  const r = el.getBoundingClientRect();
  if (r.right > innerWidth + 1) console.log(el.tagName, el.className, r.left, r.right);
}
```

---

## 7. 落ちたときに真っ先に疑うこと

| 症状 | まず見るところ |
| --- | --- |
| α のタブ／ホームから NTE に飛ぶ | `wikis.ts` の ALPHA ナビに NTE のページが混ざっていないか（`pnpm test`） |
| wiki をまたぐとアイコンが消える | 跨ぐリンクに `data-astro-reload` があるか（`pnpm test:ui`） |
| 本文の `**強調**` が生のまま出る | `remark-cjk-friendly` が `astro.config.mjs` から外れていないか |
| α に NTE の見た目が混ざる | `AlphaLayout` が `alpha.css` 以外を読んでいないか |
| **直したのに本番が変わらない** | **`main` にマージされているか**（作業ブランチは本番に出ない） |
| 設定が「データ初期化」で消える | `store.ts` の `KEEP_ON_CLEAR`（現在は `PREFS` から自動導出） |
| 設定パネルのアイコンが空白 | `SettingsPanel.tsx` の `ICON_PATHS` に足し忘れ |
| スマホで横にスクロールしてしまう | `pnpm test:browser` を回す。`left`/`right` を持つ要素の `position` を疑う |
