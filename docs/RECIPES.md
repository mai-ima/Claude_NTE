# RECIPES — 「〜を足すとき、どのファイルを触るか」

> コードを読み直さずに作業へ入るための手順書。
> 各レシピは**触るファイルを全部**挙げます。1つでも抜けると壊れます。
>
> 構造の地図は [ARCHITECTURE.md](./ARCHITECTURE.md)、検査の中身は [CHECKS.md](./CHECKS.md)。
>
> 最終更新: 2026-09-06

---

## 1. 表示設定（pref）を1つ足す

**最も事故りやすいレシピ**。忘れても**エラーにならず、静かに壊れる**箇所があります。

| # | ファイル | 何をする | 忘れると |
| --- | --- | --- | --- |
| 1 | `src/lib/prefs.ts` | `PREFS` に 1 件足す | そもそも出ない |
| 2 | `src/components/SettingsPanel.tsx` の `ICON_PATHS` | `icon` に対応する SVG パスを足す | **無言で空アイコン**（`?? ''` で握りつぶされる） |
| 3 | `src/styles/prefs.css`（iOS 専用なら `ios.css`） | `html[data-<attr>='<on>']` で効果を書く | 切り替わるが**何も起きない** |

**触るのはこの 3 箇所だけ**です。以前は 5 箇所（BaseLayout の起動スクリプトと
`store.ts` の `KEEP_ON_CLEAR`）を手で同期する必要がありましたが、
どちらも `PREFS` から自動生成／導出するようになったので**もう不要**です。

### 型（2種類ある）

```ts
// ON/OFF。保存は '1' / '0'
{ type: 'toggle', key: 'nte.xxx', attr: 'xxx', on: 'on', label, hint, group, icon }

// 3〜4段階から選ぶ。保存は value をそのまま
{ type: 'choice', key: 'nte.xxx', attr: 'xxx', def: 'm',
  choices: [{ value: 's', label: '小' }, { value: 'm', label: '標準' }], label, hint, group, icon }
```

- `group` は `'reading' | 'list' | 'wiki' | 'touch' | 'feature'`。設定パネルのカード分けに使います。
- `attr` を**省略**すると `<html>` に属性を書きません（JS から読むだけの設定に使う）。
- choice は「**`def` と同じ値のときは属性を書かない**」＝ CSS 側は素の状態を既定として書けます。
- 効いていない状態では属性を**消す**（遷移後に前ページの見た目を引きずらないため）。

### API

```ts
getPref(key): boolean        // toggle 用
getPrefValue(key): string    // choice 用。未保存・不正値は def
setPref(key, val)            // 保存して即反映（val は boolean か value 文字列）
applyPref(key, val) / applyAllPrefs()
prefDef(key) / prefBootData()  // 後者は起動スクリプト用（BaseLayout が使う）
```

### 確認

```bash
pnpm verify
```
＋ ブラウザで「切り替え → 見た目が変わる → 再読み込みで保持 → データ初期化で消えない」の4点。

---

## 2. wiki を1つ足す

| # | ファイル | 何をする |
| --- | --- | --- |
| 1 | `src/lib/nav.ts` | `<GAME>_SECTIONS: SectionMeta[]` を定義。**コレクション名は全 wiki 横断で一意**に。`dir` にディレクトリ名（ケバブ）を書く |
| 2 | `src/content.config.ts` | コレクションを追加（`src/content/<game>-*/`） |
| 3 | `src/lib/wikis.ts` | `WikiId` に id を足し、`WikiMeta` を1件追加。`WIKI_LIST` にも足す（**先頭は必ず `nte`**） |
| 4 | `src/pages/<base>/` | ページを置く（`src/pages/alpha/` をコピーするのが早い） |
| 5 | `src/lib/rehype-term-links.mjs` の `WIKI_GROUPS` | 自動リンクの辞書を分けるため、記事ディレクトリを登録 |
| 6 | `scripts/check-content.mjs` の `URL_BASE` | `'<game>-characters': '/<base>/characters/'` の対応を追加 |
| 7 | `scripts/check-ui.mjs` | 新 wiki が独自レイアウトなら、α と同じ扱いの判定を足す |

### 何もしなくてよいもの

- **wiki 一覧（`/wikis/`）は `WIKI_LIST` から組み立てている**ので、追記不要で新 wiki が並びます
  （記事数・セクションの内訳・最近の更新まで自動）。
