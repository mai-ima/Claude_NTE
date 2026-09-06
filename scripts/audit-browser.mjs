#!/usr/bin/env node
/**
 * 実機相当のブラウザ検査（Playwright）。
 *
 * 静的解析（check-content / check-links / check-ui）では出ない問題を捕まえる:
 *   - ページを開いたときの JS エラー・横あふれ
 *   - ツールの数値欄に極端な値（0 / -1 / 999999999）を入れたときの NaN・Infinity
 *   - localStorage への保存と、再読み込みでの復元
 *
 * iPhone 14 Pro 相当とデスクトップ（1280×900）の両方で回す。
 *
 * 使い方:
 *   pnpm build && pnpm test:browser
 *
 * dist/ を配信するサーバは**このスクリプトが自分で立てて自分で閉じる**（外部依存なし）。
 * すでに動いているサーバを使いたいときは `AUDIT_BASE=http://localhost:4322` を渡す。
 *
 * ⚠ 動かしたサーバを止めるのに `pkill` を使わないこと。
 *   heredoc の書き込み前に自分のシェルを kill して exit 144 になった実績がある
 *   （docs/FINDINGS.md）。
 *
 * ⚠ このスクリプトは**リポジトリ直下から**実行すること。
 *   `playwright` は devDependencies にあるため、リポジトリ外から実行すると解決できない。
 */
import { chromium, devices } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DIST = path.resolve(process.cwd(), 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml',
  '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8',
};

/**
 * dist/ をそのまま配る最小のサーバ。
 * **存在しないパスは 404 を返す**（SPA のように index.html を返さない）。
 * そうしないとリンク切れが 200 に見えてしまい、検査の意味が無くなる。
 */
function serveDist() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    // trailingSlash: 'always' なので /foo/ → dist/foo/index.html
    const rel = url.endsWith('/') ? `${url}index.html` : url;
    const file = path.join(DIST, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('404');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

if (!process.env.AUDIT_BASE && !fs.existsSync(DIST)) {
  console.error('dist/ がありません。先に `pnpm build` を実行してください。');
  process.exit(1);
}

const own = process.env.AUDIT_BASE ? null : await serveDist();
const BASE = process.env.AUDIT_BASE ?? `http://127.0.0.1:${own.port}`;

const TOOLS = [
  '/tools/', '/tools/tier-list/', '/tools/team-builder/', '/tools/map/',
  '/tools/compare/', '/tools/calendar/', '/tools/gacha-dashboard/',
  '/tools/gacha-sim/', '/tools/gacha-pity/', '/tools/reaction-chart/',
  '/tools/planner/', '/tools/checklist/', '/tools/timer/', '/tools/notes/',
];
const PAGES = [
  '/', '/wikis/', '/settings/', '/release-notes/', '/characters/', '/terms/',
  '/events/', '/vehicles/', '/arcs/', '/items/', '/enemies/', '/locations/',
  '/systems/', '/guides/', '/shops/', '/people/', '/story/',
  '/alpha/', '/alpha/characters/', '/alpha/systems/', '/alpha/guides/', '/alpha/terms/',
  '/terms/annulith/', '/characters/zanko/', '/vehicles/tide/', '/events/iroi-pickup/',
];

const problems = [];
const note = (m) => problems.push(m);

async function visit(page, url, label) {
  const errors = [];
  const onErr = (e) => errors.push(`pageerror: ${e.message}`);
  const onCon = (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 200)}`); };
  page.on('pageerror', onErr);
  page.on('console', onCon);
  const res = await page.goto(BASE + url, { waitUntil: 'networkidle' });
  if (!res || res.status() >= 400) note(`${label} ${url}: HTTP ${res && res.status()}`);
  await page.waitForTimeout(400);
  // 横あふれ
  const over = await page.evaluate(() => {
    const d = document.documentElement;
    return { scroll: d.scrollWidth, client: d.clientWidth };
  });
  if (over.scroll > over.client + 1) note(`${label} ${url}: 横あふれ ${over.scroll}>${over.client}`);
  for (const e of errors) note(`${label} ${url}: ${e}`);
  page.off('pageerror', onErr);
  page.off('console', onCon);
  return errors;
}

/** 折りたたみ（<details>）をすべて開く。設定値の入力欄はこの中にあることが多い。 */
async function openAllDetails(page) {
  await page.evaluate(() => {
    for (const d of document.querySelectorAll('details')) d.open = true;
  });
  await page.waitForTimeout(250);
}

/** ツールの入力欄すべてに極端な値を入れて壊れないか見る */
async function stress(page, url, label) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await openAllDetails(page);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // 画面に出ていない入力（折りたたみの中など）は fill できないので除外する
  const numbers = await page.$$('input[type=number]:visible, input[type=range]:visible');
  for (const v of ['0', '-1', '999999999']) {
    for (const el of numbers) {
      try {
        await el.fill(v, { timeout: 1500 });
        await el.dispatchEvent('change');
      } catch { /* range は fill 不可・非表示になった要素もここに来る */ }
    }
    await page.waitForTimeout(150);
    const bad = await page.evaluate(() =>
      /NaN|Infinity|undefined%/.test(document.body.innerText) ? document.body.innerText.match(/.{0,40}(NaN|Infinity|undefined%).{0,40}/)[0] : null,
    );
    if (bad) note(`${label} ${url}: 入力 ${v} で表示崩れ「${bad.trim()}」`);
  }
  for (const e of errors) note(`${label} ${url}: 操作中エラー ${e}`);
}

const browser = await chromium.launch({ executablePath: EXE });

for (const [label, opts] of [
  ['iPhone', devices['iPhone 14 Pro']],
  ['Desktop', { viewport: { width: 1280, height: 900 } }],
]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  for (const u of [...PAGES, ...TOOLS]) await visit(page, u, label);
  if (label === 'iPhone') for (const u of TOOLS.slice(1)) await stress(page, u, label);
  await ctx.close();
}

// localStorage の復元（ガチャ天井トラッカー）
// ※ 折りたたみの中など**画面に出ていない**入力欄があるので、可視のものだけを対象にする。
try {
  const ctx = await browser.newContext(devices['iPhone 14 Pro']);
  const page = await ctx.newPage();
  await page.goto(BASE + '/tools/gacha-pity/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await openAllDetails(page); // 数値の調整欄は <details>「天井・確率の数値を調整する」の中
  const input = page.locator('input[type=number]:visible').first();
  if ((await input.count()) === 0) note('gacha-pity: 画面に出ている数値入力が見つからない');
  else {
    await input.fill('42', { timeout: 5000 });
    await input.dispatchEvent('change');
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await openAllDetails(page); // 再読込で折りたたみは閉じた状態に戻る
    const v = await page.locator('input[type=number]:visible').first().inputValue();
    if (v !== '42') note(`gacha-pity: 再読込で復元されない（保存した 42 → 復元 ${v}）`);
  }
  await ctx.close();
} catch (e) {
  note(`gacha-pity の保存/復元テストが実行できなかった: ${e.message.split('\n')[0]}`);
}

await browser.close();
own?.server.close();

console.log(`ブラウザ検査: ${PAGES.length + TOOLS.length}ページ × 2端末（iPhone 14 Pro / デスクトップ）`);
console.log('検査: JSエラー・横あふれ・HTTP応答・極端な入力・保存と復元');
console.log('');
if (problems.length === 0) {
  console.log('✓ 問題は見つかりませんでした');
} else {
  console.log(`⚠ ${problems.length} 件の指摘:`);
  for (const p of problems) console.log('  - ' + p);
}
process.exit(problems.length ? 1 : 0);
