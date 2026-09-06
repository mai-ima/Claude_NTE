// dist/ の HTML を走査し、内部リンク（/...）の参照先が実在するか検査する。
// これまで手動で実行していた検査を恒久スクリプト化したもの。
// 使い方: pnpm build && pnpm test:links
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { glob } from 'node:fs/promises';

const DIST = 'dist';
const ASSET_EXT = /\.(png|jpg|jpeg|webp|gif|svg|xml|webmanifest|ico|css|js|mjs|json|txt|pdf|woff2?|ttf)$/i;
const SKIP_PREFIX = ['/_astro', '/pagefind'];

const hrefRe = /href="(\/[^"#?]*)"/g;
const missing = new Map(); // path -> Set(files)
let checked = 0;

const files = [];
for await (const f of glob(`${DIST}/**/*.html`)) files.push(f);

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    const href = m[1];
    if (SKIP_PREFIX.some((p) => href.startsWith(p)) || ASSET_EXT.test(href)) continue;
    checked++;
    const p = href.replace(/^\/+|\/+$/g, '');
    const candidates = [join(DIST, p, 'index.html'), join(DIST, p), join(DIST, `${p}.html`)];
    if (!candidates.some((c) => existsSync(c))) {
      if (!missing.has(href)) missing.set(href, new Set());
      missing.get(href).add(file);
    }
  }
}

console.log(`internal links checked: ${checked} | MISSING: ${missing.size}`);

// --- 「このページを編集」リンクが実在のファイルを指しているか ---------------
// 記事は .md と .mdx が混在する。編集リンクの組み立てで拡張子を決め打ちすると、
// 片方の記事だけ存在しないファイルを指す（GitHub で 404 か新規作成画面になる）。
// 見た目には分からないので、ここで機械的に確かめる。
const editRe = /href="https:\/\/github\.com\/[^/]+\/[^/]+\/edit\/[^/]+\/(src\/content\/[^"]+)"/g;
const badEdit = new Map(); // 実在しないパス -> それを出しているHTML
let editChecked = 0;
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  let m;
  while ((m = editRe.exec(html)) !== null) {
    editChecked++;
    const rel = decodeURIComponent(m[1]);
    if (!existsSync(rel)) {
      if (!badEdit.has(rel)) badEdit.set(rel, file);
    }
  }
}
console.log(`edit links checked: ${editChecked} | MISSING: ${badEdit.size}`);

if (missing.size > 0) {
  for (const [href, srcs] of [...missing].slice(0, 40)) {
    console.log(`  ${href}  <- ${[...srcs][0]}`);
  }
}
if (badEdit.size > 0) {
  console.log('編集リンクの宛先が存在しません:');
  for (const [rel, file] of [...badEdit].slice(0, 20)) {
    console.log(`  ${rel}  <- ${file}`);
  }
}
if (missing.size > 0 || badEdit.size > 0) process.exit(1);
