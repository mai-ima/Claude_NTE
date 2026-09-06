# FINDINGS — コードを読んで確かめたこと（調べ直さないための知見集）

> 「たぶんこうだろう」で作業して外した記録も含めて残します。
> **誤 → 正**の形で書くのは、同じ勘違いを次回もやるからです。
>
> 新しく分かったことは、その場でここへ追記してください。
>
> 最終更新: 2026-09-06

---

## 1. 設定（pref）まわり

### 「静かに壊れる」箇所（v0.10.0 で 2 → 1 に減らした）

| 忘れた場所 | 何が起きるか | 気づき方 |
| --- | --- | --- |
| `SettingsPanel.tsx` の `ICON_PATHS` | `ICON_PATHS[name] ?? ''` で握りつぶされ、**アイコンが空白になるだけ**。エラーは出ない | 目視するしかない |
| ~~`store.ts` の `KEEP_ON_CLEAR`~~ | ~~「データを初期化」でその設定だけ消える~~ | **解消済**（`PREFS` から導出） |

`pnpm verify` は `ICON_PATHS` の欠落を**検出できません**。手で確認する必要があります。

### 起動スクリプトの二重管理は解消した（v0.10.0）

以前は `BaseLayout.astro` に `var prefs = [['nte.motion','motion','reduce'], …]` が
べた書きされていて、`prefs.ts` と手で並びを揃える約束でした。
いまは `prefBootData()`（`prefs.ts`）を `define:vars` で流し込んでいます。

- **Astro の `define:vars` は `<script>` の中身を IIFE で包む**ので、`data-astro-rerun` で
  再実行されても `const` の再宣言エラーにはなりません（実機で確認済み）。
- 併せて、**効いていない設定では `removeAttribute` する**ようにしました。
  以前は「`'1'` なら付ける」だけで消しておらず、`data-theme` / `data-ios` とは非対称でした。

### 効果はすべて CSS 側にある

`src/styles/prefs.css` の `html[data-<attr>='<on>']` が実体です。JS は属性を付けるだけ。
`.edit-link { display: none }` ＋ `html[data-edit='on'] .edit-link { display: flex }` のように、
**「既定 OFF」を CSS 側で表現する**パターンがあります（`prefs.css:58-64`）。

---

## 2. iPhone / iOS まわり

### 誤 → 正

| 思い込み | 実際 |
| --- | --- |
| 「`.bottom-nav` に safe-area 対応が無い」 | **`components.css:883-896` で対応済み**。`height: calc(58px + env(safe-area-inset-bottom))` ＋ `padding-bottom`。`ios.css` に無いのは重複を避けているから |
| 「α 側には iOS 最適化が一切効いていない」 | **`alpha.css:788-810` に独自の `html[data-ios]` セクションがある**（タップハイライト除去・入力 16px・overscroll・押下スケール）。ただし `ios.css` より項目は少ない |

### 未対応だったもの（v0.10.0 で対応済み）

- ~~`-webkit-touch-callout` はリポジトリ全体で 0 件~~ → NTE・α 双方に入れました。
  ナビ・ボタン・カードは `none`、**本文は `default`**（画像の保存やコピーを奪わないため）。
  本文も抑制したい人は設定（`nte.callout`）で選べます。
  **`-webkit-touch-callout` は Safari 専用で Chromium は未実装**なので、
  Playwright の `getComputedStyle` では確かめられません（`undefined` が返る）。
  ビルド後の CSS（`dist/_astro/*.css`）に出ているかで確認してください。
- **スクロール位置の復元は自前で持っていないが、それで正しい**（v0.10.0 で実測して確認）。
  - NTE 側は `ClientRouter` が管理（`history.scrollRestoration` は `manual` になる）
  - α 側はブラウザの標準復元（`auto`）。どちらも「一覧 → 記事 → 戻る」で元の位置に戻る
  - **測り方に注意**: Playwright の `click()` は対象要素まで自動スクロールするので、
    「離れる直前の位置」が変わって復元が壊れているように見える。`goto()` で遷移して測ること。
    これで一度「α の復元が壊れている」と誤診し、不要な保険コードを入れかけた。
- `visualViewport` 未使用（キーボード表示時の追随なし）。検索ダイアログは
  `max-height: min(72svh, 640px)`（`ios.css:85-88`）で実用上は収まっています。
- `@media (display-mode: standalone)` のブロックだけ **`html[data-ios]` スコープの外**にあり、
  Android の PWA にも当たります（意図的かは不明）。

### `ios.css` を α で読ませてはいけない

