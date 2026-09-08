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
 *     独自UIの wiki はそれぞれ独立したデザインシステムで動く約束。
 *     他 wiki のクラス定義が来ていたら分離が崩れている。
 *
 * 使い方: pnpm build のあとに `node scripts/check-ui.mjs`
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const problems = [];

/**
 * NTE の共通レイアウト（BaseLayout）を使わない wiki の base。
 *
 * 以前はここが `alpha` の**文字列決め打ち**で、wiki が増えるたびに検査が素通りしていた。
 * wiki を足したら**必ずここに base を足す**こと（src/lib/wikis.ts と対応させる）。
 */
const INDEPENDENT_BASES = ['endfield', 'genshin', 'wuwa', 'hsr', 'alpha'];

/**
 * 独自UIの wiki が「自分のスタイルだけ」を持っていることを検査するための目印。
 * 値は**そのレイアウトにしか出てこないクラス名**。
 * 自分の目印は在ってよく、**他 wiki の目印が混ざっていたら失敗**とする。
 */
const STYLE_MARKS = {
  nte: ['.app-header', '.bottom-nav', '.drawer-panel'],
  alpha: ['.a-shell', '.a-tabs'],
  endfield: ['.ef-shell', '.ef-rail'],
  genshin: ['.gs-shell'],
  wuwa: ['.ww-shell'],
  hsr: ['.hsr-shell'],
};

