/**
 * 国内大手の攻略wikiから画像を取ってきて `public/images/from-wiki/` に置く。
 *
 * ★ 公式に無いものだけ（利用者の指示 2026-09-13）
 *   「そのwikiの画像など一部流用を可能としますが、なるべく公式サイトを優先しないもののみ」
 *   NTE の公式サイトにはキャラのポスターしか無く、弧盤・アイテムの絵が1枚も無い
 *   （2026-09-13 に公式サイトの全画像を洗って確認した）。そこだけを wiki で埋める。
 *
 * ★ 権利について
 *   画像に写っているものの権利はゲームの運営元にあり、攻略wikiの規約にも触れうる。
 *   **この判断は利用者のもの**（→ `.claude/state/DECISIONS.md`）。
 *   権利者・掲載元から求めがあれば速やかに外す。出どころは1枚ずつ
 *   `docs/IMAGE-SOURCES.md` に残す。
 *
 * ★ 名前が完全に一致するものだけを持ってくる
 *   一覧の名前と記事の名前が食い違うものは **入れない**。
 *   食い違い自体が「どちらかが誤り」という手がかりなので、
 *   `scripts/data/nte-wiki-images.json` の `_meta.保留` に書いて、記事側で確かめる。
 *
 * ★ 使い方
 *   node scripts/fetch-wiki-images.mjs           # 足りないものだけ
 *   node scripts/fetch-wiki-images.mjs --force   # 取り直す
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('.');
const OUT = path.join(ROOT, 'public/images/from-wiki');
const FORCE = process.argv.includes('--force');

const data = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts/data/nte-wiki-images.json'), 'utf8'),
);

/** 取得して WebP にして保存する */
async function grab(url, outPath, width) {
  const rel = path.relative(ROOT, outPath);
  if (!FORCE && fs.existsSync(outPath)) return { skip: true, line: `- ${rel}（すでにある）` };
  let buf;
  try {
    const res = await fetch(url);
    if (!res.ok) return { error: true, line: `! ${rel} … ${res.status}` };
    buf = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    return { error: true, line: `! ${rel} … ${String(e).slice(0, 60)}` };
  }
  let img = sharp(buf);
  const meta = await img.metadata();
  if (width && (meta.width ?? 0) > width) img = img.resize({ width });
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await img.webp({ quality: 82 }).toFile(outPath);
  const before = Math.round(buf.length / 1024);
  const after = Math.round(fs.statSync(outPath).size / 1024);
  return { ok: true, line: `  ${rel}  ${meta.width}x${meta.height}  ${before}KB → ${after}KB` };
}

const results = [];
for (const [collection, items] of Object.entries(data)) {
  if (collection.startsWith('_')) continue;
  console.log(`${collection}: ${items.length} 件`);
  for (const it of items) {
    // アイコンなので大きくしない。一覧の丸に入れて十分な大きさ
    const r = await grab(it.img, path.join(OUT, collection, `${it.id}.webp`), 256);
    console.log(r.line);
    results.push(r);
  }
}
const err = results.filter((r) => r.error);
console.log(
  `\n取得 ${results.filter((r) => r.ok).length} / すでにある ${results.filter((r) => r.skip).length} / 失敗 ${err.length}`,
);
for (const e of err) console.log(e.line);
