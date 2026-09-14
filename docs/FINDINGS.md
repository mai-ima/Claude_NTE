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

---

## `hidden` 属性が効かない — またしても CSS 詳細度

サイドバーの絞り込みで `a.hidden = true` を付けたのに、**リンクが消えなかった**。

- **誤**: `hidden` 属性を付ければブラウザが隠してくれる
- **正**: ブラウザ既定の `[hidden] { display: none }` は**詳細度が最低**で、
  `.nav-link { display: grid }` のようなクラス指定にあっさり負ける

```css
/* base.css と alpha.css の両方に置いた */
[hidden] {
  display: none !important;
}
```

α側は `alpha.css` しか読まないので、**同じ規則を2か所に持つ**必要がある
（NTE と α でスタイルを共有しないルールのため）。

`.drawer-toggle` のときと同じ種類の罠。**このリポジトリで3度目**なので、
「表示が消えない／出ない」ときは真っ先に詳細度を疑うこと。

---

## ページが重い原因はサイドバーだった（一覧の件数ではない）

「用語集の一覧が 192KB で重い」と見立てていたが、実測すると**どの一覧ページも 138KB 以上**あった。
共通部分が重いということで、内訳を測ったら:

```
全体 130466 バイト
  aside（サイドバー） 83179   ← 64%
  svg 319個            49531
```

サイドバーが**全259記事へのリンクを毎ページ出している**。その中身:

| 無駄 | 量 |
| --- | --- |
| 各行に**セクションと同じアイコン**の `<svg>`（259行すべて同じ絵で情報ゼロ） | 33KB |
| 各行のインライン `style="flex:1;min-width:0;overflow:hidden;…"`（85バイト × 259） | 22KB |

アイコンを消し（属性ドットは情報を持つので残す）、インライン style をクラスにしたところ
**130KB → 83KB（36%減）**。全306ページに効く。

**教訓**: 「重いページ」を見つけたら、そのページ固有の要素ではなく
**全ページ共通の部分**の実測から始める。内訳は正規表現でタグごとに測れば数分で出る。

---

## `class:list` は Astro の記法。Preact のアイランドでは使えない

```
[vite:preact-jsx] Namespace tags are not supported by default.
> <div class:list={['tool-result', { 'is-done': done }]}>
```

`.astro` ファイルでは使えるが、`.tsx`（Preact アイランド）ではビルドが落ちる。
テンプレートリテラルで組む:

```tsx
<div class={`tool-result${done ? ' is-done' : ''}`}>
```

---

## localStorage への書き込みは「遅らせる」だけでは足りない

メモは1文字打つたびに全件を JSON 化して localStorage へ書き、
他アイランドへイベントを飛ばしていた。長文だと打鍵のたびに重い。

`useStore(name, initial, { debounceMs: 500 })` を足して**書き込みだけ**遅らせた
（画面の表示は即座に変わる）。ただし遅延には必ず落とし穴がある:

- **遅延中にページを離れると保存されない。** アンマウントと `pagehide` で必ず書き出す
- `beforeunload` ではなく **`pagehide`** を使う。iOS Safari はタブを閉じる/戻るときに
  `beforeunload` を飛ばすことがある
- `visibilitychange` も拾う（アプリを切り替えたまま戻らない場合に備える）

検証は「80ms 編集してすぐ reload」で行った（debounce の 500ms より短い間隔）。
これが通れば `pagehide` の書き出しが効いている。

---

## Playwright で「値が残っているか」を `page.content()` で見てはいけない

```js
// 誤: textarea の value は HTML には出ない（Preact がプロパティで設定する）
(await p.content()).includes('テスト用のメモ');

// 正
await p.locator('textarea').first().inputValue();
```

実装は正しいのにテストだけが落ちて、しばらく実装を疑ってしまった。


---

## UIモードで配色を変えたいのに `--accent` が効かない（2026-09-08）

**誤**: 既存のUIモードにならって `html[data-ui='nte'] { --accent: #4fe5fb }` と書けば色が変わる。

**正**: **変わらない。** 詳細度が足りていない。

| セレクタ | 詳細度 |
| --- | --- |
| `html[data-ui='nte']` | 要素1 + 属性1 = **(0,1,1)** |
| `themes.css` の `:root[data-theme='minimal']` | 疑似クラス1 + 属性1 = **(0,2,0)** |

`(0,2,0)` が勝つので、`themes.css` の `--accent: #3b6ef0` がそのまま残る。

