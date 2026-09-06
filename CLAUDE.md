# CLAUDE.md

## 最初にやること（毎回）

このファイルは入口にすぎない。**記憶の本体は次の3つ**で、**この順に読む**。

| # | ファイル | 何が書いてあるか | 分量 |
| --- | --- | --- | --- |
| 1 | [.claude/state/DECISIONS.md](./.claude/state/DECISIONS.md) | **利用者が決めたこと**（原文つき）。追記のみ | 短い |
| 2 | [.claude/state/NOW.md](./.claude/state/NOW.md) | **いまどこにいるか**・次の一手・つまずきやすい所 | 40行以内 |
| 3 | [CONTEXT.md](./CONTEXT.md) | 現状の資料（構成・既知の注意点・作業ログ） | 長い |

`.claude/hooks/load-context.sh` がこの順で自動的に流し込む（`SessionStart` / `PreCompact`）。

**コンテキスト圧縮（compact）の直後は、まず 1 と 2 を読む。**
方針を取り違えたら `DECISIONS.md` が正。要約や記憶より優先する。
加えて**それまでの会話ログ**（要約前のやり取り・利用者の指示）も確認し、
進行中の作業や保留事項を取りこぼさないこと。

## 調べる前に docs/ を見る

コードを読み直す前に、[docs/](./docs/) に答えが無いか確認すること。
過去のセッションで調べた結果がここに残してある。

| ファイル | 何が書いてあるか |
| --- | --- |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | どこに何があるか。lib の関数シグネチャ、CSS の読み込み順、localStorage のキー一覧 |
| [docs/RECIPES.md](./docs/RECIPES.md) | 「設定を1つ足す」「wiki を1つ足す」など、**触るファイルの全リスト** |
| [docs/CHECKS.md](./docs/CHECKS.md) | `pnpm verify` の各検査が何を禁じているか。落ちたときの直し方 |
| [docs/FINDINGS.md](./docs/FINDINGS.md) | 実際に読んで確かめたこと。**過去にやった勘違いの「誤 → 正」** |

新しく分かったことは、その場で該当ファイルに追記すること。

## 応答の言語

**必ず日本語**で応答する。コード内のコメント、記事本文、コミットメッセージも日本語。

## 作業の要点（詳細は CONTEXT.md）

- Astro 製の静的サイト。**複数ゲームの wiki を並置**する構成（NTE = `/`、αテスト = `/alpha/`）。
- **捏造しない**。出典で裏が取れた内容だけを `status: "verified"`、未検証は `status: "draft"` と
  本文の「要確認」で明示する。全記事に `sources` と `updated` を付ける。
- **過去バージョンの情報は消さない**。古い記述は「いつ時点の情報か」を添えて残す。
- 変更したら `pnpm verify` を通す（test → 記事検査 → 型 → build → UI検査 → リンク検査）。
- 作業ブランチは `claude/claude-nte-audit-E1OnP`。
- **本番に出るのは `main` だけ**。作業ブランチへのプッシュは本番 URL に反映されない。
  「直したのに直っていない」と言われたら、まず `git log --oneline origin/main..HEAD` を確認する。

## 作業が一区切りしたら

1. **[.claude/state/NOW.md](./.claude/state/NOW.md) を丸ごと上書き**する（追記しない・40行以内）。
   次の自分がここだけ読めば手を動かし始められる状態にする。
2. `CONTEXT.md` の「4. 現在の状態」と「5. 作業ログ」を更新する。
3. **リリースノート（`src/data/releaseNotes.ts`）を更新する**。忘れやすい。
   利用者に見える変更なら、専門用語を避けた日本語で1項目足す。

利用者が新しい方針を決めたら、その場で
**[.claude/state/DECISIONS.md](./.claude/state/DECISIONS.md) に原文つきで追記**する。

## 長い作業の途中でも

区切り（コミット前、大きな方針転換の前、コンテキストが伸びてきたとき）ごとに
**`CONTEXT.md` を読み直して**方針を確認する。読み直したら、そのとき分かったことを
作業ログへ短く追記しておくこと。
