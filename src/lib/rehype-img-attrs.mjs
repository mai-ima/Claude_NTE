/**
 * rehype プラグイン: 記事本文の画像に、**遅れて読む指定と実寸**を付ける。
 *
 * ★ なぜ要るか
 *   Markdown の `![](…)` はただの `<img src>` になる。そのままだと
 *     1. ページを開いた瞬間に**全部の画像を読みに行く**（オペレーター1本で4〜7枚）
 *     2. 読み終わるまで高さが 0 なので、**文章が下にずれる**（読んでいる場所を見失う）
 *   の2つが起きる。`loading="lazy"` と `width`/`height` で両方とも防げる。
 *
 * ★ 実寸の取り方
 *   `src/lib/img-size.mjs` に切り出してある（記事の上の大きな絵でも同じものを使う）。
 *   ファイルの頭だけ読むので速い。
 *
 * ★ 何をしないか
 *   - 外部の URL（`https://…`）は寸法を測れないので、遅延読み込みだけ付ける。
 *   - すでに `width` が書かれているものは触らない。
 */
import { sizeAttrs } from './img-size.mjs';

export default function rehypeImgAttrs() {
  return (tree) => {
    const walk = (node) => {
      if (!node || !Array.isArray(node.children)) return;
      for (const child of node.children) {
        if (child.type === 'element' && child.tagName === 'img') {
          const p = child.properties ?? (child.properties = {});
          if (!p.loading) p.loading = 'lazy';
          if (!p.decoding) p.decoding = 'async';
          if (!p.width) Object.assign(p, sizeAttrs(p.src));
        }
        walk(child);
      }
    };
    walk(tree);
  };
}