既存のモード（aurora / terminal など）が破綻していなかったのは、
**どれも `--accent` を上書きせず `color-mix()` で派生させていたから**。
`--radius` は `:root`（0,1,0）にしか無いので `(0,1,1)` で勝てていた。

**直し方**: 変数を定義するブロックだけ **`html:root[data-ui='nte']`（0,2,1）** にする。
明暗テーマとの組み合わせを分けたいなら `html:root[data-ui='nte'][data-theme='minimal']`（0,3,1）。

**気づき方**: 見た目が変わらないときは、Playwright で
`getComputedStyle(document.body).backgroundColor` を見ると一発で分かる。
`data-ui` 属性は付いているのに色だけ元のまま、なら詳細度負けを疑う。

---

## 圧縮された1行 CSS に `grep -o` は効かない（2026-09-08 に再確認）

公式サイトの配信 CSS は1行が数万文字ある。この形に対して

```bash
grep -oE '#[0-9a-fA-F]{6}' x.css   # → 0件（エラーも出ない）
grep -c color x.css                # → 0（"color" は確実に入っているのに）
```

**無言で失敗する**。CSS の解析は必ず `node` で読むこと
（手順は `docs/UI-RESEARCH.md` の「★ CSS の静的解析でつまずいた点」）。

---

## 公式サイトの「本体 CSS」は HTML から辿れないことがある（2026-09-08）

鳴潮の `index-*.css`（75KB）は**中身が animate.css だけ**で、色が1つも無かった。
本物は **JS バンドルの中に書かれたチャンク名**から辿る:

```bash
node -e "const s=require('fs').readFileSync('app.js','utf8');
  console.log([...new Set([...s.matchAll(/assets\/[A-Za-z0-9_.-]+\.css/g)].map(m=>m[0]))].join('\n'))"
```

これで16本出てきて、そこに配色が全部あった。
「CSS にリセットしか無い」で諦めない。


---

## CSS が JS の中にあって取れないサイトは「画素から色を採る」（2026-09-08）

Nuxt / Next.js の公式サイトは、配色が JS バンドルの中にあって静的解析では取れない。
`getComputedStyle` の集計も、`background-image` で塗られたボタンには効かない。

**描画さえできれば、スクリーンショットの画素を読むのが一番確実**:

```js
// スクリーンショットを data:URI で <img> に読ませ、canvas に描いて getImageData
await page.setContent(`<img id="i" src="data:image/png;base64,${png}">`);
const d = ctx.getImageData(x, y, 1, 1).data;   // → #rrggbb
```

これで実際に採れた例（どれも推測とずれていた）:

| 対象 | 推測していた値 | 実測 |
| --- | --- | --- |
| 原神の「ダウンロード」ボタン | 金 `#c8a35a` | **`#ffcf0d`**（鮮やかな黄色） |
| スターレイルの現在地の青 | `#2a7fff` | **`#307af7`** |
| スターレイルのCTAの金 | `#cbb27a` | **`#c9af85`** |
| スターレイルのヘッダー帯 | `#14141a` | **`#121212`** |

「だいたい合っている」で済ませず、**1色ずつ画素で確かめる**。


---

## `clip-path` のグリッチは「文字の複製」が要る（2026-09-08）

RGB がずれてスライスする、あのグリッチは `text-shadow` では作れない。
`clip-path: inset()` で**横帯を切って左右にずらす**のが本体で、
そのためには**同じ文字がもう2枚**要る（切ったら元の文字が欠ける）。

CSS だけでやるなら `content: attr(...)` で複製する:

```css
h1[data-glitch]::before { content: attr(data-glitch); position: absolute; inset: 0; }
```

**属性を手で書くと足し忘れる。** このリポジトリは `.page-head h1` を持つページが
14種類あった。3つだけ手で書いて残りを忘れる、が実際に起きかけたので、
**`BaseLayout` の末尾の inline スクリプトで機械的に写す**方式に一本化した
（`data-astro-rerun` で View Transitions の切替後も走る）。

ついでに2点:

- `mix-blend-mode: screen` は**明るい地では白く飛んで消える**。
  明暗を切り替えるサイトでは `multiply` と出し分ける。
- `animation-fill-mode: both` で回数を有限にすると、**最後のフレームの状態が残る**。
  終わったら消したいなら `to { opacity: 0 }` を自分で書く。


---

