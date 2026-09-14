/**
 * 同梱した画像の**実寸**を、ファイルの頭だけ読んで取る。
 *
 * ★ なぜ要るか
 *   `<img>` に `width` / `height` が無いと、読み終わるまで高さが 0 になる。
 *   すると絵が出た瞬間に**下の文章がガクッとずれる**（読んでいる場所を見失う）。
 *   実寸を書いておけば、ブラウザが先に場所を空けてくれる。
 *
 * ★ 速さ
 *   画像を丸ごとデコードしない。**先頭64バイトだけ**読んでヘッダを解く。
 *   同じファイルは1回しか読まない（`sizeCache`）。ビルド時にしか動かさない。
 *
 * ★ 対応している形式
 *   WebP（VP8X / VP8L / VP8 ）・PNG・GIF。JPEG はセグメントをたどる必要があるので未対応
 *   （同梱しているものは全部 WebP なので、いまは要らない）。
 *
 * 使う側は2つ:
 *   - `src/lib/rehype-img-attrs.mjs` … 記事本文の `![](…)`
 *   - `src/components/endfield/EndfieldArticle.astro` … 記事の上の大きな絵
 */
import fs from 'node:fs';
import path from 'node:path';

/* ★ `import.meta.dirname` は使わない。
   このファイルは2通りの読まれ方をする。
     1. `astro.config.mjs` から（Node がそのまま読む）→ `import.meta.dirname` は効く
     2. `.astro` から（Vite がまとめる）→ **undefined になり、道が `/public` になる**
   2のとき絵が1枚も見つからず、寸法も一覧も空になる（実測で踏んだ）。
   Astro のビルドは**いつもリポジトリの直下**で走るので、そこを起点にする。 */
export const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

/** 同じ画像を何度も読まないための控え。`null` は「測れなかった」印 */
const sizeCache = new Map();

/** ファイルの先頭だけを読む（全部読まずに済ませる） */
function head(file, bytes = 64) {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const n = fs.readSync(fd, buf, 0, bytes, 0);
    return buf.subarray(0, n);
  } finally {
    fs.closeSync(fd);
  }
}

/** 画像の寸法をヘッダから読む。分からなければ null */
export function measure(file) {
  if (sizeCache.has(file)) return sizeCache.get(file);
  let size = null;
  try {
    const b = head(file, 64);
    if (
      b.length >= 30 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP'
    ) {
      const kind = b.toString('ascii', 12, 16);
      if (kind === 'VP8X') {
        // 24bit の little endian。実寸は +1 した値
        size = {
          w: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
          h: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1,
        };
      } else if (kind === 'VP8L') {
        const n = b.readUInt32LE(21);
        size = { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 };
      } else if (kind === 'VP8 ') {
        size = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      }
    } else if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47) {
      size = { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    } else if (b.length >= 10 && b.toString('ascii', 0, 3) === 'GIF') {
      size = { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
    } else if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
      /* JPEG はセグメントをたどる必要があるので、必要になったら実装する */
      size = null;
    }
  } catch {
    size = null;
  }
  sizeCache.set(file, size);
  return size;
}

/**
 * サイトの中の絵の道（`/images/…`）から、`<img>` に付ける寸法を返す。
 * 外の URL や、測れなかったものは空を返す（属性を付けない）。
 *
 * ベースパス付き（`/base/images/…`）でも測れるよう、`/images/` から後ろを見る。
 */
export function sizeAttrs(src) {
  const s = String(src ?? '');
  const i = s.indexOf('/images/');
  if (i < 0 || /^https?:/.test(s)) return {};
  const size = measure(path.join(PUBLIC_DIR, s.slice(i + 1)));
  return size ? { width: String(size.w), height: String(size.h) } : {};
}
