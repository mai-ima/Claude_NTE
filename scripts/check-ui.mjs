#!/usr/bin/env node
/**
 * ビルド成果物（dist/）の UI 検査。ブラウザを立ち上げずに HTML を静的に読む。
 *
 * ここで見ているのは、実際に起きた不具合の再発防止：
 *
 *  1. アイコン（SVG スプライト）の参照切れ
 *     astro-icon は <use href="#ai:xxx"> と <symbol id="ai:xxx"> の組で出力する。
 *     参照先の symbol が同じページに無いと、その場所のアイコンが**消える**。
 *     （View Transitions で永続化した要素が、遷移先に無い symbol を参照すると起きる）
 *
 *  2. wiki をまたぐリンクのフルロード指定漏れ
 *     NTE と αテストはレイアウトも CSS も別物なので、View Transitions で
 *     部分入れ替えされると壊れる。wiki をまたぐ <a> には data-astro-reload が要る。
 *
 *  3. wiki のページに別 wiki のナビが混ざっていないか
 *     α のページから NTE のタブ・ヘッダーが出ていると、そこから NTE へ飛ばされる。
 *
 *  4. wiki ごとのスタイルが混ざっていないか
 *     α は独自のデザインシステムで動く約束。NTE のクラス定義が来ていたら分離が崩れている。
 *
 * 使い方: pnpm build のあとに `node scripts/check-ui.mjs`
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const problems = [];

/** dist 配下の index.html をすべて集める */
function htmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

if (!fs.existsSync(DIST)) {
  console.error('dist/ がありません。先に pnpm build を実行してください。');
  process.exit(1);
}

const files = htmlFiles(DIST);
let checkedUses = 0;
let crossLinks = 0;

for (const file of files) {
  const rel = path.relative(DIST, file);
  const html = fs.readFileSync(file, 'utf8');
  const isAlphaPage = rel === 'alpha/index.html' || rel.startsWith(`alpha${path.sep}`);

  // --- 1. アイコンの参照切れ -------------------------------------------
  const symbols = new Set([...html.matchAll(/<symbol[^>]*\sid="([^"]+)"/g)].map((m) => m[1]));
  const uses = [...html.matchAll(/<use[^>]*\shref="#([^"]+)"/g)].map((m) => m[1]);
  checkedUses += uses.length;
  const missing = [...new Set(uses.filter((id) => !symbols.has(id)))];
  if (missing.length) {
    problems.push(`${rel}: アイコンの参照先がありません → ${missing.join(', ')}`);
  }

  // --- 2. wiki をまたぐリンクに data-astro-reload があるか ---------------
  // NTE のページから /alpha/ へのリンクが対象（α 側は ClientRouter を積んでいない）。
  if (!isAlphaPage) {
    for (const m of html.matchAll(/<a\b([^>]*\shref="\/alpha\/[^"]*")([^>]*)>/g)) {
      const attrs = m[1] + m[2];
      crossLinks++;
      if (!attrs.includes('data-astro-reload')) {
        const href = /href="([^"]+)"/.exec(attrs)?.[1] ?? '?';
        problems.push(
          `${rel}: wiki をまたぐリンクに data-astro-reload がありません → ${href}`,
        );
      }
    }
  }

  // --- 3. wiki のページに別 wiki のナビが出ていないか --------------------
  if (isAlphaPage) {
    if (html.includes('class="app-header"') || html.includes('class="bottom-nav"')) {
      problems.push(`${rel}: αのページに NTE のヘッダー／下部ナビが含まれています`);
    }
    // α のタブ・サイドナビのリンクが /alpha/ の外を向いていないか
    const navBlocks = [
      ...html.matchAll(/<nav class="a-tabs"[\s\S]*?<\/nav>/g),
      ...html.matchAll(/<nav class="a-side"[\s\S]*?<\/nav>/g),
    ].map((m) => m[0]);
    for (const block of navBlocks) {
      // <a href> だけを見る（<use href="#ai:…"> はアイコンの参照なので対象外）
      for (const m of block.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
        const href = m[1];
        if (href.startsWith('/alpha/')) continue;
        // サイドの「ほかの wiki」だけは NTE を指してよい（明示的な導線）
        if (block.includes('a-side') && href === '/') continue;
        problems.push(`${rel}: α のナビが α の外を指しています → ${href}`);
      }
    }
  } else {
    if (html.includes('class="a-shell"') || html.includes('class="a-tabs"')) {
      problems.push(`${rel}: NTE のページに α のシェル／タブが含まれています`);
    }
  }

  // --- 4. wiki ごとのスタイルが混ざっていないか --------------------------
  // α は独自のデザインシステムで動く約束なので、NTE 側のクラス定義が
  // 読み込まれていたら分離が崩れている（逆も同じ）。
  const styleHrefs = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(
    (m) => m[1],
  );
  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
    .map((m) => m[1])
    .join('\n');
  const cssText = inlineCss;
  if (isAlphaPage) {
    // NTE 固有のクラス（.app-header / .bottom-nav / .drawer-panel）が来ていたら混線
    for (const cls of ['.app-header', '.bottom-nav', '.drawer-panel']) {
      if (cssText.includes(cls)) {
        problems.push(`${rel}: α のページに NTE のスタイル（${cls}）が混ざっています`);
      }
    }
  } else if (cssText.includes('.a-shell') || cssText.includes('.a-tabs{')) {
    problems.push(`${rel}: NTE のページに α のスタイルが混ざっています`);
  }
  void styleHrefs;
}

console.log(`HTML ${files.length} ファイル / アイコン参照 ${checkedUses} 件 / wiki跨ぎリンク ${crossLinks} 件を検査`);
if (problems.length === 0) {
  console.log('✓ 問題は見つかりませんでした');
  process.exit(0);
}
console.log(`⚠ ${problems.length} 件の指摘:`);
for (const p of problems.slice(0, 40)) console.log('  - ' + p);
if (problems.length > 40) console.log(`  … ほか ${problems.length - 40} 件`);
process.exit(1);