## CSS のコメントの中に閉じ記号を書くと、次のルールが丸ごと消える（2026-09-08）

実際にやらかした。説明コメントの中に、公式CSSの引用としてこう書いた:

```css
/* 実測（.Pagination_button）:
     :hover { background-color:#fffa00 }  /* 押している間は #eeea00 */
   → 「灰の太い輪の内側に白い輪」を重ねた丸ボタン。 */
.ef-round { position: relative; … }
```

**CSS のコメントは入れ子にできない。** 内側の閉じ記号でコメントが終わり、
続く説明文が CSS として解釈され、パーサが回復するまでの間に
**`.ef-round` のルールが丸ごと捨てられた**。

症状は「`position: relative` が効かず、`inset: 0` の擬似要素が
**ビューポート大の巨大な円**になる」。ビルドもリンタも通るので気づきにくい。

→ `scripts/check-ui.mjs` に**コメントの入れ子を見つける検査**を足した。
   `src/styles/*.css` を走査し、コメントの内側に開き記号があれば `pnpm test:ui` で落ちる。

**引用を書くときは、閉じ記号を含む断片をコメントに入れないこと。**

---

## 縦書き（writing-mode）は font 次第で字が重なる（2026-09-08）

`writing-mode: vertical-rl` は、和文の**縦組みメトリクスを持たないフォント**に当たると
**グリフが重なって読めなくなる**。`text-orientation: upright` でも `mixed` でも起きた。

- `getClientRects()` は「1列 14×46px」と**正常な値を返す**ので、数値では気づけない
- **高解像度で要素を撮って目で見る**のが唯一の確認手段だった
  （`deviceScaleFactor: 4` にして `element.screenshot()`）

見た目が環境依存で壊れるものは、意匠として正しくても**採用しない**。
今回はレール下端の縦書きCTAを、横組みの短いラベルに替えた。

---

## 狭い画面の横スクロールの犯人は `grid-template-columns: 1fr` だった（2026-09-08）

**症状**: iPhone SE 幅（320px）で、NTE 側の**全ページ**が横に少し動く
（`document.scrollWidth` = 348 > `clientWidth` = 320）。393px 幅では出ない。

**誤 → 正**

| 誤（最初に疑ったもの） | 正 |
| --- | --- |
| ヘッダーのブランド名が縮まないせい | ブランドは `min-width:0` を入れれば縮む。**でも直らなかった** |
| 閉じている wiki 切替メニューがはみ出しているせい | あれは `position:absolute`。親の幅には影響しない |
| — | **`.app { grid-template-columns: 1fr }`**。`1fr` の最小は `auto`＝中身の min-content。<br>`minmax(0, 1fr)` にしたら 320 に収まった |

**覚えておくこと**

- グリッドの列を `1fr` と書くと、**最小幅が中身に引っ張られる**。
  中身を縮めたい列は必ず **`minmax(0, 1fr)`**。flex の子なら `min-width: 0`。
- `white-space: nowrap` を足すと min-content が「全文の幅」になる。
  `overflow:hidden` + `text-overflow:ellipsis` だけでは縮まず、**その要素自身にも
  `min-width: 0`** が要る。
- 調べ方: `document.querySelectorAll('*')` を回して `getBoundingClientRect().right`
  が `clientWidth` を超えるものを拾う。ただし **`position:absolute/fixed` は除外**
  （犯人でないのに大量に引っかかる）。最後は**親をたどって `scrollWidth` を見る**。
- 再発防止として `scripts/audit-browser.mjs` に **iPhone SE（320px）の巡回**を足した。

**ついでの落とし穴**: 検査用の簡易サーバーで CSS の `content-type` を `text/html` で
返していて、「CSS が当たっていない画面」を測って悩んだ。**拡張子で出し分ける**こと。

## 圧縮で消えた添付画像は、会話ログから取り出せる（2026-09-12）

**症状**: コンテキスト圧縮のあと、利用者が添付した参考画像を見直したくても、
**要約には「画像があった」という文章しか残っていない**。画像そのものは context から消える。
文章の記憶だけで作業を続けると、**読み違いに気づけないまま実装が進む**（実際に2件やった。
→ `.claude/state/DECISIONS.md` 2026-09-12）。

**わかったこと**: 会話ログ（`~/.claude/projects/<プロジェクト>/<セッションID>.jsonl`）には
**画像が base64 のまま残っている**。1行1メッセージの JSONL なので、取り出して
ファイルに書けば、Read ツールで画像として読み直せる。

