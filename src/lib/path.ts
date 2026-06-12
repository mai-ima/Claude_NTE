/**
 * base path（GitHub Pages では "/claude_nte"、Vercel では "/"）を考慮して
 * サイト内リンクを組み立てるヘルパ。Astro が出力するアセットURLは自動で
 * base が付与されるが、手書きの <a href> には付かないため本ヘルパを使う。
 */
const BASE = import.meta.env.BASE_URL; // 例: "/claude_nte/" または "/"

export function withBase(path = '/'): string {
  const base = BASE.replace(/\/$/, ''); // 末尾スラッシュ除去
  const rel = path.replace(/^\//, ''); // 先頭スラッシュ除去
  const joined = `${base}/${rel}`;
  // トレイリングスラッシュを揃える（クエリ/ハッシュ・ファイル拡張子は除く）
  if (joined.includes('#') || joined.includes('?') || /\.[a-z0-9]+$/i.test(joined)) {
    return joined;
  }
  return joined.endsWith('/') ? joined : `${joined}/`;
}

/**
 * ナビ群の中で「現在ページに最も適合する1件」の href を返す。
 * 例: /tools/ と /tools/tier-list/ が両方あるとき、/tools/tier-list/ 閲覧時は
 * 後者だけを active にする（最長一致）。一致なしは null。
 */
export function activeHref(currentPath: string, hrefs: string[]): string | null {
  const cur = currentPath.replace(/\/$/, '');
  const home = withBase('/').replace(/\/$/, '');
  let best: string | null = null;
  let bestLen = -1;
  for (const href of hrefs) {
    const tgt = withBase(href).replace(/\/$/, '');
    const match = tgt === home ? cur === home : cur === tgt || cur.startsWith(`${tgt}/`);
    if (match && tgt.length > bestLen) {
      best = href;
      bestLen = tgt.length;
    }
  }
  return best;
}
