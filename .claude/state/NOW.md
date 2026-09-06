# NOW.md — いまどこにいるか

> **区切りごとに丸ごと上書きする**（追記しない）。40行以内に収めること。
> 長くなったら、それは `CONTEXT.md` の「作業ログ」へ送るべき内容。

最終更新: 2026-09-06 / ブランチ `claude/claude-nte-audit-E1OnP`

## いまやっていること

**v0.11.0 全監査** — プランは `/root/.claude/plans/03-v0.11.0-full-audit.md`
（最新版は `iphoneui-wiki-buzzing-sunbeam.md`）。

| フェーズ | 状態 |
| --- | --- |
| 1. コード監査 | ✅ 完了 |
| 2. Playwright で全ツール・全ページを実操作 | ⏳ **いまここ** |
| 3. 記事の鮮度回復 | ✅ 完了（`checked` を新設して184件に付与） |
| 4. 新機能を4方向で追加 | ⬜ 未着手 |
| 5. docs・リリースノート・CONTEXT の仕上げ | ⬜ 未着手 |

## 次の一手

1. `scripts/audit-browser.mjs` を実行して結果を見る
2. 出た不具合を直し、`docs/AUDIT-2026-09.md` に記録
3. フェーズ4へ

## 動かし方（つまずきやすい所）

```bash
npx serve dist -l 4322          # -s は付けない（404 が 200 になる）
node scripts/audit-browser.mjs  # リポジトリ直下で実行（playwright の解決のため）
```

- **`pkill` は使わない**。自分のシェルを kill して exit 144 になる（`docs/FINDINGS.md`）。
  サーバを止めたいときはポートを変えるか放置する。
- rehype を触ったら `rm -rf .astro node_modules/.astro dist` してから再ビルド
  （キャッシュで変更が反映されず、直っていないように見える）。

## 保留・気になっていること

- 用語集の一覧が 192KB（105件を1ページに全部出している）／UIモード10種の CSS 137KB
- リンコは 9/9 実装予定。実装されたら `status: "draft"` を外して確定データへ