**取り出し方**

```js
// 1行ずつ読む（ファイルは数十MBになるので、丸ごと JSON.parse しない）
const rl = readline.createInterface({ input: fs.createReadStream(src), crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.includes('base64')) continue;          // 先に弾くと速い
  const j = JSON.parse(line);
  for (const c of j.message?.content ?? []) {
    if (c?.type !== 'image') continue;
    fs.writeFileSync(out, Buffer.from(c.source.data, 'base64'));
  }
}
```

**見分け方（重要）**

| 置き場所 | 何の画像か |
| --- | --- |
| `message.content[N]` … **直下** | **利用者が添付した画像** |
| `message.content[N].content[0]` … tool_result の中 | **自分が撮ったスクリーンショット** |

利用者の添付だけが欲しいなら、**直下にある `type: 'image'` だけ**を拾う。

**同じ画像が2回添付されることがある**。`data.length` と先頭64文字で重複を弾くと、
実際の枚数が分かる（今回は「3枚を2回」で計9枚に見えたが、実体は**6枚**だった）。

**教訓**: 参考画像をもとに作るときは、**圧縮をまたいだら必ず画像を取り出して見直す**。
「画像から読み取った作法」を CSS の冒頭に書き残す運用は続けるが、
**その文章自体が誤っている可能性**があるので、文章を根拠に文章を足さない。

## グリッドの子に `max-width` だけを付けると、幅が中身なりに広がる（2026-09-12）

**症状**: ページが横に広がる。`scrollWidth` が画面幅より大きい（実測 467 > 393、760 > 393）。
見た目には出ないことがある（`body` が `overflow-x: hidden` のため）が、
**横あふれの検査には引っかかる**。

**原因**: グリッドの子は既定で `justify-self: stretch`（＝列いっぱい）。
ところが **`max-width` を付けると stretch が効かなくなり、`fit-content` に変わる**。
`fit-content` は「中身の min-content と available の大きい方」なので、
折り返せない中身（横並びのタブなど）があると、その min-content が幅になる。

```css
/* 悪い例: 中身の min-content がそのまま幅になる */
.pane { max-width: 820px; margin-inline: auto; }

/* 良い例: 幅は親いっぱい、その中で上限だけ効かせる */
.pane { width: 100%; max-width: 820px; margin-inline: auto; }
```

**同じ日に2回踏んだ**（`/admin/` の `.admin-page` と、base UI の `.content`）。
**グリッドやフレックスの子に `max-width` を書いたら、必ず `width: 100%` も書く**。

## 閉じた `<details>` の中身は「見えないのに幅を持つ」（2026-09-12）

Chromium の `<details>` は、閉じているとき中身を `display: none` ではなく
**`content-visibility: hidden`** で隠す。そのため

- `getComputedStyle(el).display` は `block` のまま
- `getBoundingClientRect()` は**サイズを返す**
- 画面には出ないが、**`scrollWidth` には効く**

ヘッダーの wiki 切替（幅 300px の絶対配置）がこれで、閉じていてもページが
横に広がって測られていた。→ **`:not([open])` のとき明示的に `display: none`** にする。

```css
.wiki-switch:not([open]) .wiki-switch-menu { display: none; }
```

## 絶対配置のメニューは「開いたとき画面内に収まるか」を確かめる（2026-09-12）

ヘッダー中ほどにある切替メニューが `left: 0; min-width: 300px` で、
**開くと右側が画面の外に出ていた**（393px の画面で 205 → 505px）。閉じている
あいだは気づけない。

直し方は**基準を変える**のが早い。`position: relative` を親から外すと、
絶対配置の基準が**ヘッダー**（sticky なので containing block になる）に移るので、
`left: 12px; right: 12px` で幅いっぱいに出せる。

```css
@media (max-width: 700px) {
  .wiki-switch { position: static; }          /* 基準をヘッダーへ移す */
  .wiki-switch-menu { left: 12px; right: 12px; min-width: 0; }
}
```

## 「絵がある」を1つのクラスでまとめると、絵が無いのに枠が変わる（2026-09-13）

**症状**: 管理ページで「置いた画像だけ」（既定）を選んでいるのに、キャラ記事の絵の枠だけが
**縦長（3:4）**になり、縁の線も付く。絵は出ていない。