- ヘッダーの wiki 切替・フッター・モバイルドロワーも `WIKI_LIST` から出ます。
- `wikiOfCollection` / `wikiOfPath` / `sectionByCollection` は定義から自動で追従します。
- トップページ末尾の「ほかの wiki」も `WIKI_LIST` から自動生成されます。

`WikiMeta.kind` は3種類:

| kind | 用途 | sections | ページ |
| --- | --- | --- | --- |
| `'live'`（既定） | 通常運用 | あり | 一覧・記事 |
| `'planned'` | **準備中** | **空** | **トップ1枚だけ** |
| `'sample'` | 実在しないゲームのダミー | あり | 一覧・記事 |

`'planned'` と `'sample'` はハブのカードにバッジが出ます。

### 準備中（`kind: 'planned'`）の wiki を足す

記事コレクションを持たないぶん手順が短くなります。**それぞれ独自UIで作る**のが方針
（→ [WIKIS.md](./WIKIS.md) / [UI-RESEARCH.md](./UI-RESEARCH.md)）。

| # | ファイル | 何をする |
| --- | --- | --- |
| 1 | `src/lib/wikis.ts` | `WikiMeta` を1件（`kind: 'planned'` / `sections: []` / **`officialUrl` は実在を確認してから** / `rightsHolder` 必須） |
| 2 | `src/layouts/<Game>Layout.astro` | **そのゲームのUIで**新規に作る。読み込む CSS は自分の1本だけ。<br>`<head>` は `PlannedHead.astro`、フッターの導線は `COMMON_FOOTER_LINKS`、<br>本文の末尾に `SiteStateGate` を置く |
| 3 | `src/styles/<game>.css` | トークンは `--<略>-*` に閉じる。他 wiki のトークンを参照しない |
| 4 | `src/pages/<base>/index.astro` | 準備中ページ1枚。`noindex` にする |
| 5 | `scripts/check-ui.mjs` | `INDEPENDENT_BASES` と `STYLE_MARKS` に追加 |
| 6 | `scripts/check-content.mjs` | `STATIC_PAGES` に `/<base>/` |
| 7 | `astro.config.mjs` | sitemap の `filter` に追加（中身が無いページを検索に載せない） |
| 8 | `scripts/audit-browser.mjs` | `PAGES` に追加 |

**準備中ページに必ず載せるもの**: 準備中の明示／公式サイトへのリンク（`rel="noopener noreferrer"`）／
**非公式ファンサイトである旨と権利者名**。「近日公開」など約束できないことは書かない。

### 落とし穴

- **`primaryNav` / `bottomNav` に他 wiki のページを混ぜない**。
  混ざると「α のタブから NTE に飛ばされる」事故になります（実際に起きました）。
  `test/wikis.test.ts` が `wikiOfPath(href).id === 自wikiのid` で検査しています。
- 新 wiki が独自レイアウトなら、**NTE の CSS を import しない**こと。
  `check-ui.mjs` がスタイルの混線を検査します。

---

## 3. ツールを1つ足す

| # | ファイル | 何をする |
| --- | --- | --- |
| 1 | `src/components/tools/<Name>.tsx` | Preact コンポーネントを書く |
| 2 | `src/components/tools/registry.ts` | `{ id, name, description, icon, Component }` を `TOOLS` に足す |
| 3 | `scripts/check-content.mjs` の `STATIC_PAGES` | `/tools/<id>/` を足す（記事本文からリンクする場合） |

`/tools/` の一覧・`/tools/[id]/` の個別ページ・トップページのツール欄は**自動で反映**されます。
キャラデータ連携が要るツールは、`registry.ts` ではなく専用ページ
（`src/pages/tools/*.astro`）で `getCollection('characters')` を props 渡しします。

---

## 4. 静的ページを1枚足す

| # | ファイル | 何をする |
| --- | --- | --- |
| 1 | `src/pages/<name>.astro` | ページ本体。NTE 側なら `BaseLayout` を使う |
| 2 | `scripts/check-content.mjs` の `STATIC_PAGES` | `/​<name>/` を足す（**記事本文からリンクするなら必須**） |
| 3 | `src/lib/wikis.ts` の `primaryNav` | ナビに出すなら（`wikiOfPath` がその wiki を返すパスであること） |

`/alpha/` 配下でないパスは `wikiOfPath()` が `nte` を返すので、NTE の nav に入れて構いません。
**α の nav には入れられません**（`/alpha/` 始まりでないとテストが落ちます）。
α からその頁へ導線を出したいときは `AlphaLayout.astro` に直書きし、
`scripts/check-ui.mjs` の許可リストに 1 件足します。

