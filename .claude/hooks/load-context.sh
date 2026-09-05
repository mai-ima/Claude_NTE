#!/usr/bin/env bash
# 記憶ファイル（CONTEXT.md）をセッション開始時とコンテキスト圧縮時に読み込ませるフック。
#
#  - SessionStart : 新しいセッションの最初にコンテキストへ流し込む
#  - PreCompact   : 圧縮の直前に読み直させ、要約後も方針が失われないようにする
#
# 標準出力の内容がそのままコンテキストに追加される。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTEXT="$ROOT/CONTEXT.md"

echo "=============================================================="
echo " 最重要: このリポジトリの記憶ファイル（CONTEXT.md）"
echo " 応答は必ず日本語。作業前にここの方針を確認すること。"
echo " 圧縮直後は、この内容に加えて会話ログも確認すること。"
echo "=============================================================="
echo

if [[ -f "$CONTEXT" ]]; then
  cat "$CONTEXT"
else
  echo "（CONTEXT.md が見つかりません。ルールは CLAUDE.md を参照してください）"
fi

echo
echo "--- 直近のコミット（5件） ---"
git -C "$ROOT" log --oneline -5 2>/dev/null || true

echo
echo "--- 未コミットの変更 ---"
git -C "$ROOT" status --short 2>/dev/null | head -20 || true
