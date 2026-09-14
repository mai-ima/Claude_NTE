# NOW.md — いまどこにいるか

> **区切りごとに丸ごと上書きする**（追記しない）。40行以内に収めること。
> 長くなったら、それは `CONTEXT.md` の「作業ログ」へ送るべき内容。

最終更新: 2026-09-14 / ブランチ `claude/claude-nte-audit-E1OnP` / `ver.bate.0.14.5`

## いちばん大きな変化 — 公式wikiが読めるようになった

**エンドフィールド公式wiki（wiki.skport.com）の API は、ログイン不要で全部読める。**
以前「ログインが要るので無理」と書いたのは**誤り**（→ `docs/FINDINGS.md`）。

```bash
node scripts/fetch-endfield-wiki.mjs --all         # 全1116件（15分ほど）
node scripts/fetch-endfield-wiki-images.mjs --all  # 画像1446枚（WebP に縮めて同梱）
node scripts/gen-endfield-operators.mjs            # 記事を書き出す
node scripts/gen-endfield-weapons.mjs
node scripts/gen-endfield-entries.mjs              # 脅威・装備・アイテム・設備
node scripts/capture-ui.mjs <名前> <URL>           # 見た目の実測値を取る
node scripts/fetch-nte-faces.mjs                   # NTE の顔アイコン
```

手順と癖は **`docs/ENDFIELD-SOURCES.md` 6章**／レシピは `docs/RECIPES.md` の11。

## いまの状態

- 記事 **1354本**（エンドフィールドが 1084本）／ ページ 1423／ `pnpm verify` は通る
- 同梱画像 **1464枚**（エンドフィールド 1446＋NTE の顔 18／約34MB）
- 一覧・記事に**絵が出る**。絞り込みに武器種・部位・区分が増えた
- **宿題 G・I・J を解消**（死んでいた CSS／未実装キャラ3体／恒常S級6体）

## 次の一手

1. **段階6（NTE 側288本のファクトチェック）の本体が残っている**。
   キャラ25本を1本ずつ攻略サイトと突き合わせる（2サイト一致で `verified`）。
2. エンドフィールドの**エリア・システム・イベント・ストーリー・ガイド**は
   公式wikiに項目が無く、1〜2本のまま。攻略サイト頼りで増やすしかない。
3. 段階7（base UI の刷新）・段階8-9（法的文書・iOS）はプランでは済み扱い。
4. 原神wiki（HoYoWiki）の作法は `/genshin/` を作るときに使う。**混ぜない**。

## つまずきやすい所

```bash
pnpm verify        # test → 記事検査 → 型 → build → UI検査 → リンク検査（build だけで約70秒）
pnpm test:browser  # 実機相当（build の後・単独で）
```

- **`pkill` は使わない** ／ **`test:browser` 中に `build` を走らせない**
- **`pnpm build` を `grep` に繋ぐと途中で切れる**（dist が不完全になる。実際に踏んだ）
- **この環境の Chromium は外部サイトへ出られない**。`page.route()` で Node に肩代わりさせる
- **本番に出るのは `main` だけ**。PR を作るかは**利用者が決める**
