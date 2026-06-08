# NTE 完全攻略wiki + ツール

NTE（ゲーム）に関する攻略・データ・覚え書きをまとめた、自分専用の **wiki + ツール集** です。
日本語・スマホ優先。4テーマ切替、全文検索対応の静的サイト。

## 技術スタック

- **[Astro](https://astro.build/)**（静的出力）+ TypeScript
- **MDX / Markdown** コンテンツコレクション（wiki記事）
- **[Preact](https://preactjs.com/)** アイランド（各ツール・テーマ切替・個人メモ）
- **[Pagefind](https://pagefind.app/)** 静的全文検索（base配下でも `bundlePath` を明示）
- **astro-icon**（Lucide アイコン）/ **@astrojs/sitemap**

## セットアップ

```bash
pnpm install          # 依存関係をインストール
pnpm dev              # 開発サーバ (http://localhost:4321/claude_nte/)
pnpm build            # 本番ビルド（dist/ に出力。Pagefind索引・sitemap も生成）
pnpm preview          # ビルド成果物をローカル配信（検索の最終確認用）
pnpm check            # 型チェック (astro check)
node scripts/gen-icons.mjs   # タッチアイコン(public/icons/icon-192.png)を再生成
```

> ES モジュールの都合上、`file://` 直開きではなく `pnpm dev` / `pnpm preview` 経由で開いてください。

## プロジェクト構成

```
astro.config.mjs            # サイト設定（base, 統合プラグイン）
src/
  content.config.ts         # wikiコレクションのスキーマ（zod）
  content/wiki/*.md         # wiki記事（フロントマター付き）
  layouts/BaseLayout.astro  # 共通レイアウト（ヘッダ/ドロワー/テーマ/SW登録）
  components/                # Sidebar / Toc / Callout / StatusBadge / ThemeMenu ほか
  components/tools/          # 各ツール（Preact）+ registry.ts（登録）
  pages/                     # ルーティング（/ , /wiki , /tools , /settings , /release-notes , 404）
  lib/                       # path(withBase) / theme / store / nav
  data/releaseNotes.ts       # 更新履歴
  styles/                    # base / themes / components
public/                      # favicon / icons / robots
scripts/gen-icons.mjs        # タッチアイコン生成
```

## wiki記事の書き方

`src/content/wiki/` に Markdown を追加するだけで記事が増えます。フロントマター例：

```yaml
---
title: 記事タイトル
description: 一覧やSEOに使う説明
category: キャラクター        # src/lib/nav.ts の CATEGORIES と対応
tags: [タグ1, タグ2]
status: draft                 # 'verified'（確認済み） | 'draft'（要確認バッジ表示）
order: 10                     # サイドバー内の並び順
updated: 2026-06-08
---
```

- 内部リンクは**相対パス**で書きます（base に依存せず堅牢）。
  - wiki記事どうし: `[用語集](../glossary/)`（記事は `/wiki/<slug>/` にあるため `../<slug>/`）
  - ツールへ: `[確率ツール](../../tools/probability/)`
- 画像は `src/assets/...` に置き `![代替テキスト](../../assets/...)` で参照（Astroが最適化）。

### コンテンツの誠実性ルール

- **一般的に正しい内容**（確率の数式・リソース管理の原則など）は通常記述（`status: verified`）。
- **NTE固有の未確認数値**（ステータス・排出率など）は捏造せず、`status: draft` の「要確認」として枠だけ用意しています。確定情報が分かったら該当記事を更新してください。

## ツールの追加

`src/components/tools/` に Preact コンポーネントを作り、`registry.ts` に
`{ id, name, description, icon, Component }` を追加するだけで、ハブと `/tools/[id]/` に反映されます。

## テーマ

`minimal`（既定）/ `dark` / `soft` / `auto`（OS連動）。ヘッダー右上または設定ページから切替、選択は localStorage に保存されます。配色は `src/styles/themes.css` の CSS 変数で定義。

## データ保存

メモ・チェックリスト・個人メモなどは **端末のブラウザ（localStorage）** に保存されます。
設定ページから **エクスポート / インポート / 初期化** が可能です（端末間同期はエクスポート経由）。

## デプロイ

### GitHub Pages（既定）

`.github/workflows/deploy.yml` を同梱しています。リポジトリの **Settings → Pages → Build and deployment → Source = GitHub Actions** にすると、`main`（または既定ブランチ）への push で
`https://mai-ima.github.io/claude_nte/` に公開されます。`astro.config.mjs` の `base` は `/claude_nte`。

### Vercel（将来切替する場合）

Vercel は base が不要（ルート配信）なので、環境変数で切り替えられます：

```
SITE_BASE = /
SITE_URL  = https://<your-project>.vercel.app
```

Framework Preset は Astro（ビルド `astro build`、出力 `dist`）。コード変更は不要です。
