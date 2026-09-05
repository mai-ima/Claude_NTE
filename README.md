# NTE 完全攻略wiki + ツール（マルチwiki対応）

**NTE（Neverness to Everness）** の攻略・データ・覚え書きをまとめた**非公式ファンwiki + ツール集**です。
日本語・スマホ優先。4テーマ切替、全文検索対応の静的サイト（Vercel配信）。

**複数ゲームの wiki を1サイトに並置**できる構成になっています。

| wiki | URL | 中身 |
| --- | --- | --- |
| NTE 完全攻略wiki（既定） | `/` | NTE の攻略・データベース・ツール |
| αテスト（仮）wiki | `/alpha/` | マルチwiki機能の検証用サンプル（ダミーデータ） |

記事データ（コレクション）・URL・ナビゲーション・用語の自動リンク辞書は wiki ごとに分離されており、
片方の更新がもう片方に影響することはありません。wiki を増やす手順は [CONTEXT.md](./CONTEXT.md) を参照。

> 開発時の方針・現在の状態は **[CONTEXT.md](./CONTEXT.md)**（このリポジトリの記憶ファイル）にまとまっています。

> 各記事は Web 調査に基づき**出典を明記**し、未確認の数値・仕様には「要確認」を付しています。
> ゲーム内画像・地図等の権利はすべて Hotta Studio / Perfect World Games に帰属します（当サイトは公式アートを同梱しません）。

## 技術スタック

- **[Astro](https://astro.build/)**（静的出力）+ TypeScript
- **MDX / Markdown** 型付きコンテンツコレクション（キャラ/システム/ガイド/ロケーション/敵/アイテム/ストーリー）
- **[Preact](https://preactjs.com/)** アイランド（各ツール・テーマ切替・個人メモ）
- **[Pagefind](https://pagefind.app/)** 静的全文検索
- **astro-icon**（Lucide アイコン）/ **@astrojs/sitemap**

## セットアップ

```bash
pnpm install          # 依存関係をインストール
pnpm dev              # 開発サーバ (http://localhost:4321/)
pnpm build            # 本番ビルド（dist/ に出力。Pagefind索引・sitemap も生成）
pnpm preview          # ビルド成果物をローカル配信（検索の最終確認用）
pnpm check            # 型チェック (astro check)
```

> ES モジュールの都合上、`file://` 直開きではなく `pnpm dev` / `pnpm preview` 経由で開いてください。

## プロジェクト構成

```
astro.config.mjs            # サイト設定（base="/", site, 統合プラグイン）
src/
  content.config.ts         # 各コレクションのスキーマ（zod）
  content/<collection>/*.md  # 記事（characters / systems / guides / locations / enemies / items / story）
  layouts/BaseLayout.astro  # 共通レイアウト（ヘッダ/ドロワー/下部ナビ/テーマ）
  components/
    EntityDetail.astro      # 詳細ページ共通レイアウト（情報パネル＋本文＋出典＋個人メモ）
    EntityList.astro        # 一覧ページ共通（グルーピング・検索）
    Avatar.astro            # 属性色のオリジナル生成アバター
    Spoiler.astro           # ネタバレ折りたたみ（<details>）
    Sidebar.astro / MobileDrawer.astro / Toc / Callout / StatusBadge / ThemeMenu
    tools/                  # 各ツール（Preact）+ registry.ts（登録）
  pages/                     # / , /characters , /systems , /guides , /locations , /enemies ,
                             #   /items , /story , /tools(+tier-list/team-builder/map) , /settings , /release-notes
  lib/                       # path(withBase) / theme / store / nav / content（コレクション横断ヘルパ）
                             #   wikis.ts … マルチwikiの定義（ブランド/ナビ/フッター/アクセント）
  data/releaseNotes.ts       # 更新履歴
  styles/                    # base / themes / components
public/                      # favicon / icons / robots
```

## 記事の書き方

`src/content/<collection>/` に Markdown/MDX を追加するだけで記事が増えます。コレクションごとにフロントマターが異なります（`src/content.config.ts` 参照）。例（characters）:

```yaml
---
name: "Nanally"          # キャラ名（他コレクションは title）
rarity: "S"              # S | A
element: "Anima"         # Cosmos/Anima/Incantation/Chaos/Psyche/Lakshana
role: "DPS"              # DPS | Survival | Buff
weapon: "Arc: Plasma"
faction: "アイボン古物店"
version: "v1.0"
tier: "SS"               # SS|S|A|B|C（ティアリストの初期値）
description: "一覧やSEOに使う説明"
status: "verified"        # verified（確認済み） | draft（要確認バッジ）
updated: 2026-06-08
sources:
  - label: "出典名"
    url: "https://..."
---
```

- 内部リンクは**相対 or `/characters/...` 形式**。base="/" なのでルート絶対パスがそのまま使えます。
- ネタバレは MDX で `import Spoiler from '../../components/Spoiler.astro'` して `<Spoiler label="…">…</Spoiler>` で折りたたみます（対象は `.mdx`）。

### コンテンツの誠実性ルール

- **出典で裏が取れた内容**は `status: verified`、**未確認の数値・仕様**は捏造せず `status: draft`（「要確認」）にします。
- ティアリスト等の評価は「コミュニティ評価・時点情報・変動あり」を明記。
- 公式画像・地図は権利配慮で同梱しません。視覚要素は属性色の**オリジナル生成アバター**や概略図で代替します。

## ツールの追加

汎用ツールは `src/components/tools/` に Preact コンポーネントを作り、`registry.ts` に
`{ id, name, description, icon, Component }` を追加すれば `/tools/[id]/` に反映されます。
キャラデータ連携ツール（ティアリスト/チームビルダー/マップ）は専用ページ（`src/pages/tools/*.astro`）で
`getCollection('characters')` のデータを props 渡しします。

## テーマ / データ保存

- テーマ: `minimal`（既定）/ `dark` / `soft` / `auto`（OS連動）。`src/styles/themes.css` の CSS 変数で定義。
- メモ・チェックリスト・ツールの状態・個人メモは **端末内（localStorage）** に保存。設定ページから **エクスポート / インポート / 初期化** が可能です。

## デプロイ（Vercel）

リポジトリを Vercel に接続すると、Framework Preset = **Astro** が自動検出され、`astro build` → `dist/` を
ルート配信します（アダプタ不要）。`astro.config.mjs` の `base` は `"/"`、`site` は本番URL。
`main` への push で本番に反映されます。