**原因**: `Avatar.astro` が `has-img` を **「ローカル画像 か 公式URL のどちらかがあれば」**
付けていた。CSS 側は `--av-img` を `var()` の入れ子で切り替えているので**絵は出ない**が、
`aspect-ratio` と `box-shadow` は `.has-img` だけを見ていたため当たってしまう。

記事に `officialImage` を1件も書いていない間は表に出なかった。**17件書いた瞬間に出た。**

**直し方**: 出どころごとにクラスを分ける。

```html
<div class:list={['avatar', { 'has-img-local': !!local, 'has-img-official': !!officialImage }]}>
```

```css
html[data-ui='base'] .avatar.has-img-local,
html[data-ui='base'][data-images='official'] .avatar.has-img-official { … }
```

**教訓**: CSS は `var(--a, var(--b, none))` で「出す／出さない」を切り替えられるが、
**`aspect-ratio` や枠線のような「絵の有無に連動させたい他の指定」は連動しない**。
表示条件が2つ（出どころ × 設定）あるなら、**クラスも2つに分ける**。

## 繰り返し構造の対応づけを「前後 N 文字」で拾わない（2026-09-13）

**症状**: 公式サイトのキャラ紹介から「画像ファイル名 → キャラ名」の表を作ったら、
**全体が1つずれた**表ができた。それらしく見えるので気づきにくい。

**原因**: 画像の URL から前後 600 文字を切り出して日本語を拾った。スライドが連続しているため、
**窓が隣のスライドまで届いていた**。

**正しいやり方**: 構造を見る。このページは1スライドに
`role-poster-<名>` / `role-name-<名>` / `class="role-dec-<名>"` が揃っていたので、
**同じ `<名>` を持つ組**として取り出せば一意に決まる。

**教訓**: 繰り返しの中で対応づけるときは、**距離ではなく「同じ鍵を持つか」**で結ぶ。
距離で拾ったら、必ず**別の根拠**（ここでは名前ロゴ画像と紹介文の固有名詞）で裏を取る。

## 自動リンクの辞書に載せ忘れると、別の wiki へ飛ばされる（2026-09-13）

**症状**: `/endfield/guides/beginner/` の本文から、NTE の記事へリンクが張られていた。

```html
<a href="/terms/role/" class="auto-term">役割</a>
<a href="/items/upgrade-materials/" class="auto-term">育成素材</a>
```

**原因**: `src/lib/rehype-term-links.mjs` の `WIKI_GROUPS` に
**`endfield-guides` と `endfield-story` を載せ忘れていた**。
載っていないディレクトリは、当時のコードでは

```js
const dict = dictFor(DIR_TO_WIKI.get(m[1]) ?? 'nte');   // ← 既定が NTE
```

と書かれており、**既定の NTE 辞書が当たっていた**。
エンドフィールドの記事なのに NTE の用語が引っかかり、読者が別の wiki へ飛ばされる。

**直し方（2つとも要る）**

1. **既定へ落とさない**。辞書に無いディレクトリは**リンクを当てずに打ち切る**。
   ```js
   const wikiId = DIR_TO_WIKI.get(m[1]);
   if (!wikiId) return;        // 載せ忘れても「リンクが付かない」で済む
   ```
2. **載せ忘れを検査する**。`test/rehype-term-links.test.ts` が
   `src/content/` の全ディレクトリと `WIKI_GROUPS` を突き合わせる。

**教訓**: 「見つからなければ既定」は、**別の wiki のデータを混ぜる方向に倒れる**と事故になる。
分離が目的の仕組みでは、**既定を持たず、分からなければ何もしない**方が安全。

## 自動リンクを直したのにビルド結果が変わらない（Astro のキャッシュ）（2026-09-13）

**症状**: 上の修正を入れて `rm -rf dist && pnpm build` しても、
`dist/endfield/guides/beginner/index.html` に古いリンクが残ったまま。

**原因**: Astro のコンテンツキャッシュ。`.astro/` と `node_modules/.astro/` に
**変換後の記事**が残っており、`dist` を消しても再変換されない。
rehype プラグイン（`src/lib/rehype-term-links.mjs`）を書き換えたときは、
**記事の再変換が必要**なのにキャッシュが効いてしまう。

**直し方**

```bash
rm -rf .astro node_modules/.astro && pnpm build
```

**教訓**: **remark / rehype プラグインを直したときは、`dist` だけでなくキャッシュも消す。**
「直したのに変わらない」と感じたら、まずここを疑う。

## 白地に蛍光イエローの文字は読めない（2026-09-13）

