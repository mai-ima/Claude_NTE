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
if (missing.size > 0) {
  for (const [href, srcs] of [...missing].slice(0, 40)) {
    console.log(`  ${href}  <- ${[...srcs][0]}`);
  }
  process.exit(1);
}
