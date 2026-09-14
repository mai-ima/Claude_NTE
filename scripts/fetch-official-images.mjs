/**
 * 公式サイトの画像を取ってきて `public/images/official/` に置く。
 *
 * ★ なぜスクリプトにするか
 *   手で拾って置くと**どこから来たか分からなくなる**。URL の一覧をここに持ち、
 *   いつでも取り直せるようにしておく。取得した結果は `docs/IMAGE-SOURCES.md` に記録する。
 *
 * ★ 決まり（利用者の指示 2026-09-13）
 *   - **公式にあるものは公式から**。攻略wikiの画像は公式に無いものだけ（`from-wiki/` へ）
 *   - **日本国内版を優先**。日本語以外の言語が写り込んだ画像は使わない
 *   - 権利は各ゲームの運営元にある。削除の求めがあれば速やかに外す
 *
 * ★ 使い方
 *   node scripts/fetch-official-images.mjs            # 全部
 *   node scripts/fetch-official-images.mjs --nte      # NTE のキャラだけ
 *   node scripts/fetch-official-images.mjs --endfield # エンドフィールドだけ
 *   node scripts/fetch-official-images.mjs --force    # 既にあるものも取り直す
 *
 * 変換には sharp を使う（Astro が持っている）。**WebP にして容量を落とす**。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('.');
const OUT = path.join(ROOT, 'public/images/official');
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const only = args.find((a) => a === '--nte' || a === '--endfield');

/** エンドフィールドの職業アイコン（公式CSS の `[data-key=…]` から実測） */
const EF_CLASSES = {
  assault: 'prof-assault.2aeeaf48.jpg',
  caster: 'prof-caster.d469c805.jpg',
  guard: 'prof-guard.78502de4.jpg',
  shielder: 'prof-shielder.a3c6ffc9.jpg',
  support: 'prof-support.532f02bd.jpg',
  vanguard: 'prof-vanguard.b957cec2.jpg',
};

/** エンドフィールドの属性アイコン */
const EF_ELEMENTS = {
  fire: 'ele-fire.97dcd67b.jpg',
  ice: 'ele-ice.134e8d15.jpg',
  electric: 'ele-electric.a3874677.jpg',
  physic: 'ele-physic.2c205b7a.jpg',
  nature: 'ele-nature.0606ebde.jpg',
};

const EF_MEDIA = 'https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/';

/**
 * 取得して WebP にして保存する。戻り値は結果の1行。
 *
 * ★ 幅の決め方（2026-09-14 に見直した）
 *   画面の細かい端末（iPhone など）は **CSS の1pxを2〜3個の点で描く**。
 *   だから「画面に出す幅の2倍」を持っていないと、そこで初めて粗く見える。
 *   逆に2倍を超えるぶんは**容量が増えるだけで見た目は変わらない**ので、
 *   出す幅の2倍強を目安にする（→ 立ち絵は本文560pxに対して1200px）。
 *
 * ★ `effort: 6`
 *   WebP の圧縮にかける手間。既定の4より**同じ画質で1〜2割小さくなる**。
 *   取り込みは1回きりなので、時間をかけて構わない。
 */
async function grab(url, outPath, { width, quality = 86 } = {}) {
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
  // 幅の指定があり、それより大きいときだけ縮める（**拡大はしない**。粗くなるだけなので）
  if (width && (meta.width ?? 0) > width) img = img.resize({ width });
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await img.webp({ quality, effort: 6 }).toFile(outPath);
  const before = Math.round(buf.length / 1024);
  const after = Math.round(fs.statSync(outPath).size / 1024);
  return { ok: true, line: `  ${rel}  ${meta.width}x${meta.height}  ${before}KB → ${after}KB` };
}

/** NTE のキャラ。記事の frontmatter `officialImage` を読む（URL をここに二重に持たない） */
async function fetchNte() {
  const dir = path.join(ROOT, 'src/content/characters');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  const jobs = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = raw.match(/^officialImage:\s*["']?(https?:\/\/[^"'\s]+)["']?\s*$/m);
    if (!m) continue;
    jobs.push({ id: f.replace(/\.md$/, ''), url: m[1] });
  }
  console.log(`NTE キャラ: ${jobs.length} 件`);
  const lines = [];
  for (const j of jobs) {
    // 記事で大きく出す縦長。一覧では CSS で顔のあたりを拡大して使う
    const r = await grab(j.url, path.join(OUT, 'nte/characters', `${j.id}.webp`), { width: 750 });
    console.log(r.line);
    lines.push({ ...r, id: j.id, url: j.url });
  }
  return lines;
}

/** エンドフィールド: オペレーターの立ち絵・職業アイコン・属性アイコン */
async function fetchEndfield() {
  const data = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'scripts/data/endfield-operators.json'), 'utf8'),
  );
  console.log(`エンドフィールド オペレーター: ${data.length} 件`);
  const lines = [];
  /* ★ 顔のアップ（`endfield/operators/`）はここでは**取らない**。2026-09-14 に取りやめた。
     同じ置き場所へ2つのスクリプトが書いていて、**後に走った方が勝つ**状態だった。
       - 公式wiki（`fetch-endfield-wiki-images.mjs`）… 414×512
       - 公式サイト（このファイル）              … 303×386  ← 小さい
     気付かずにこちらを後から走らせると**解像度が下がる**。大きい方に一本化する。
     ファイル名は公式wiki側も**記事のID**にそろえてあるので、画面側の探し方は変わらない。 */

  /* 立ち絵（全身のイラスト）。公式は 1800px 超・1枚 13MB のものがあるので、
     **幅1200に縮めて WebP** にしてから置く。記事の上に大きく出すのはこちら。
     顔のアップ（上の operators/）は一覧用。

     1200 の根拠: 本文の幅は 720px、立ち絵は `endfield.css` で 560px までに収めている。
     その2倍が 1120px なので、少し余裕をみて 1200。
     以前は 900 にしていたが、**細かい画面では 1.6倍しかなく、顔の線が甘く見えた**。 */
  for (const op of data) {
    if (!op.illust) continue;
    const id = op.id ?? op.key;
    const r = await grab(op.illust, path.join(OUT, 'endfield/illust', `${id}.webp`), {
      width: 1200,
      quality: 84,
    });
    console.log(r.line);
    lines.push({ ...r, id: `illust/${id}`, url: op.illust });
  }
  for (const [key, file] of Object.entries(EF_CLASSES)) {
    const r = await grab(EF_MEDIA + file, path.join(OUT, 'endfield/classes', `${key}.webp`));
    console.log(r.line);
    lines.push({ ...r, id: `classes/${key}`, url: EF_MEDIA + file });
  }
  for (const [key, file] of Object.entries(EF_ELEMENTS)) {
    const r = await grab(EF_MEDIA + file, path.join(OUT, 'endfield/elements', `${key}.webp`));
    console.log(r.line);
    lines.push({ ...r, id: `elements/${key}`, url: EF_MEDIA + file });
  }
  return lines;
}

const all = [];
if (!only || only === '--nte') all.push(...(await fetchNte()));
if (!only || only === '--endfield') all.push(...(await fetchEndfield()));

const ok = all.filter((r) => r.ok).length;
const skip = all.filter((r) => r.skip).length;
const err = all.filter((r) => r.error);
console.log(`\n取得 ${ok} / すでにある ${skip} / 失敗 ${err.length}`);
if (err.length) {
  console.log('失敗したもの:');
  for (const e of err) console.log(e.line);
}