`ios.css` は `.app-header` / `.bottom-nav` / `.drawer-panel` を含みます。
`scripts/check-ui.mjs` の 4-4（スタイル混線）が**必ず**引っかかります。
α 用の調整は `alpha.css` の中で完結させること。

### `data-ios` の付け方が 2 箇所で微妙に違う

| 場所 | 挙動 |
| --- | --- |
| `BaseLayout.astro:163-169` | 真なら `setAttribute`、偽なら **`removeAttribute`**。`data-astro-rerun` 付きで毎遷移に再評価 |
| `AlphaLayout.astro:79-84` | **`setAttribute` のみ**（remove なし）。α は `ClientRouter` を積まないので再評価が不要 |

UA 判定は共通:
`/iPad|iPhone|iPod/.test(ua) || (ua.indexOf('Macintosh') !== -1 && navigator.maxTouchPoints > 1)`
（iPadOS は Mac を名乗るので `maxTouchPoints` で見分ける）

---

## 2.5 Preact（設定パネル）で踏んだ罠

### 描画関数の中でコンポーネントを定義しない

設定パネルの折りたたみセクションを、`SettingsPanel()` の**中**で
`const Section = (...) => <details …>` として定義したところ、
**ページが固まった**（ブラウザが応答しなくなり、Playwright ごとタイムアウト）。

描画のたびに「別物のコンポーネント」として作り直されるため、`<details>` が
毎回マウントし直され、`toggle` が発火 → 状態更新 → 再描画 → … の無限ループになる。

→ **コンポーネントはモジュールのトップレベルに置き、必要な値は props で渡す。**
併せて `onToggle` 側でも「今の open と同じなら何もしない」ガードを入れてある。

症状は「ページが真っ白のまま固まる」「DOM ノード数が増え続ける」。
`document.querySelectorAll('*').length` を 2 秒あけて 2 回数えると判別できる。

## 3. レイアウト・CSS

### `.grid-cards` は CSS Grid だが `order` は効く

```css
.grid { display: grid; gap: 16px; }
.grid-cards { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
```

Grid アイテムにも `order` は適用されます（自動配置の順序が変わる）。
つまり**並び替えに JS は要りません**。SSG 時に各カードへ順位を CSS 変数で埋めておき、
`order: var(--ord-x)` を当てれば切り替えられます。

### `.drawer-toggle` がパソコンでも出ていた（v0.10.1 で修正）

`components.css` はこう書いてあった:

```css
.drawer-toggle { display: inline-grid; }
@media (min-width: 960px) { .drawer-toggle { display: none; } }   /* 効いていなかった */
.btn { display: inline-flex; }                                     /* ← こちらが後にある */
```

`.drawer-toggle` と `.btn` は**同じ詳細度 (0,1,0)** なので、後に書かれた `.btn` が勝つ。
その結果、パソコンでもハンバーガーが出たまま（サイドバーと二重）になっていた。
`@media` の中を `.app-header .drawer-toggle`（0,2,0）にして解消。

**同じ形の罠**は他にもある。「`@media` に書いたのに効かない」ときは、
同じ詳細度のルールがそのファイルの後方にないか疑うこと。

### CSS の読み込み順

`BaseLayout.astro:2-14` の import 順がそのまま優先順位です:

```
themes → base → components → ui-*（8種） → prefs → ios
```

同じ詳細度なら **`prefs.css` は `ui-*.css` に勝ち、`ios.css` は prefs にも勝つ**。

---

## 4. マルチwiki

### `nav.ts` の `PRIMARY_NAV` / `BOTTOM_NAV` は死んだ定義

`src/lib/nav.ts:159` と `:171` に export されていますが、**どこからも import されていません**。
ナビの実体は `wikis.ts` の `WikiMeta.primaryNav` / `bottomNav` です。

紛らわしいのは `BaseLayout.astro:54-55` が

```ts
const PRIMARY_NAV = w.primaryNav;
const BOTTOM_NAV = w.bottomNav;
```

とローカル変数に**同じ名前で**置き直していること。grep すると `nav.ts` の定義が使われているように
見えますが、実際は使われていません。**触るのは `wikis.ts` の方**。

### α → NTE のリンクに `data-astro-reload` は要らない

α は `ClientRouter` を積んでいないので、そもそも全リンクがフルロードです。
`check-ui.mjs` も**非αページ → `/alpha/`** の向きしか検査していません。

### `wikiOfPath` は「`/alpha/` 以外は全部 nte」

```ts
for (const w of WIKI_LIST) {
  if (w.base && (p.includes(`${w.base}/`) || p.endsWith(w.base))) return w;
}
return WIKIS[DEFAULT_WIKI];
```

