/**
 * 公式サイト・公式wiki の**見た目**をまとめて取る。
 *
 *   node scripts/capture-ui.mjs <名前> <URL> [--wait 12000]
 *
 * 取れるもの（すべて `.cache/ui/<名前>/` に置く。追跡しない）
 *   css/*.css        … 読み込まれた CSS（`<style>` も含む）
 *   images/          … 画面に出ている画像（img と背景画像）
 *   measured.json    … 主要な要素の**計算後スタイル**（色・字送り・角丸・余白）
 *   summary.json     … 実測の集計（色の出現数・角丸・字送り・動き）
 *   shot-pc.png / shot-phone.png / shot-full.png
 *
 * ★ なぜブラウザで開くのか
 *   公式サイトも公式wikiも **JavaScript で描く**ので、HTML を取っても中身が無い。
 *   計算後のスタイルは、実際に描かせないと分からない。
 *
 * ★ この環境の Chromium は外へ出られない
 *   プロキシとの TLS が切られて `ERR_CONNECTION_RESET` になる。
 *   そこで `page.route()` で全部の要求を横取りし、**Node の fetch で取って返す**。
 *   → docs/FINDINGS.md「この環境の Chromium は外部サイトへ出られない」
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ROOT } from './lib/efgen.mjs';

const [tag, url] = process.argv.slice(2);
if (!tag || !url) {
  console.error('使い方: node scripts/capture-ui.mjs <名前> <URL> [--wait 12000]');
  process.exit(1);
}
const waitMs = Number(process.argv[process.argv.indexOf('--wait') + 1]) || 12000;
const OUT = path.join(ROOT, '.cache/ui', tag);
fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'images'), { recursive: true });

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

/** 取れたもの。あとで数える */
const seenCss = [];
const seenImg = new Map();

/** 通信を Node に肩代わりさせる */
async function relay(ctx) {
  await ctx.route('**/*', async (route) => {
    const req = route.request();
    const u = req.url();
    if (!/^https?:/.test(u)) return route.continue();
    const headers = { ...req.headers() };
    delete headers['accept-encoding']; // fetch が自動で解くので外す
    delete headers['host'];
    try {
      const res = await fetch(u, {
        method: req.method(),
        headers,
        body: ['GET', 'HEAD'].includes(req.method()) ? undefined : req.postDataBuffer(),
        redirect: 'follow',
      });
      const buf = Buffer.from(await res.arrayBuffer());
      const out = {};
      res.headers.forEach((v, k) => {
        // 中身は解凍済みなので、これらを残すと壊れる
        if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) out[k] = v;
      });
      const type = res.headers.get('content-type') ?? '';
      if (/text\/css/.test(type) || /\.css(\?|$)/.test(u)) seenCss.push({ url: u, text: buf.toString('utf8') });
      if (/^image\//.test(type) && !seenImg.has(u)) seenImg.set(u, buf);
      await route.fulfill({ status: res.status, headers: out, body: buf });
    } catch (e) {
      await route.abort();
    }
  });
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/* ------------------------------------------------------------------ *
 * パソコンの幅で開く
 * ------------------------------------------------------------------ */
const ctx = await browser.newContext({ locale: 'ja-JP', viewport: { width: 1440, height: 1000 }, userAgent: UA });
await relay(ctx);
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch((e) => console.log('goto:', e.message));
await page.waitForTimeout(waitMs);
/* 下まで送って、遅れて出るものも描かせる */
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 800) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(2500);

await page.screenshot({ path: path.join(OUT, 'shot-pc.png') });
await page.screenshot({ path: path.join(OUT, 'shot-full.png'), fullPage: true });
fs.writeFileSync(path.join(OUT, 'page.html'), await page.content());