/** dist の相対パスから、どの wiki のページかを返す（'nte' か INDEPENDENT_BASES のどれか） */
function wikiOfFile(rel) {
  const first = rel.split(path.sep)[0];
  return INDEPENDENT_BASES.includes(first) ? first : 'nte';
}

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
  const pageWiki = wikiOfFile(rel);
  const isIndependent = pageWiki !== 'nte';

  // --- 1. アイコンの参照切れ -------------------------------------------
  const symbols = new Set([...html.matchAll(/<symbol[^>]*\sid="([^"]+)"/g)].map((m) => m[1]));
  const uses = [...html.matchAll(/<use[^>]*\shref="#([^"]+)"/g)].map((m) => m[1]);
  checkedUses += uses.length;
  const missing = [...new Set(uses.filter((id) => !symbols.has(id)))];
  if (missing.length) {
    problems.push(`${rel}: アイコンの参照先がありません → ${missing.join(', ')}`);
  }

  // --- 2. wiki をまたぐリンクに data-astro-reload があるか ---------------
  // NTE のページから独自UIの wiki へのリンクが対象。
  // 独自UI側は ClientRouter を積んでいないので、View Transitions で部分入れ替えされると壊れる。
  if (!isIndependent) {
    const pattern = new RegExp(
      `<a\\b([^>]*\\shref="/(?:${INDEPENDENT_BASES.join('|')})/[^"]*")([^>]*)>`,
      'g',
    );
    for (const m of html.matchAll(pattern)) {
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
  // 独自UIの wiki に NTE のヘッダー／下部ナビが出ていたら、そこから NTE へ飛ばされる。
  if (isIndependent) {
    if (html.includes('class="app-header"') || html.includes('class="bottom-nav"')) {
      problems.push(`${rel}: ${pageWiki} のページに NTE のヘッダー／下部ナビが含まれています`);
    }
    // 独自UIの wiki のナビ（<nav>）が自分の base の外を指していないか。
    // 「ほかの wiki」への導線だけは例外（利用者が選んで押すもの）。
    const myBase = `/${pageWiki}/`;
    for (const navBlock of [...html.matchAll(/<nav\b[^>]*>[\s\S]*?<\/nav>/g)].map((m) => m[0])) {
      for (const m of navBlock.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
        const href = m[1];
        if (href.startsWith(myBase)) continue;
        // NTE のホームと wiki 一覧（ハブ）だけは、どの wiki からも指してよい
        if (href === '/' || href === '/wikis/') continue;
        // 外部リンク（公式サイトなど）は対象外
        if (/^https?:\/\//.test(href)) continue;
        problems.push(`${rel}: ${pageWiki} のナビが ${myBase} の外を指しています → ${href}`);
      }
    }
  }
  // NTE のページに独自UI wiki のシェルが混ざっていないか（逆向きの検査）
  if (!isIndependent && (html.includes('class="a-shell"') || html.includes('class="ef-shell"'))) {
    problems.push(`${rel}: NTE のページに他 wiki のシェルが含まれています`);
  }

  // --- 4. wiki ごとのスタイルが混ざっていないか --------------------------
  // 独自UIの wiki はそれぞれ独立したデザインシステムで動く約束。
  // **自分以外の目印**が CSS に来ていたら分離が崩れている。
  const cssText = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
    .map((m) => m[1])
    .join('\n');
  for (const [owner, marks] of Object.entries(STYLE_MARKS)) {
    if (owner === pageWiki) continue; // 自分の目印は在ってよい
    for (const cls of marks) {
      if (cssText.includes(cls)) {
        problems.push(`${rel}: ${pageWiki} のページに ${owner} のスタイル（${cls}）が混ざっています`);
      }
    }
  }
}

/* -------------------------------------------------------------------------
   CSS のコメントの入れ子を検査する。

   実際にやらかした事故:
     /* … :hover { background-color:#fffa00 }  (ここに閉じ記号) …
        → 続く説明文が CSS として解釈され、**次のルールが丸ごと無効化された**。
   CSS のコメントは入れ子にできないので、内側に開き記号があれば警告する。
   ビルドもリンタも通ってしまい、見た目が壊れるまで気づけないため、ここで止める。
   ------------------------------------------------------------------------- */
const styleDir = path.join(process.cwd(), 'src', 'styles');
for (const name of fs.readdirSync(styleDir).filter((f) => f.endsWith('.css'))) {
  const text = fs.readFileSync(path.join(styleDir, name), 'utf8');
  let at = 0;
  while (true) {
    const open = text.indexOf('/*', at);
    if (open < 0) break;
    const close = text.indexOf('*/', open + 2);
    if (close < 0) break;
    if (text.slice(open + 2, close).includes('/*')) {
      const line = text.slice(0, open).split('\n').length;
      problems.push(
        `src/styles/${name}:${line}: コメントの中に開き記号があります。` +
          'CSS のコメントは入れ子にできないため、途中で閉じて後続のルールが無効になります',
      );
    }
    at = close + 2;
  }
}


/* -------------------------------------------------------------------------
   9) 公開ページの禁止表現
   -------------------------------------------------------------------------
   画面に出る文字列に「運営の過程」を書かない（決定の原文は
   .claude/state/DECISIONS.md 2026-09-08「公開向けの文章の書き方」、
   判定のしかたは docs/RECIPES.md の「6. 公開ページの文章」）。

   実際に公開ページへ出てしまった言い回しを機械で止める。
   **コメントは検査しない**（このリポジトリでは悪い例をコメントに引用するため）。
   ------------------------------------------------------------------------- */
const PROSE_DIRS = ['src/pages', 'src/components', 'src/layouts', 'src/data', 'src/lib'];
const PROSE_EXT = ['.astro', '.ts', '.tsx'];
/** 語 → なぜ駄目か（指摘にそのまま出す） */
const BANNED_PHRASES = [
  ['近日公開', '約束できない予定は書かない'],
  ['決まっていません', '運営の事情。読者には「決まりましたらお知らせします」と書く'],
  ['せずに済み', '書いた側の感想。公開ページには出さない'],
  ['と思っていましたが', '制作の過程。docs/CHANGELOG-INTERNAL.md へ'],
  ['あえて', '判断の説明。結果と次の案内だけを書く'],
  ['作業用ブランチ', '開発の事情。読者に関係がない'],
  ['main への取り込み', '開発の事情。読者に関係がない'],
];

/** コメントを空白に置き換える（行数と位置は保つ）。文字列中の // は数えないので
 *  完全な構文解析ではないが、検査の取りこぼしより誤検出を避ける側に倒している。 */
function stripComments(src) {
  let out = src;
  out = out.replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, ' '));
  out = out.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  out = out.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
  return out;
}

function proseFiles(dir) {
  const abs = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(abs)) return [];
  const found = [];
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) found.push(...proseFiles(rel));
    else if (PROSE_EXT.some((x) => e.name.endsWith(x))) found.push(rel);
  }
  return found;
}

let prosePhrases = 0;
for (const dir of PROSE_DIRS) {
  for (const rel of proseFiles(dir)) {
    const text = stripComments(fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8'));
    const lines = text.split('\n');
    for (const [phrase, why] of BANNED_PHRASES) {
      lines.forEach((line, i) => {
        if (!line.includes(phrase)) return;
        prosePhrases++;
        problems.push(`${rel}:${i + 1}: 公開ページに出せない言い回し「${phrase}」 — ${why}`);
      });
    }
  }
}

console.log(
  `HTML ${files.length} ファイル / アイコン参照 ${checkedUses} 件 / wiki跨ぎリンク ${crossLinks} 件 / ` +
    `公開文の禁止表現 ${prosePhrases} 件を検査`,
);
if (problems.length === 0) {
  console.log('✓ 問題は見つかりませんでした');
  process.exit(0);
}
console.log(`⚠ ${problems.length} 件の指摘:`);
for (const p of problems.slice(0, 40)) console.log('  - ' + p);
if (problems.length > 40) console.log(`  … ほか ${problems.length - 40} 件`);
process.exit(1);
