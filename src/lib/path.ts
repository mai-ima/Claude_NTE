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

/** 現在のパスが指定リンクと一致（または配下）するか判定（ナビのactive表示用） */
export function isActive(currentPath: string, target: string): boolean {
  const cur = currentPath.replace(/\/$/, '');
  const tgt = withBase(target).replace(/\/$/, '');
  if (tgt === withBase('/').replace(/\/$/, '')) return cur === tgt;
  return cur === tgt || cur.startsWith(`${tgt}/`);
}