**症状**: エンドフィールド wiki の明るいテーマで、パンくず・本文リンク・シートの見出しが読めない。

**原因**: 公式の実測色 `#fffa00` を**文字色**に使っていた。
白地に `#fffa00` は**コントラスト比 約1.07:1**（WCAG AA の最低 4.5:1 を大きく下回る）。
`--ef-accent-text`（明色では黒・暗色では黄色）という配慮用トークンを用意してあったのに、
使われていない箇所が6つ残っていた。

**直し方**: **黄色は「面・罫線・下線・発光」にだけ使い、文字色には使わない。**
公式サイトも同じで、黄色い文字は**黒帯の上**にしか出てこない。
リンクは「黒い文字＋**黄色い下線**」にすると、色覚に依らず分かって読める。

**確認のしかた**: 計算後スタイルで拾うと確実。

```js
for (const el of document.querySelectorAll('*')) {
  const c = getComputedStyle(el).color;
  if (/rgb\(255,\s*250,\s*0\)/.test(c) && el.textContent.trim()) { /* 地の色を確かめる */ }
}
```

## wiki の `accent` は「NTE 側の画面で文字色にもなる」（2026-09-13）

`src/lib/wikis.ts` の `WikiMeta.accent` は `--wiki-accent` として `<html>` に付き、
`components.css` で **`--accent` に代入される**（＝文字色にも使われる）。

エンドフィールドの公式色は `#fffa00` だが、**この値をそのまま `accent` に入れると
NTE 側の wiki 一覧などで白地に黄色の文字が出て読めない**。
同じ色相のまま暗くした値（`#8a7a00`・白地で約4.6:1）を入れ、
**wiki の中の配色は `endfield.css` の `--ef-accent`（`#fffa00`）が正**、と役割を分けた。

## 公式wiki（SKPORT）は**ログイン不要**で読める（2026-09-14）

**誤** — 「公式wiki は API に**ログインが要る**ので取得できない。深追いしない」
（`NOW.md` にそう書いて2セッション放置していた）

**正** — **ログインは要らない**。`/web/v1/auth/refresh` が**誰にでも**トークンを返し、
そのトークンを鍵にして署名すれば、すべての読み取り API が通る。

**なぜ間違えたか**: フロントの JS に
`var u = e.secret; u || (u = e.token);` とあり、`token` は `localStorage` から
読んでいた。そこで「＝ログインで得るもの」と決めつけた。実際には
**ログインしていない人にも配られる**匿名トークンで、ログイン後はそれが
本人のものに差し替わるだけだった。

**気づいた決め手**: ブラウザで公式wikiを開いたら**中身がちゃんと出た**こと。
通信を見ると `401 → /auth/refresh → 200` の順で、**ログインせずに200 が返っていた**。

> **教訓**: 「認証が要る」と判断する前に、**ログインしていないブラウザで開いて
> 中身が出るか**を見る。出るなら、必ず取る道がある。

## `sk-language: ja-jp` は「成功したまま空」で返る（2026-09-14）

公式wiki の API は言語を `sk-language` ヘッダで指定する。

```
sk-language: ja      → 中身が返る
sk-language: ja-jp   → code:0 / message:"OK" のまま data が空
```

**エラーにならない**ので気づきにくい。`catalog: []` を見て「権限が足りない」と
読み違えかけた。**件数が 0 のときは、まず言語コードを疑う。**

なお `en` にすると**英語名**が返る。日本語名からは作れない**記事の slug** は、
これで作っている（`scripts/lib/efgen.mjs` の `slugify()`）。

## この環境の Chromium は外部サイトへ出られない（2026-09-14）

`chromium.launch()` で外のサイトを開くと、必ず `ERR_CONNECTION_RESET` になる。
プロキシの記録を見ると「1768 B 送って 39 B 受け取ったところで切断」。
`--proxy-server` を渡しても、後量子鍵交換を切っても変わらなかった。
**curl / Node の `fetch` は同じ相手に通る**ので、遮断ではなく Chromium 固有の問題。

**回避**: **通信だけ Node に肩代わりさせる**。

```js
await ctx.route('**/*', async (route) => {
  const req = route.request();
  const headers = { ...req.headers() };
  delete headers['accept-encoding'];   // fetch が自動で解くので外す
  delete headers['host'];
  const res = await fetch(req.url(), { method: req.method(), headers, ... });
  const buf = Buffer.from(await res.arrayBuffer());
  const out = {};
  res.headers.forEach((v, k) => {
    // 中身は解凍済みなので、これらを残すと壊れる
    if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) out[k] = v;
  });
  await route.fulfill({ status: res.status, headers: out, body: buf });
});
```

