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
| 3 | `src/styles/prefs.css`（iOS 専用なら `ios.css`） | `html[data-<attr>='<on>']` で効果を書く | トグルは動くが**何も起きない** |
| 4 | `src/layouts/BaseLayout.astro` の起動スクリプト内 `var prefs = [[…]]` | 同じ並びで 1 行足す | **初回描画で効かない**（再読み込みするまで反映されない／チラつく） |
| 5 | `src/lib/store.ts` の `KEEP_ON_CLEAR` | キーを足す | **「データを初期化」で新設定だけ消える** |

### 型

```ts
{ key: 'nte.xxx', attr: 'xxx', on: 'on', label, hint, group: 'display' | 'feature', icon }
```

**保存形式**は `'1'` / `'0'`。効果は `html[data-xxx='on']` を CSS で拾って実装します。

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

- `wikiOfCollection` / `wikiOfPath` / `sectionByCollection` は定義から自動で追従します。
- トップページ末尾の「ほかの wiki」も `WIKI_LIST` から自動生成されます。

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
updated: 2026-09-06
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
