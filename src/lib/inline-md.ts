/**
 * ごく小さな「太字だけ」の変換。
 *
 * ★ なぜ要るか
 *   リリースノート（`src/data/releaseNotes.ts`）は Markdown のつもりで `**強調**` と
 *   書いてあるが、表示側は Markdown を通していないので**画面に `**` がそのまま出ていた**。
 *   記事本文と違い、ここは文字列の配列なので remark を通す仕組みが無い。
 *
 * ★ 何をして、何をしないか
 *   - まず **HTML として危ないものを全部エスケープ**する（`<` `>` `&` `"` `'`）。
 *   - そのあと `**…**` を `<strong>` に変えるだけ。**リンクも画像も見出しも通さない**。
 *   - つまり、出てくる HTML は `<strong>` だけ。生の HTML は絶対に混ざらない。
 *
 *   Astro 側では `set:html` で描く。エスケープ済みなので安全。
 */

/** HTML として意味を持つ文字を、そのままの文字として出るように置き換える */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * `**…**` を `<strong>` に変える。ほかの記法には触らない。
 *
 * - 閉じていない `**` はそのまま残す（壊れた見た目にしない）。
 * - `****`（空）は変換しない。
 */
export function boldToHtml(input: string): string {
  return escapeHtml(input).replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
}
