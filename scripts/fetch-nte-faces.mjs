/**
 * NTE 公式サイトから、キャラの**丸い顔アイコン**を取って同梱する。
 *
 *   node scripts/fetch-nte-faces.mjs
 *
 * ★ 何を取るか
 *   公式のキャラページ（`main.html?nav=2`）のタブに使われている
 *   `role-tab-<ピンイン>.png`。これは **丸いアイコンが縦に2つ並んだ1枚の絵**で、
 *   上が通常・下が選択中（青い背景）。**上半分だけ**を切り出して使う。
 *
 * ★ なぜ要るか
 *   いままで同梱していたのは **750×836 の縦長ポスター**だけで、
 *   一覧の小さな枠に入れると顔が切れていた。顔アイコンなら一覧で見分けがつく。
 *
 * ★ 保存先
 *   `public/images/official/nte/faces/<記事の id>.webp`（正方形・256px）
 *   ピンインと記事の id の対応は、**記事の frontmatter `officialImage`** から作る
 *   （`role-poster-<ピンイン>.png` が入っているので、そこから引ける）。
 *
 * ★ 先に画面を取っておくこと
 *   タブ画像の URL は**キャラごとにバージョンのフォルダが違う**（main260402 /
 *   main260603 / main260909 …）ので、ポスターの URL から組み立てられない。
 *   先に次を実行して、実際に読まれた URL の一覧を作っておく。
 *
 *     node scripts/capture-ui.mjs nte-characters "https://nte.perfectworld.com/jp/main.html?nav=2&role=0"
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const CHARS = path.join(ROOT, 'src/content/characters');
const OUT = path.join(ROOT, 'public/images/official/nte/faces');
fs.mkdirSync(OUT, { recursive: true });

/** 記事の frontmatter から「ピンイン → 記事の id」を作る */
const bySlug = {};
for (const f of fs.readdirSync(CHARS)) {
  if (!f.endsWith('.md')) continue;
  const raw = fs.readFileSync(path.join(CHARS, f), 'utf8');
  const m = raw.match(/officialImage:\s*"([^"]+)"/);
  if (!m) continue;
  const pin = m[1].match(/role-poster-([a-z-]+)\.(png|jpg)/)?.[1];
  if (!pin) continue;
  bySlug[pin] = { id: f.replace(/\.md$/, '') };
}
/* ゼロは男女2種。記事は1本なので、女性版は2枚目（`-2`）として置く */
if (bySlug['zero-male']) bySlug['zero-female'] = { id: `${bySlug['zero-male'].id}-2` };

/* タブ画像の実 URL は、取っておいた画面の記録から引く */
const CAP = path.join(ROOT, '.cache/ui/nte-characters/images.json');
if (!fs.existsSync(CAP)) {
  console.error('先に画面を取ってください:');
  console.error('  node scripts/capture-ui.mjs nte-characters "https://nte.perfectworld.com/jp/main.html?nav=2&role=0"');
  process.exit(1);
}
const urlOf = {};
for (const x of JSON.parse(fs.readFileSync(CAP, 'utf8'))) {
  const pin = String(x.url).match(/\/role-tab-([a-z-]+)\.png/)?.[1];
  /* スマホ用（`/m/images/`）は小さいので、パソコン用を優先する */
  if (pin && (!urlOf[pin] || !x.url.includes('/m/images/'))) urlOf[pin] = x.url;
}

console.log(`対応づけ ${Object.keys(bySlug).length} 件 / タブ画像 ${Object.keys(urlOf).length} 件`);

let ok = 0;
let skip = 0;
const fails = [];
const ledger = [];

for (const [pin, meta] of Object.entries(bySlug)) {
  const dest = path.join(OUT, `${meta.id}.webp`);
  if (fs.existsSync(dest)) { skip += 1; continue; }
  const url = urlOf[pin];
  if (!url) { fails.push(`${pin}: タブ画像の URL が記録にない`); continue; }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const buf = Buffer.from(await res.arrayBuffer());
    const { width, height } = await sharp(buf).metadata();
    /* 縦に2つ並んでいるので上半分を取る。縦横比が 1:2 でないときはそのまま使う */
    const tall = height > width * 1.5;
    const out = await sharp(buf)
      .extract({ left: 0, top: 0, width, height: tall ? Math.floor(height / 2) : height })
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 84 })
      .toBuffer();
    fs.writeFileSync(dest, out);
    ledger.push({ file: `official/nte/faces/${meta.id}.webp`, from: url, bytes: out.length });
    ok += 1;
  } catch (e) {
    fails.push(`${pin}: ${e.message}`);
  }
}

console.log(`顔アイコン: 新規 ${ok} / 既存 ${skip} / 失敗 ${fails.length}`);
for (const f of fails) console.log(`  × ${f}`);
if (ledger.length) {
  fs.writeFileSync(
    path.join(ROOT, 'scripts/data/nte-faces-ledger.json'),
    JSON.stringify({ 取得日: new Date().toISOString().slice(0, 10), items: ledger }, null, 1),
  );
  console.log('台帳: scripts/data/nte-faces-ledger.json');
}
