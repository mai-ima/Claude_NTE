/**
 * `public/` に置かれた画像を**ビルド時に**探す。
 *
 * ★ サーバー（ビルド）側でしか動かない。`node:fs` を使うので、
 *   ブラウザへ渡るコード（`.tsx` のアイランドなど）から import しないこと。
 *   定数だけが要るときは `src/lib/images.ts` を使う。
 *
 * なぜ存在を確かめるのか: 置いていない画像の URL をそのまま書き出すと、
 * **キャラの数だけ 404 が飛ぶ**。あるものだけを書き出せば、
 * 置いていない状態でも今までどおり（生成アバター）で静かに動く。
 */
import fs from 'node:fs';
import path from 'node:path';

/** 探す拡張子。左から順に見て、最初に見つかったものを使う */
const EXTS = ['webp', 'avif', 'png', 'jpg', 'jpeg'];

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

/** 同じ問い合わせを何度もするので覚えておく（一覧は1ページで数十回呼ばれる） */
const cache = new Map<string, string | null>();

/**
 * `public/images/<dir>/<id>.<拡張子>` を探し、見つかれば**サイト内の絶対パス**を返す。
 * 見つからなければ `null`。
 *
 * @param dir 画像の種類ごとのフォルダ名（例: 'characters'）
 * @param id  記事の ID（例: 'zanko'）
 */
export function findLocalImage(dir: string, id: string): string | null {
  const key = `${dir}/${id}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  let found: string | null = null;
  for (const ext of EXTS) {
    const rel = `images/${dir}/${id}.${ext}`;
    if (fs.existsSync(path.join(PUBLIC_DIR, rel))) {
      found = `/${rel}`;
      break;
    }
  }
  cache.set(key, found);
  return found;
}
