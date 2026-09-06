# CONTEXT.md — このリポジトリの記憶ファイル（最重要）

> **このファイルは最重要のコンテキストファイルです。**
> セッション開始時と、コンテキスト圧縮（compact）の直後には**必ずここを最初に読む**こと。
> 圧縮時は、このファイルに加えて**それまでの会話ログ（要約前のやり取り）も確認**し、
> 進行中の指示・保留事項を取りこぼさないこと。
> 会話の言語は**必ず日本語**。

最終更新: 2026-09-06

---

## 1. このリポジトリは何か

**Astro 製の静的サイト**。**複数ゲームの wiki を1サイトに並置**できる構成になっている。

| wiki | URL | 中身 |
| --- | --- | --- |
| **NTE 完全攻略wiki**（既定） | `/` | ゲーム「NTE（Neverness to Everness）」の非公式ファンwiki＋ツール |
| **αテスト（仮）wiki** | `/alpha/` | マルチwiki機能の**検証用サンプル**。実在ゲームではなくダミーデータ |

- 公開先: Vercel（静的出力、`base = "/"`）
- リポジトリ: `mai-ima/claude_nte`
- 開発ブランチ: `claude/claude-nte-audit-E1OnP`（作業はここへコミット／プッシュ）

> ### ⚠ 本番に出るのは `main` だけ
> **作業ブランチにいくらプッシュしても本番 URL には反映されない。**
> 本番 <https://claude-nte.vercel.app/> は `main` からビルドされる。作業ブランチは
> Vercel の**プレビューURL**に出るだけ。
>
> 「直したはずなのに直っていない」と感じたら、まずここを疑うこと：
> 1. 見ている URL は本番か、プレビューか
> 2. `git log --oneline origin/main..HEAD` で、本番に未反映のコミットが無いか
> 3. ブラウザの再読み込み（キャッシュされた古い HTML を見ていないか）
>
> 本番へ出すには `main` へのマージが要る（PR を作るかどうかは**利用者の判断**）。

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

> **詳細は [docs/](./docs/) にある。コードを読み直す前にそちらを見ること。**
>
> | ファイル | 何が書いてあるか |
> | --- | --- |
> | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 全ファイルの役割・lib の関数シグネチャ・CSS の読み込み順・localStorage のキー |
> | [docs/RECIPES.md](./docs/RECIPES.md) | 「〜を足すとき触るファイル」の全リスト（設定 / wiki / ツール / 記事 / 静的ページ） |
> | [docs/CHECKS.md](./docs/CHECKS.md) | `pnpm verify` の各検査が禁じていること。落ちたときの直し方 |
> | [docs/FINDINGS.md](./docs/FINDINGS.md) | 読んで確かめた知見と、過去にやった勘違いの「誤 → 正」 |
>
> このファイル（CONTEXT.md）は「**今どうなっているか・何をしたか**」に専念する。

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
    alpha/                 # αテスト専用（AlphaList / AlphaArticle）
  layouts/
    BaseLayout.astro       # NTE のレイアウト（wikiId prop を持つ）
    AlphaLayout.astro      # ★αテスト専用レイアウト（NTE の CSS を読み込まない）
  styles/
    alpha.css              # ★αテスト専用のデザインシステム（--a-* トークン）
    ios.css                # ★iPhone 最適化（html[data-ios] のときだけ効く）
  pages/                   # NTE は直下、αテストは pages/alpha/ 配下
  data/releaseNotes.ts     # サイトの更新履歴（リリースノート）
scripts/
  check-links.mjs          # 内部リンク切れ（ビルド後）
  check-content.mjs        # 記事の体裁・誠実性ルール（ビルド不要）
  check-ui.mjs             # ★アイコン参照切れ / wiki跨ぎリンク / ナビ混入（ビルド後）