---

## 5. 記事を1本足す

`src/content/<collection>/<slug>.md`（MDX を使うなら `.mdx`）を作る。

### frontmatter の必須項目

```yaml
---
title: "記事タイトル"        # characters コレクションだけ name
description: "一覧やSEOに使う説明"
status: "verified"          # verified（出典で裏が取れた） | draft（要確認バッジ）
updated: 2026-09-06         # 本文を書き換えた日
checked: 2026-09-06         # 任意。書き換えずに「現行版でも正しい」と確認した日
sources:
  - label: "出典名"
    url: "https://..."
---
```

### 守るルール（誠実性）

- **捏造しない**。出典で裏が取れた内容だけ `verified`。未検証の数値・仕様は `draft` にし、
  本文にも **要確認** と明記する。
- **過去バージョンの情報を消さない**。古い記述は削除せず「いつ時点の情報か」を添えて残す
  （→ `src/content/systems/version-history.md`）。
- 内部リンクは `/characters/foo/` 形式（**末尾スラッシュ必須・`.md` は付けない**）。
- 公式画像・地図は同梱しない（権利配慮）。図は `Avatar` などの自前生成で代替する。

`pnpm test:content` がこれらを機械検査します（ビルド不要なので先に流すと速い）。

---

## 6. 一覧カードに情報を足す

`src/components/EntityList.astro` の `.card-link` の中を編集します。
`characters` だけは独自の一覧（`src/pages/characters/index.astro`）を持つので**両方**触ること。

並び順の切り替え（`data-listsort`）を効かせるには、カードに `--ord-updated` / `--ord-name` を
埋める必要があります。新しい一覧を作るときは既存のカードから同じ style をコピーしてください。

---

## 7. リリースノートを1件足す

`src/data/releaseNotes.ts` の配列**先頭**に追加（新しい順）。
サイト内の `/release-notes/` と、トップページ・設定ページの「最新バージョン」表示に反映されます。
バージョンは `beta v0.9.3` のような表記。


---

## 5. 法的文書（規約・ポリシー）を直す・足す

本格リリースに向けて `/legal/` 配下に4本置いた。**書いてある内容は実装の事実と
一致していなければならない**ので、機能を足すときはここも見直すこと。

| ファイル | 何が書いてある |
| --- | --- |
| `src/lib/legal.ts` | 4本の一覧・最終更新日・問い合わせ先。**目次とフッターはここから生成される** |
| `src/components/LegalPage.astro` | 4本で共通の枠（見出し・幅・末尾の更新日と窓口） |
| `src/pages/legal/index.astro` | 目次 |
| `src/pages/legal/{terms,privacy,disclaimer,copyright}.astro` | 本文 |

**書き方**: 4本とも**条文形式**（第◯条＋項番号の `<ol>`）。
一般的なウェブサービスの規約に揃えてある。**事実に反する条項は置かない**
（運営者の氏名・所在地は公表していないため窓口は問い合わせ先に一本化、
開示等の請求は「保有個人データを保有していない」という事実に沿って書く）。
条を足しても目次は自動で追従する（`LegalPage.astro` が本文の h2 から作る）。

**触ったら合わせて直すもの**:

1. `src/lib/legal.ts` の `LEGAL_UPDATED`（各ページ末尾に出る最終更新日）
2. `scripts/check-content.mjs` の `STATIC_PAGES`（ページを増やしたとき）
3. `scripts/audit-browser.mjs` の `PAGES`（同上）
4. フッターの導線は `src/lib/nav.ts` の `COMMON_FOOTER_LINKS`
   （**ここだけ直せば6つのレイアウトすべてに反映される**）

### ⚠ プライバシーポリシーが嘘にならないように

現在は次を**事実として**書いている。**どれかを導入するなら、導入より前に文書を直すこと。**

- アクセス解析・広告タグ・外部CDN … **0件**（`grep -riE "analytics|gtag|adsense|cdn\." src/` で確認できる）
- Cookie を書き出すコード … **無い**
- `localStorage` の内容を送信するコード … **無い**

### 権利表記は自動で追従する

`src/pages/legal/copyright.astro` の表は `WIKI_LIST` から作っている。
**wiki を1つ足したら、このページは何も直さなくても増える**（`rightsHolder` は必須）。

---

## 6. 公開ページの文章（読者向けの書き方）