`base` が空文字の NTE は判定ループに入らず、**フォールバックとして返る**構造。
だから `/wikis/` のような新しいパスも自動的に `nte` 扱いになり、
NTE の `primaryNav` に入れても `test/wikis.test.ts` の条件 12 を満たします。

### 過去に実際に起きた事故

1. **α のタブから NTE に飛ばされる** — `wikis.ts` の ALPHA ナビに `/settings/` が混ざっていた。
   → 除去し、`test/wikis.test.ts` に「各 wiki のナビが自 wiki 内に閉じる」検査を追加。
2. **wiki をまたぐとアイコンが消える** — View Transitions が α のページを部分入れ替えして、
   `transition:persist` されたヘッダーが遷移先に無い `<symbol>` を参照した。
   → 跨ぐリンクに `data-astro-reload` を付け、`check-ui.mjs` で検査。
3. **「直したのに直っていない」** — 実は**本番 `main` に未反映**だった。
   本番 `/alpha/` は 404 で、作業ブランチの 10 コミットが `main` に入っていなかった。
   → 症状を見る前に、まず `git log --oneline origin/main..HEAD` を確認する。

---

## 4.5 ビルドキャッシュに騙されない

**`rehype-term-links.mjs`（自動リンク）を変更しても、`pnpm build` だけでは反映されないことがある。**

Astro はコンテンツのレンダリング結果を `.astro/` にキャッシュするため、
Markdown の中身が変わっていないと再レンダリングされない。プラグイン側だけ直しても
古い出力が dist に残る。

実際に踏んだ例: 自動リンクの重複除去を実装したのに、測定したら
「97ページ → 92ページ」としか減らず、実装が効いていないように見えた。
キャッシュを消して再ビルドすると **0ページ**（想定どおり）だった。

```bash
rm -rf .astro node_modules/.astro dist && pnpm build
```

**記事の中身ではなく「記事の処理のしかた」を変えたときは、必ずキャッシュを消して確かめること。**

## 5. Markdown / ビルド

- 日本語本文で `**強調**` の閉じ記号の直前が全角括弧・句読点だと、CommonMark の
  right-flanking 判定で**強調にならない**。`remark-cjk-friendly` を入れて解消済み。
  外すと **77 ページ規模で `**` が生のまま出ます**。
- Astro 6 で `markdown.rehypePlugins` は非推奨。`@astrojs/markdown-remark` の `unified()` へ移行済み。
  そのため `@astrojs/markdown-remark` を **devDependency に明示**する必要があります
  （pnpm の厳格な依存解決で、無いとビルドが落ちる）。
- `pnpm-workspace.yaml` が自動生成されることがあります（`allowBuilds: esbuild: set this to true or false`
  という無効値）。**コミット前に削除**すること。

---

## 6. 検証環境

- Playwright のブラウザは `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`。
  `playwright install` は**実行不要**（`PLAYWRIGHT_BROWSERS_PATH` が設定済み）。
- 実機相当の確認は `pnpm preview` に対して iPhone 14 Pro のデバイスプロファイルで行います。
- 記事の読みは攻略サイト間で揺れます（白蔵＝ばいざん/はくぞう、九原＝じょえん/くはら、
  海月＝みつき/くらげ、翳＝えい/かげ）。本サイトは **GameWith / Game8 系**を採用。
  神ゲー攻略の読みは自動生成らしく不正確なことがあるため、**安易に書き換えない**。

---

## `left`/`right` を書いたのに効かない — `position: relative` の罠

イベントタイムライン（`/tools/calendar/`）のガントバーが、
**デスクトップで 1522px（画面 1280px）まではみ出してページ全体を横スクロールさせていた**。

```css
.tl-bar {
  position: relative;   /* ← これ */
  min-width: 44px;
}
```

```jsx
<a class="tl-bar" style={{ left: '50%', right: '20%' }} />
```

- **誤**: `left`/`right` を % で書けばトラック上の位置と長さになる
- **正**: `position: relative` では `left` は**元の位置からのずれ**でしかなく、
  **`right` は無視される**（LTR では `left` が勝つ）。幅は縮まないまま右へ押し出される

**直し方**: 行のラッパー（`position: relative; height: 34px`）を1枚挟み、
バーを `position: absolute` にする。これで `left`/`right` の両方が効いて幅が決まる。

さらに `min-width: 44px`（指で押せる大きさ）があるため、開始が右端に近いと
「左端＋44px」がトラックを超える。インラインスタイル側で頭打ちにする:

```js
const leftSafe = `min(${left}, calc(100% - 44px))`;
```

**この種の不具合は静的な検査では出ない。** `pnpm test:browser`
（`documentElement.scrollWidth > clientWidth` を見る）で初めて見つかった。