```

### wiki を1つ増やす手順（4ステップ）

1. `src/lib/nav.ts` に `<GAME>_SECTIONS` を定義（**コレクション名は wiki 間で一意に**）
2. `src/content.config.ts` にコレクションを追加（`src/content/<game>-*/`）
3. `src/lib/wikis.ts` に `WikiMeta` を1件足す
4. `src/pages/<base>/` にページを置く（既存の `pages/alpha/` をコピーするのが早い）

`rehype-term-links.mjs` の `WIKI_GROUPS` にも同じディレクトリを追加する（自動リンク用）。

→ **検査スクリプト側の追記も要る**。抜け漏れのない全手順は
[docs/RECIPES.md](./docs/RECIPES.md#2-wiki-を1つ足す) にある。

---

## 4. 現在の状態（2026-09-06 時点）

- **NTE 本体のバージョン**: Ver.1.3「霧月夜に星還りて」（2026/8/19 配信）に対応済み。
  - 新キャラ: 残虹（呪・DoT・CV井上喜久子）／リンコ（霊・追撃・CV小倉唯・9/9 実装予定）
  - 新エリア: 星暮保護区／本編第6章「霧の巣遊戯」
  - 章番号の逆転（第7章「赤竜討伐譚」が Ver.1.2 で先行、第6章が Ver.1.3）に注意
- **サイトのリリース**: `beta v0.10.0`（記事は全264件、うち draft 52件）
- **αテストwiki**: `/alpha/` に新設（サンプル記事8本）。**NTE とは別UI**（AlphaLayout + alpha.css）
- **wiki 一覧（ハブ）**: `/wikis/` を新設。`WIKI_LIST` から自動生成するので、
  wiki を1つ足してもこのページは触らなくてよい。
- **設定**: 14件（うち多値が6件）。定義は `src/lib/prefs.ts` の一箇所だけ。
  起動スクリプトと「初期化しても残すキー」はそこから自動生成・導出される。

### 既知の注意点・保留

- キャラ名の**読み**は攻略サイト間で揺れる（例: 白蔵＝ばいざん/はくぞう、九原＝じょえん/くはら、
  海月＝みつき/くらげ、翳＝えい/かげ）。本サイトは **GameWith / Game8 系の表記**を採用。
  神ゲー攻略の読みは自動生成らしく不正確なことがあるため、**安易に書き換えない**。
- 未実装キャラ（`implemented: false`）: 明音凛（S・相）／ニーシャ／クロバネ（S・魂）。
- リンコは 9/9 実装予定のため `status: "draft"`。実装後に確定データへ更新すること。
- 恒常S級6体の内訳は Ver.1.1 時点の確認。恒常追加の有無は未確認（要確認のまま）。
- 弧盤の総数「44種」は Ver.1.1 時点。以降は増えるので断定しない。
- **wiki のナビ定義に別 wiki のページを混ぜない**（α のタブから NTE へ飛ぶ事故になる）。
  `test/wikis.test.ts` が検査している。
- **wiki をまたぐリンクには `data-astro-reload` を付ける**。NTE は View Transitions、
  α は独立レイアウトのため、部分入れ替えされると画面が壊れる。`pnpm test:ui` が検査している。
- 日本語本文で `**強調**` の閉じ記号の直前が全角括弧・句読点でも効くのは
  `remark-cjk-friendly` を入れているから。外すと 77 ページ規模で壊れる。

#### 症状から原因を引く

| 症状 | まず疑うところ |
| --- | --- |
| α のタブ／ホームから NTE に飛ぶ | `wikis.ts` の ALPHA ナビに NTE のページが混ざっていないか（`pnpm test`） |
| wiki をまたぐとアイコンが消える | 跨ぐリンクに `data-astro-reload` があるか（`pnpm test:ui`） |
| 本文の `**` が生のまま出る | `remark-cjk-friendly` が `astro.config.mjs` から外れていないか |
| 直したのに本番が変わらない | **`main` にマージされているか**（作業ブランチは本番に出ない） |
| α に NTE の見た目が混ざる | `AlphaLayout` が `alpha.css` 以外を読んでいないか（`pnpm test:ui`） |
| 設定パネルのアイコンが空白 | `SettingsPanel.tsx` の `ICON_PATHS` への足し忘れ（検査では出ない） |
| 設定が「データ初期化」で消える | `store.ts` の `KEEP_ON_CLEAR`（今は `PREFS` から自動導出） |
| 検査や作業手順が思い出せない | **[docs/](./docs/) を見る**（RECIPES＝手順／CHECKS＝検査／FINDINGS＝知見） |

---

## 5. 作業ログ（新しい順・区切りごとに追記する）

> **運用ルール**: まとまった作業を終えたら、ここに1〜3行で「何をしたか／何が残っているか」を追記する。
> 長い作業の途中でも、区切り（コミット前など）ごとにこのファイルを読み直して方針を確認すること。

### 2026-09-06 — wikiハブ・設定の拡張・調査結果の資産化（beta v0.10.0）

- **`docs/` を新設**（ARCHITECTURE / RECIPES / CHECKS / FINDINGS）。毎セッション同じ調査を
  やり直していたので、構造の知識をリポジトリに残した。**コードを読む前にまず docs/ を見る**。
- **`/wikis/`（wiki 一覧）を新設**。`WIKI_LIST` から組み立てるので wiki を足しても触らなくてよい。
  ヘッダー・フッター・ドロワー・404・設定・α のサイド／フッターから導線を張った。
  「よく見る wiki」を設定しても**自動移動はしない**（勝手に飛ばすと戻れなくなるため）。
- **設定を 6 → 14 件に**。文字サイズ・行間・一覧の表示／並び順・よく見る wiki・
  タップの反応・タブバーを隠す・本文の長押し抑制。設定パネルは7枚のカードに整理した。
  一覧の並び替えは **CSS の `order`** で実現（JS を足していない）。
- **設定の二重管理を解消**: 起動スクリプトの配列と `KEEP_ON_CLEAR` を `PREFS` から
  自動生成・導出。足し忘れで無言で壊れる箇所が2つ減った（残るは `ICON_PATHS` のみ）。
- α 側の iOS 最適化を NTE と同等に拡張（`alpha.css` 内で完結。`ios.css` は α で読ませない）。
- **スクロール復元は何も足さなかった**。「α で壊れている」と誤診したが、原因は
  Playwright の `click()` が要素まで自動スクロールしていたこと。`goto()` で測り直すと
  NTE も α も正しく復元される。経緯は `docs/FINDINGS.md` に残した。

### 2026-09-06 — 再発報告の切り分けと安定性の底上げ（beta v0.9.3）

- 「α のタブから NTE に飛ぶ／SVG が出ない」の再報告を受けて全経路を実クリック検証したが、
  **作業ブランチの最新では再現しなかった**（α 13ページ・タブ全押し・アイコン欠落0・JSエラー0）。
- 切り分けの結果、原因は**本番 `main` に未反映**だったこと。本番 `/alpha/` は 404 で、
  v0.9.0〜v0.9.2 の 10 コミットが `main` に入っていなかった。見ていた画面が古い版だった。
- 同じ混乱を繰り返さないため、CONTEXT の冒頭に「本番に出るのは main だけ」を明記し、
  「症状から原因を引く」表を追加した。
- 安定性: `pnpm verify` で検証を1コマンドに統合し、GitHub Actions（verify.yml）で
  push ごとに同じ並びが走るようにした。`check-ui.mjs` に wiki 間のスタイル混線検査を追加。

### 2026-09-06 — iPhone最適化・α専用UI・不具合修正（beta v0.9.2）

- **日本語の強調が壊れていた**: CommonMark は閉じの `**` の直前が全角括弧・句読点だと強調と認識しない。
  77ページで `**` が生のまま出ていた。`remark-cjk-friendly` を入れて記事を書き換えずに解消。
- **α のナビから NTE へ飛ばされる**: `wikis.ts` の ALPHA ナビに `/settings/`（NTE のページ）が
  混ざっていたのが原因。除去し、混入を防ぐテストを追加した。
- **wiki 跨ぎでアイコンが消える**: NTE は View Transitions、α は独立レイアウトなので、
  跨ぐリンクを ClientRouter に横取りさせると壊れる。`data-astro-reload` を付けてフルロードにした。
- α 専用UI（`AlphaLayout.astro` + `alpha.css`）と iPhone 最適化（`ios.css`）を追加。
- `scripts/check-ui.mjs`（`pnpm test:ui`）を追加。上記3種の不具合を機械検出できる。
- 検証は Playwright（/opt/pw-browsers/chromium-1194）で iPhone 14 Pro 相当を実操作して行った。

### 2026-09-05 — 全記事の手動点検（beta v0.9.1）

- 全264記事を通読し、公式・大手wikiと突き合わせて点検。魔の書の弱点（ニューホランドの表だけ光→闇）、
  白蔵/ファルディーヤの所属表記、潯の英語版バナー名、CV欠落5件などを修正。
- ガイド類に残っていた英語露出（Annulith / Beyond the Rails / Scarborough Fair / Fons）を日本語化。
- `scripts/check-content.mjs`（`pnpm test:content`）を追加し、記事の体裁と誠実性ルールを機械検査できるようにした。
- システム側も整理: Astro 6 で非推奨の `markdown.rehypePlugins` を `unified()`（@astrojs/markdown-remark）へ移行し、
  ビルド時の deprecation 警告を解消。未使用変数を削除し、`test/wikis.test.ts` で wiki 分離の不変条件を検査するようにした（全43テスト）。
- **残**: events / vehicles の一部は Ver.1.3 の新要素（新車3台の個別ページなど）が未収録。出典が取れ次第追加する。

### 2026-09-05 — Ver.1.3 対応とマルチwiki基盤（beta v0.9.0）

- Ver.1.3 の新キャラ・新エリア・第6章・夏イベント・新モードを追加。バージョン履歴ページを新設。
- カオスを実装済みデータへ修正、ティア表を9月時点へ同期、レクイエム弧盤PUのURLを是正（旧URLはリダイレクト）。
- マルチwiki基盤（`src/lib/wikis.ts`）と αテストwiki（`/alpha/`）を新設。

---

## 6. 作業のやり方

```bash
pnpm install        # 依存インストール
pnpm dev            # 開発サーバ
pnpm test           # vitest（31テスト）
pnpm build          # 本番ビルド（dist/ に出力）
pnpm test:content   # 記事の品質検査（出典・更新日・リンク記法・重複。ビルド不要）
pnpm test:ui        # UI検査（アイコン参照切れ・wiki跨ぎリンク・ナビ混入。build の後）
node scripts/check-links.mjs   # 内部リンク切れ検査（build の後に実行）
```

上記をまとめて実行するなら **`pnpm verify`**（test → 記事検査 → 型 → build → UI検査 → リンク検査）。
GitHub Actions（`.github/workflows/verify.yml`）でも push のたびに同じ並びが走る。

**変更したら必ず `pnpm verify` を通してからコミットする。**

コミット後は `git push -u origin claude/claude-nte-audit-E1OnP`。

---

## 7. 更新履歴（このファイル自体の）

- 2026-09-06: `docs/` を新設し、構造の詳細をそちらへ分離（v0.10.0）。このファイルは
  「今どうなっているか・何をしたか」に専念する役割に整理した。
- 2026-09-06: 本番反映の経路（main のみ）と症状対応表を追記。検証を `pnpm verify` に統合（v0.9.3）。
- 2026-09-06: α専用UI・iPhone最適化・不具合修正（v0.9.2）を反映。検証手順に `pnpm test:ui` を追加。
- 2026-09-05: 作業ログ節（第5節）を追加。区切りごとに追記する運用に変更。
- 2026-09-05: 新規作成。マルチwiki基盤の追加、Ver.1.3 対応、記事の誤り修正と同時に整備。