> 決定の原文は `.claude/state/DECISIONS.md`（2026-09-08「公開向けの文章の書き方」）。
> 機械の検査は `scripts/check-ui.mjs` の「公開ページの禁止表現」。

**公開ページに、運営の過程を書かない。** 読者に必要なのは **結果と次の案内**だけで、
なぜそうしたか・何を迷ったか・どう直すつもりかは要らない。

| 出さない（実際に出てしまった例） | 直した文 |
| --- | --- |
| いつ公開するかは決まっていません。できていないことを「近日公開」と書くのは正確ではないので、分かった時点でこのページを書き換えます。 | 公開の時期が決まりましたら、このページでお知らせします。 |
| 思い違いをそのまま出さずに済みました。 | （公開側には書かない → `docs/CHANGELOG-INTERNAL.md`） |
| 現時点で載せられる確かな情報がないため、あえて空にしています。 | 公式の発表など、出典で裏が取れた内容から順に追加していきます。 |
| ※ 公開サイトへの反映には main への取り込みが必要です。 | （公開側には書かない。開発の事情） |

### 判定のしかた

1. その一文は**読者の行動を助けるか**。助けないなら消す。
2. 主語が「私たち／このサイトの作り手」になっていないか。なっていたら書き換える。
3. **約束できないことを書かない**（「近日公開」「◯月公開予定」）。
4. **不都合な事実は残す**。「記事はまだありません」「準備中です」
   「この wiki の内容は検証用のダミーです」は**書く**。消すのは *過程の説明* であって
   *事実* ではない。ここを取り違えると、今度は嘘になる。

### 書きがちな表現（見つけたら直す）

`〜せずに済みました` / `〜と思っていましたが` / `あえて〜しています` /
`決まっていません` / `近日公開` / `作業用ブランチ` / `main への取り込み` /
`〜することにしました`（判断の説明）

**触る場所**: `src/pages/**/*.astro` の本文、`src/data/releaseNotes.ts`、
`src/lib/notices.ts`、`src/components/**` の画面に出る文字列。

---

## 7. お知らせを1つ足す／サイトの状態を切り替える

| やりたいこと | 触る場所 | 見える範囲 |
| --- | --- | --- |
| 全員に見えるお知らせを足す | `src/lib/notices.ts` の `NOTICES`（先頭に足す） | **全員** |
| 自分の端末だけで試す | `/admin/` の「お知らせ」→ 追加 | その端末だけ |
| 全員をメンテナンス表示にする | `src/lib/site-state.ts` の `DEFAULT_SITE_STATE` | **全員** |
| 自分の端末だけ切り替える | `/admin/` の「サイトの状態」 | その端末だけ |

- お知らせの `id` は URL になる（`/notices/<id>/`）。**あとから変えない**（リンクが切れる）。
- 個別ページが立つのは `NOTICES` に書いたものだけ。管理ページで作ったものは
  一覧の下部に展開して出す（静的サイトなので URL を後から増やせない）。
- 管理ページの合言葉は環境変数 `ADMIN_PASSCODE`。ビルド時に SHA-256 にして埋め込む。
  **サーバー認証ではない**（照合はブラウザの中）。この限界は画面にも書いてある。
- 案内を重ねる要素は `src/components/SiteStateGate.astro`。
  **6つのレイアウトすべてに置く**（wiki を足したら、そのレイアウトにも入れる）。
  `/admin/` `/legal/` `/notices/` では出さない（停止中に閉じ込めを作らないため）。


---

## 8. 一覧の表示形式を1つ足す

| # | ファイル | 何をする |
| --- | --- | --- |
| 1 | `src/lib/prefs.ts` | `nte.listview` の `choices` に1件足す（`hint` も直す） |
| 2 | `src/styles/prefs.css` | `html[data-listview='<値>']` のルールを書く |
| 3 | — | **設定パネルの幅を確認する**。選択肢が4つを超えると狭い画面で横にあふれる |

エンドフィールドは別系統（`html[data-ef-view]`）:

| # | ファイル | 何をする |
| --- | --- | --- |
| 1 | `src/layouts/EndfieldLayout.astro` | 起動スクリプトの**許容値**に足す（描画前に当てる） |
| 2 | `src/components/endfield/EndfieldList.astro` | 切り替えボタンを1つ足す |
| 3 | `src/styles/endfield.css` | `html[data-ef-view='<値>']` のルールを書く |

**落とし穴**: カードに擬似要素で飾りを足すときは、
`.char-card::before`（属性色の帯）と `overflow: hidden` に注意する。
`::before` を上書きすると一覧から属性が読み取れなくなる。