これで **SPA がブラウザの中で普通に動く**。署名つきの API 呼び出しも、
サイト自身の JS が作るのでそのまま通る。公式wikiの画面を撮るのに使った。

## 表のスクロール箱は「後ろのルールに負ける」（2026-09-14）

`.ef-table-scroll table { width: max-content }` を書いたのに効かず、
スマホで列が潰れて**1文字ずつ縦に折り返した**。

原因は **`endfield.css` の後ろ（24節）に `.ef-prose table { width: 100% }` がある**こと。
どちらも詳細度 (0,1,1) なので、**後ろ勝ち**で `width: 100%` が残る。

**直し方**: `.ef-prose .ef-table-scroll table` にして (0,2,1) にする。
同じファイルの中でも**前に書いたルールは後ろに負ける**。
節をまたいで同じ要素を触るときは、詳細度を上げるか、後ろに書く。

**ついでに**: 横に長い表は**左端の見出し列を `position: sticky; left: 0`** にすると、
RANK1〜スキル特化3 のような表でも「何の行か」を見失わずに読める。
背景は透けないよう `var(--ef-bg)` を敷く。

## 死んでいる CSS は「消す」前に、当たる先を作れないか見る（2026-09-14）

`ui-old-base.css` の 23節・28節が**丸ごと当たっていなかった**。

| 節 | 書いてあったセレクタ | なぜ当たらなかったか |
| --- | --- | --- |
| 23 | `.content > .grid-cards > .card-link` | 記事ページの `.content` の**直下**に `.grid-cards` は無い |
| 28 | `.related-list > .card-link` | `related-list` を付けた要素が**どこにも無い** |

**直し方**

- 23 は `>`（直下）を外して `.content .grid-cards > .card-link` にした。意図はそのまま生きる。
- 28 は**マークアップ側に `related-list` を足した**（`EntityDetail.astro` の
  関連項目・関連記事）。ただし中身は `.card-link` ではなく `.badge`（タグ状の並び）なので、
  「1行カードに作り替える」のではなく「**押せると分かるよう右に `›` を足す**」に変えた。

**教訓**: 参考画像どおりの形に作り替えるのが常に正しいとは限らない。
いまの形の方が省スペースで実用的なら、**CSS の側を実態に合わせる**。
どちらにしても、**当たっていないセレクタを放置しない**（次に読む人が「効いている」と誤解する）。

**見つけ方**: セレクタで `grep` して、当たる要素があるか確かめる。

```bash
grep -rn "related-list" src/components/*.astro src/pages/**/*.astro
```

## 同じ置き場所へ2つのスクリプトが書いていると、後に走った方が勝つ（2026-09-14）

`public/images/official/endfield/operators/` に、**2つの取得スクリプトが両方とも書いていた**。

| スクリプト | 取ってくる先 | 出来上がる寸法 |
| --- | --- | --- |
| `fetch-endfield-wiki-images.mjs` | 公式wiki（`static.skport.com`） | **414×512** |
| `fetch-official-images.mjs` | 公式サイト（`web-static.hg-cdn.com`） | 303×386 |

ファイル名がどちらも「記事のID .webp」でそろえてあるため、**上書きし合う**。
解像度を上げる作業の途中で公式サイト側を後から走らせてしまい、
一度大きくなった顔アイコンが**また小さくなった**。ログを見るまで気付かなかった。

**直し方**: 大きい方（公式wiki）に一本化し、公式サイト側の顔アイコン取得を止めた。
公式サイトにしか無いもの（全身の立ち絵・職業アイコン・属性アイコン）はそのまま取る。

**教訓**: 取得スクリプトを足すときは、**すでに誰かが書いている置き場所かどうか**を先に見る。

```bash
grep -rn "official/endfield/operators" scripts/
```

**気付き方**: 取り直したあと、**寸法の分布を数える**と一目で分かる。

```bash
node -e "…sharp(p).metadata() で width×height を数える…"
# → 303x386:33 のように、期待した 414×512 でないことがすぐ出る
```

## 画像は「出す幅の2倍」を持っていれば足りる。それ以上は容量が増えるだけ（2026-09-14）

