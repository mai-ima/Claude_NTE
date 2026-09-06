#!/usr/bin/env bash
# 記憶ファイルをセッション開始時・コンテキスト圧縮時にコンテキストへ流し込むフック。
#
#  - SessionStart : 新しいセッション／再開／圧縮後の最初に流す
#  - PreCompact   : 圧縮の直前に読み直させ、要約後も方針が失われないようにする
#
# 標準出力の内容がそのままコンテキストに追加される。
#
# 出す順番には理由がある。**短くて失われると困るものから先に出す**:
#   1. DECISIONS.md … 利用者が決めたこと。ここが消えると方針を取り違える（最優先）
#   2. NOW.md       … いまどこか・次の一手
#   3. CONTEXT.md   … 資料（長い）
#   4. git の状況
#
# 以前は CONTEXT.md（267行）だけを流していた。復帰に本当に要るのは「いま何をしているか」の
# 30行程度なのに毎回全文を読ませており、長いぶんそれ自体が圧縮の対象になっていた。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE="$ROOT/.claude/state"

# SessionStart の起動種別（startup / resume / compact）。他のフックでは空になる。
SOURCE="${CLAUDE_SESSION_START_SOURCE:-}"

echo "=============================================================="
if [[ "$SOURCE" == "compact" ]]; then
  echo " ⚠ コンテキスト圧縮の直後です"
  echo " まず DECISIONS.md と NOW.md を読み、進行中の作業をそのまま続けること。"
  echo " 要約に載っていない指示が DECISIONS.md にある可能性がある。"
else
  echo " このリポジトリの記憶ファイル"
fi
echo " 応答は必ず日本語。作業前にここの方針を確認すること。"
echo "=============================================================="
echo

# --- 1. 利用者が決めたこと（最優先） ---------------------------------------
if [[ -f "$STATE/DECISIONS.md" ]]; then
  echo "########## 利用者が決めたこと（.claude/state/DECISIONS.md）##########"
  echo "# 迷ったらここが正。会話の記憶や要約より優先する。"
  echo
  cat "$STATE/DECISIONS.md"
  echo
fi

# --- 2. いまどこか -----------------------------------------------------------
if [[ -f "$STATE/NOW.md" ]]; then
  echo "########## いまどこにいるか（.claude/state/NOW.md）##########"
  echo
  cat "$STATE/NOW.md"
  echo
fi

# --- 3. 資料（長い） ---------------------------------------------------------
if [[ -f "$ROOT/CONTEXT.md" ]]; then
  echo "########## 資料（CONTEXT.md）##########"
  echo
  cat "$ROOT/CONTEXT.md"
else
  echo "（CONTEXT.md が見つかりません。ルールは CLAUDE.md を参照してください）"
fi

# --- 4. git の状況 -----------------------------------------------------------
echo
echo "--- 直近のコミット（5件） ---"
git -C "$ROOT" log --oneline -5 2>/dev/null || true

echo
echo "--- 未コミットの変更 ---"
git -C "$ROOT" status --short 2>/dev/null | head -20 || true

echo
echo "--- 本番（main）に未反映のコミット数 ---"
git -C "$ROOT" rev-list --count origin/main..HEAD 2>/dev/null || echo "（不明）"
