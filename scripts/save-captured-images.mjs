/**
 * `scripts/capture-ui.mjs` で画面を開いたときに読まれた画像を、**1枚残らず**台帳にする。
 *
 *   node scripts/capture-ui.mjs <名前> <URL>     # 先に画面を取る
 *   node scripts/save-captured-images.mjs        # 台帳を作る
 *   node scripts/save-captured-images.mjs --bundle  # UIのパーツを同梱する
 *
 * ★ なぜ要るか（利用者の指示 2026-09-14）
 *   「抽出した中で確認してない画像や使用してない画像もファイルに保存して」
 *   取ったのに使わなかった画像を、**どこから来た何なのか分からないまま捨てない**。
 *   実体は `.cache/ui/<名前>/images/` にあるが追跡していないので、
 *   **台帳（寸法・容量・形式・透過の有無・出どころ）だけはリポジトリに残す**。
 *
 * ★ 同梱するもの／しないもの
 *   `--bundle` を付けると、**UIのパーツらしいものだけ**を
 *   `public/images/official/<ゲーム>/ui-parts/` へ置く。判定は次のとおり。
 *
 *   | 入れる | 入れない |
 *   | --- | --- |
 *   | SVG | 写真・宣材（スライド・ポスター・立ち絵） |
 *   | 透過があって 64KB 未満 | 64KB 以上のもの |
 *   | 幅か高さが 512px 以下 | すでに同梱済みのもの |
 *
 *   宣材写真まで入れるとリポジトリが数百MB増えるため、**台帳だけ**にする。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, DATA } from './lib/efgen.mjs';

const bundle = process.argv.includes('--bundle');
const CACHE = path.join(ROOT, '.cache/ui');

/** キャプチャの名前 → どのゲームの絵か（同梱先を決める） */
const GAME = {
  'endfield-official': 'endfield',
  'endfield-wiki-list': 'endfield',
  'endfield-wiki-operator': 'endfield',
  'nte-official': 'nte',
  'nte-characters': 'nte',
};

if (!fs.existsSync(CACHE)) {
  console.error('先に画面を取ってください: node scripts/capture-ui.mjs <名前> <URL>');
  process.exit(1);
}

/** 同じ絵を2回入れないための目印（すでに同梱しているファイル名） */
const already = new Set();
for (const g of ['endfield', 'nte']) {
  const base = path.join(ROOT, 'public/images/official', g);
  if (!fs.existsSync(base)) continue;
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      if (f.isDirectory()) walk(path.join(d, f.name));
      else already.add(f.name.replace(/\.[a-z0-9]+$/i, ''));
    }
  };
  walk(base);
}

const rows = [];
let bundled = 0;
let bundledBytes = 0;

for (const tag of fs.readdirSync(CACHE)) {
  const listFile = path.join(CACHE, tag, 'images.json');
  if (!fs.existsSync(listFile)) continue;
  const list = JSON.parse(fs.readFileSync(listFile, 'utf8'));
  const game = GAME[tag] ?? 'other';

  for (const item of list) {
    const src = path.join(CACHE, tag, 'images', item.file);
    if (!fs.existsSync(src)) continue;
    const ext = (item.url.split('?')[0].match(/\.([a-z0-9]+)$/i)?.[1] ?? '').toLowerCase();

    let w = 0;
    let h = 0;
    let format = ext;
    let alpha = false;
    if (ext !== 'svg') {
      try {
        const m = await sharp(src).metadata();
        w = m.width ?? 0;
        h = m.pageHeight ?? m.height ?? 0;
        format = m.format ?? ext;
        alpha = !!m.hasAlpha;
      } catch {
        /* 読めない形式はそのまま記録する */
      }
    }

    /* UI のパーツらしいか。写真・宣材は落とす */
    const small = item.bytes < 64 * 1024;
    const fits = w === 0 || (w <= 512 && h <= 512);
    const isPart = ext === 'svg' || (small && alpha && fits);

    /* `0002-estella.b761d517.png` → `estella`
       先頭の通し番号と、ビルドが付けた8桁前後のハッシュを外す。
       これを外さないと、**すでに同梱してある絵を二重に入れてしまう**。 */
    const base = item.file
      .replace(/^\d+-/, '')
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/\.[a-f0-9]{6,12}$/i, '');
    const row = {
      取得画面: tag,
      ゲーム: game,
      ファイル: item.file,
      出どころ: item.url,
      容量: item.bytes,
      寸法: w ? `${w}×${h}` : '',
      形式: format,
      透過: alpha,
      UIのパーツ: isPart,
      同梱: false,
    };

    if (bundle && isPart && game !== 'other' && !already.has(base)) {
      const dest = path.join(ROOT, 'public/images/official', game, 'ui-parts', `${base}.webp`);
      try {
        if (ext === 'svg') {
          /* SVG はそのまま置く（拡大しても荒れない） */
          const svgDest = dest.replace(/\.webp$/, '.svg');
          fs.mkdirSync(path.dirname(svgDest), { recursive: true });
          fs.copyFileSync(src, svgDest);
          row.同梱 = `official/${game}/ui-parts/${base}.svg`;
          bundledBytes += fs.statSync(svgDest).size;
        } else {
          const out = await sharp(src).webp({ quality: 90, effort: 6 }).toBuffer();
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, out);
          row.同梱 = `official/${game}/ui-parts/${base}.webp`;
          bundledBytes += out.length;
        }
        bundled += 1;
        already.add(base);
      } catch (e) {
        row.同梱 = `失敗: ${e.message.slice(0, 60)}`;
      }
    }
    rows.push(row);
  }
}

fs.mkdirSync(DATA, { recursive: true });
const out = path.join(ROOT, 'scripts/data/captured-images.json');
fs.writeFileSync(
  out,
  JSON.stringify({ 取得日: new Date().toISOString().slice(0, 10), 件数: rows.length, items: rows }, null, 1),
);

const parts = rows.filter((r) => r.UIのパーツ).length;
console.log(`台帳: ${rows.length} 枚（うち UI のパーツらしいもの ${parts} 枚）`);
console.log(`  → scripts/data/captured-images.json`);
if (bundle) console.log(`同梱: ${bundled} 枚 / ${(bundledBytes / 1024).toFixed(0)}KB`);