「一部の画像が鮮明でない」の正体は、**持っている絵より大きく引き伸ばしていた**こと。
iPhone のような細かい画面は CSS の 1px を 2〜3個の点で描くので、
**出す幅の2倍を持っていないと、そこで初めて粗く見える**。

| 置き場所 | 持っている絵 | 出していた幅 | 倍率 | 直し方 |
| --- | --- | --- | --- | --- |
| オペレーターの立ち絵 | 900 | 幅いっぱい（最大656） | 1.4倍 | **1200 に取り直し**＋出す幅を 560 に |
| アイテム等のアイコン | 396角 | 300の86%＝258 | 1.5倍 | 出す幅を **240**（＝206）に |
| 一覧のタイル（細い画面） | 396角 | 1列で約360 | 1.1倍 | **2列**にして1枚180に |
| スキルの様子 | 800×450 | 420 | 1.9倍 | そのまま（足りている） |

**逆に、2倍を超えて持っていても見た目は変わらない**。立ち絵の元は 1800px 超あるが、
1200 で足りる（560×2＝1120）。全部そのまま置くと1枚 1MB を超え、開くのが遅くなる。

**測り方**: 元の寸法は取得ログに出る（`1824x1775 955KB → 429KB`）。
出す幅は CSS の `max-width` と、その親の幅（`--ef-measure: 720px`）から出す。

## 自動リンクは「長い語の一部」に食い込む（2026-09-14）

**症状**: 本文の「集成工業の大…」で、**工業** だけが別のページへリンクされていた。
「確定情報」の**確定**が天井のページへ、「重ねて」の**重ね**が凸のページへ飛んでいた。

**原因は2つ**

1. **一般名詞が辞書に入っていた**。素材418回・装備364回・オペレーター214回。
   記事の題名が一般語だと、本文のどこにでも当たる。
2. リンクは**1記事・1宛先につき1回**。長い語（集成工業）が前の段落でリンク済みだと
   そこから先は素通りし、**あとから短い語（工業）がその文字列の一部に当たる**。

**直し方**

- `DENY` に一般語を足す（「その語だけで記事を指せないもの」が基準）
- **「自分を内部に含む、もっと長い語」を辞書に持たせ**、その内側ではリンクしない
- 見つかっても**次の出現位置を探す**（1か所で諦めると、単独のその語まで拾えなくなる）
- ★ **DENY した語も長さの判定には使う**。
  「オペレーター」をリンク対象から外したら、別名の「オペ」が
  `<a>オペ</a>レーター` に当たった。DENY は「リンクしない」であって
  「その語が本文に無い」ではない。

**測り方**

```bash
grep -roh 'class="auto-term"[^>]*>[^<]*<' dist/endfield/ \
  | sed 's/.*>\(.*\)</\1/' | sort | uniq -c | sort -rn | head -20
```

上位に**一般名詞**が並んでいたら誤爆している。固有名詞だけになれば正常。

**★ ビルドキャッシュに注意**: rehype プラグインを直しても
`node_modules/.astro` が残っていると**何も変わらない**。測る前に消すこと。

```bash
rm -rf node_modules/.astro node_modules/.vite && pnpm build
```

## 表は「表・セル・箱」の3つに地の色を敷く（2026-09-14）

**症状**: 記事の表の**セルの中まで、背景の方眼模様が透けて見える**。

**原因**: `.ef-main` は方眼の下敷きを敷いている。
表もセルも地の色を持っていなかったので、そのまま透けていた。

**直し方**: `table` / `th,td` / スクロールの箱（`.ef-table-scroll`）の**3つ**に敷く。

★ **貼り付けた左端の列**（`position: sticky`）には必ず**セルにも**敷くこと。
表だけに敷いても、横スクロールしたときに下の列と重なって読めなくなる。

## グリッドの子は `position: absolute` でもマス目が枠になる（2026-09-14）

タイルのカードを「絵が全面・名前は下に重ねる」形にしたら、**絵が 263×83 に潰れた**
（本来 263×343）。

`grid-template-areas` でマスを割り当てた要素は、`position: absolute` にしても
**そのマスが基準の枠**になる。`inset: 0` は「マスの中でいっぱい」の意味にしかならない。

**直し方**: `grid-area: auto` を足してマスの割り当てを外す。基準が親全体に戻る。

**気付き方**: 計算後の `width`/`height` を実際に測る。
CSS を読むだけでは「`inset: 0` なのだから親いっぱい」と思い込む。
