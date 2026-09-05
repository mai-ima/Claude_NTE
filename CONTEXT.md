# CONTEXT.md — このリポジトリの記憶ファイル（最重要）

> **このファイルは最重要のコンテキストファイルです。**
> セッション開始時と、コンテキスト圧縮（compact）の直後には**必ずここを最初に読む**こと。
> 圧縮時は、このファイルに加えて**それまでの会話ログ（要約前のやり取り）も確認**し、
> 進行中の指示・保留事項を取りこぼさないこと。
> 会話の言語は**必ず日本語**。

最終更新: 2026-09-05

---

## 1. このリポジトリは何か

**Astro 製の静的サイト**。**複数ゲームの wiki を1サイトに並置**できる構成になっている。

| wiki | URL | 中身 |
| --- | --- | --- |
| **NTE 完全攻略wiki**（既定） | `/` | ゲーム「NTE（Neverness to Everness）」の非公式ファンwiki＋ツール |
| **αテスト（仮）wiki** | `/alpha/` | マルチwiki機能の**検証用サンプル**。実在ゲームではなくダミーデータ |

- 公開先: Vercel（静的出力、`base = "/"`）
- 開発ブランチ: `claude/claude-nte-audit-E1OnP`（作業はここへコミット／プッシュ）
- リポジトリ: `mai-ima/claude_nte`

---

## 2. 絶対に守るルール

1. **日本語で応答する**（コード内コメント・記事本文も日本語）。
2. **捏造しない**。記事に書けるのは**出典で裏が取れた事実のみ**。
   - 裏が取れた → frontmatter `status: "verified"`
   - 未検証の数値・仕様を含む → `status: "draft"`（UIに「要確認」バッジ）
   - 断定できない箇所は本文に **要確認** と明記する。
   - すべての記事に `sources`（出典URL）と `updated`（最終更新日）を付ける。
3. **過去バージョンの情報を消さない**。古くなった記述は削除ではなく
   「**いつ時点の情報か**」を添えて残す（→ `src/content/systems/version-history.md`）。
4. **公式画像・地図は同梱しない**（権利配慮）。視覚要素は自前生成のアバターや概略図で代替。
5. **wiki 同士を混ぜない**。NTE と αテストは、コレクション・URL・ナビ・自動リンク辞書まで分離済み。
6. ティア評価などの主観情報は「**コミュニティ評価・時点情報・変動あり**」と明記する。

---

## 3. ディレクトリの地図

```
astro.config.mjs           # サイト設定・旧URLのリダイレクト
src/
  content.config.ts        # 全コレクションのスキーマ（zod）。alpha* も同居
  content/<collection>/    # NTE の記事（characters / terms / systems / …）
  content/alpha-*/         # αテストwiki の記事（alpha-characters / alpha-terms / …）
  lib/
    nav.ts                 # SECTIONS（NTE）/ ALPHA_SECTIONS（α）/ 属性・ロールのメタ
    wikis.ts               # ★マルチwikiの定義（ブランド・ナビ・フッター・アクセント）
    content.ts             # コレクション横断ヘルパ（sections 引数で wiki 切替）
    detail.ts              # 詳細ページ共通ロジック
    rehype-term-links.mjs  # 本文の自動リンク（wiki ごとに別辞書）
  components/              # EntityList / EntityDetail / Sidebar / MobileDrawer …
  layouts/BaseLayout.astro # 共通レイアウト（wikiId prop で切替）
  pages/                   # NTE は直下、αテストは pages/alpha/ 配下
  data/releaseNotes.ts     # サイトの更新履歴（リリースノート）
```

### wiki を1つ増やす手順（4ステップ）

1. `src/lib/nav.ts` に `<GAME>_SECTIONS` を定義（**コレクション名は wiki 間で一意に**）
2. `src/content.config.ts` にコレクションを追加（`src/content/<game>-*/`）
3. `src/lib/wikis.ts` に `WikiMeta` を1件足す
4. `src/pages/<base>/` にページを置く（既存の `pages/alpha/` をコピーするのが早い）

`rehype-term-links.mjs` の `WIKI_GROUPS` にも同じディレクトリを追加する（自動リンク用）。

---

## 4. 現在の状態（2026-09-05 時点）

- **NTE 本体のバージョン**: Ver.1.3「霧月夜に星還りて」（2026/8/19 配信）に対応済み。
  - 新キャラ: 残虹（呪・DoT・CV井上喜久子）／リンコ（霊・追撃・CV小倉唯・9/9 実装予定）
  - 新エリア: 星暮保護区／本編第6章「霧の巣遊戯」
  - 章番号の逆転（第7章「赤竜討伐譚」が Ver.1.2 で先行、第6章が Ver.1.3）に注意
- **サイトのリリース**: `beta v0.9.0`
- **αテストwiki**: `/alpha/` に新設（サンプル記事8本）

### 既知の注意点・保留

- キャラ名の**読み**は攻略サイト間で揺れる（例: 白蔵＝ばいざん/はくぞう、九原＝じょえん/くはら）。
  本サイトは GameWith / Game8 系の表記を採用。安易に書き換えない。
- 未実装キャラ（`implemented: false`）: 明音凛／ニーシャ／クロバネ。
- リンコは 9/9 実装予定のため `status: "draft"`。実装後に確定データへ更新すること。

---

## 5. 作業のやり方

```bash
pnpm install        # 依存インストール
pnpm dev            # 開発サーバ
pnpm test           # vitest（31テスト）
pnpm build          # 本番ビルド（dist/ に出力）
pnpm test:content   # 記事の品質検査（出典・更新日・リンク記法・重複。ビルド不要）
node scripts/check-links.mjs   # 内部リンク切れ検査（build の後に実行）
```

**変更したら必ず `pnpm test` → `pnpm test:content` → `pnpm build` → `check-links.mjs` を
通してからコミットする。**

コミット後は `git push -u origin claude/claude-nte-audit-E1OnP`。

---

## 6. 更新履歴（このファイル自体の）

- 2026-09-05: 新規作成。マルチwiki基盤の追加、Ver.1.3 対応、記事の誤り修正と同時に整備。