---

## 9. UIモードを1つ足す

| # | ファイル | 何をする |
| --- | --- | --- |
| 1 | `src/lib/ui.ts` | `UIMode` に値を足し、`UI_MODES` に1件（`label` / `hint` / `beta`） |
| 2 | `src/styles/ui-<値>.css` | `html[data-ui='<値>']` のルールを書く |
| 3 | `src/layouts/BaseLayout.astro` | CSS を import（**他の ui-*.css と同じ並びに置く**） |
| 4 | `docs/ARCHITECTURE.md` | UIモードの表と本数を直す |

**落とし穴**

- **配色（`--accent` など）を変えるなら `html:root[data-ui='x']`** と書く。
  `html[data-ui='x']`（0,1,1）は `themes.css` の `:root[data-theme='…']`（0,2,0）に負ける。
- **`.hero` は `.page-head` でもある**。ヒーローの中だけ色を変えるときは
  `.hero.page-head .eyebrow` のように重ねる（同じ詳細度だと後ろに書いた方が勝つ）。
- **下部ナビを浮かせたら、`.app` の `padding-bottom` も増やす**
  （既定は 58px ぶんしか無い。浮かせた分だけ最後の行が隠れる）。
- 参考画像がある場合は、**画像に無い装飾を足さない**。読み取った作法は
  CSS の冒頭に箇条書きで残し、あとから根拠をたどれるようにする。

---

## 10. キャラクターの画像を出す

**UIモード `base` のときだけ**絵が出る。ほかの見た目では今までどおり生成アバター。

### 置くだけの場合（同梱しない）

```
public/images/characters/<記事のID>.webp   # avif / png / jpg / jpeg も可
```

**それだけ**。ビルド時に `src/lib/asset.ts` が有無を確かめ、あるものだけ書き出す。
置いていないキャラは生成アバターのまま（404 も出ない）。
このフォルダは `.gitignore` で除外してあるので、**リポジトリにも本番にも入らない**。

### 公式サイトの画像を参照する場合

1. 記事の frontmatter に `officialImage: "https://…"` を書く（**同梱ではなく参照**）
2. 管理ページ（`/admin/`）→「キャラクターの画像」→「公式の画像も使う」を選ぶ

**NTE のエスパー17人は登録済み**（2026-09-13）。追加するときの調べ方:

- 絵は公式サイトのトップ（`/jp/main.html`）のキャラ紹介スライドの中にある。
  **スマホ版**（`/public/m/images/mainYYMMDD/role-poster-<名>.png`）を使う。
  750×836・**上半分が透過**で、こちらの属性色の地と馴染む。
  パソコン版（`/public/images/…/*.jpg`）は 1920×1080 の横長なので**使わない**。
- `<名>` は**中国語名や音写**で、記事の ID とは一致しない。
  対応は `.claude/state/DECISIONS.md` 2026-09-13 の表を見る。
  新しいキャラは**名前ロゴ画像**（`role-name-<名>.png`）を開いて読むのが速い。
- 日付の部分（`main260402`）は**キャラごとに違う**。トップの HTML から拾うこと。

`localStorage` に入るので、**選んだ端末でだけ**効く（`site-state.ts` と同じ作り）。

### 触るファイル

| # | ファイル | 何をする |
| --- | --- | --- |
| 1 | `src/lib/images.ts` | 出どころの定義（型・キー・選択肢）。**クライアント安全**（fs を使わない） |
| 2 | `src/lib/asset.ts` | `public/` の画像をビルド時に探す。**`node:fs` を使うのでブラウザ側から import しない** |
| 3 | `src/components/Avatar.astro` | `id` / `officialImage` を受け、CSS 変数を書き出す |
| 4 | `src/styles/ui-base.css`（31節） | `::before` で絵を重ねる |
| 5 | `src/layouts/BaseLayout.astro` | 起動スクリプトが `data-images` を当てる |
| 6 | `src/pages/admin/index.astro` | 切り替えの UI |

**落とし穴**

- **絵は `<img>` ではなく `background-image` で重ねる。** 読めなければ透明のままで、
  下の生成アバターが見える（フォールバックを自分で書かなくていい）。
- `.avatar::after` は**斜めの光沢**に使われている。絵は `::before`。
- **置いていない画像の URL を書き出さない。** 全カードに書くとキャラの数だけ 404 が飛ぶ。
- 権利はゲームの運営元にある。**同梱しない**作りを崩さないこと。