/* --- 実測値 --------------------------------------------------------- */
const measured = await page.evaluate(() => {
  const rows = [];
  const els = Array.from(document.querySelectorAll('body *')).slice(0, 1500);
  for (const el of els) {
    if (!(el instanceof HTMLElement)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 16 || r.height < 6) continue;
    const s = getComputedStyle(el);
    rows.push({
      tag: el.tagName.toLowerCase(),
      cls: String(el.className || '').slice(0, 90),
      text: (el.textContent || '').trim().slice(0, 36),
      w: Math.round(r.width),
      h: Math.round(r.height),
      color: s.color,
      bg: s.backgroundColor,
      bgImage: s.backgroundImage === 'none' ? '' : s.backgroundImage.slice(0, 160),
      font: `${s.fontSize} / ${s.lineHeight} / ${s.fontWeight}`,
      family: s.fontFamily.slice(0, 70),
      ls: s.letterSpacing,
      radius: s.borderRadius,
      border: s.borderTopWidth === '0px' ? '' : `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
      pad: s.padding,
      gap: s.gap,
      transition: s.transition === 'all 0s ease 0s' ? '' : s.transition.slice(0, 120),
      transform: s.transform === 'none' ? '' : s.transform.slice(0, 80),
      clip: s.clipPath === 'none' ? '' : s.clipPath.slice(0, 120),
      shadow: s.boxShadow === 'none' ? '' : s.boxShadow.slice(0, 120),
      display: s.display,
    });
  }
  return rows;
});
fs.writeFileSync(path.join(OUT, 'measured.json'), JSON.stringify(measured, null, 1));

/* --- 集計（よく出る値ほど「そのサイトらしさ」） ------------------------ */
const count = (list) => {
  const m = {};
  for (const v of list) if (v) m[v] = (m[v] ?? 0) + 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 24);
};
const summary = {
  URL: url,
  取得日: new Date().toISOString().slice(0, 10),
  要素数: measured.length,
  文字色: count(measured.map((m) => m.color)),
  地の色: count(measured.map((m) => m.bg)),
  角丸: count(measured.map((m) => m.radius)),
  字送り: count(measured.map((m) => m.ls)),
  字の大きさ: count(measured.map((m) => m.font)),
  書体: count(measured.map((m) => m.family)),
  罫線: count(measured.map((m) => m.border)),
  動き: count(measured.map((m) => m.transition)),
  影: count(measured.map((m) => m.shadow)),
  切り抜き: count(measured.map((m) => m.clip)),
  背景画像: count(measured.map((m) => m.bgImage)),
};

/* ------------------------------------------------------------------ *
 * スマホの幅でも撮る
 * ------------------------------------------------------------------ */
const mctx = await browser.newContext({
  locale: 'ja-JP',
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
});
await relay(mctx);
const mpage = await mctx.newPage();
await mpage.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {});
await mpage.waitForTimeout(waitMs);
await mpage.screenshot({ path: path.join(OUT, 'shot-phone.png') });

/* ------------------------------------------------------------------ *
 * 保存
 * ------------------------------------------------------------------ */
let n = 0;
for (const c of seenCss) {
  const name = `${String(n).padStart(3, '0')}-${(c.url.split('/').pop() || 'style').slice(0, 40)}`;
  fs.writeFileSync(path.join(OUT, 'css', name.endsWith('.css') ? name : `${name}.css`), `/* ${c.url} */\n${c.text}`);
  n += 1;
}
const imgList = [];
for (const [u, buf] of seenImg) {
  const base = (u.split('/').pop() || 'img').split('?')[0].slice(0, 60) || 'img';
  const name = `${String(imgList.length).padStart(4, '0')}-${base}`;
  fs.writeFileSync(path.join(OUT, 'images', name), buf);
  imgList.push({ file: name, url: u, bytes: buf.length });
}
fs.writeFileSync(path.join(OUT, 'images.json'), JSON.stringify(imgList, null, 1));
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 1));

console.log(`[${tag}] CSS ${seenCss.length} 本 / 画像 ${imgList.length} 枚 / 要素 ${measured.length} 個`);
console.log(`  → .cache/ui/${tag}/`);
for (const k of ['文字色', '地の色', '角丸', '字送り', '動き']) {
  console.log(`  ${k}: ${summary[k].slice(0, 6).map(([v, c]) => `${v}(${c})`).join(' ')}`);
}
await browser.close();
