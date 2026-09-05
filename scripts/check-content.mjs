#!/usr/bin/env node
/**
 * 記事の品質検査（ビルド不要）。
 *
 * 内部リンク切れの検査（scripts/check-links.mjs）はビルド後の HTML を見るのに対し、
 * こちらは **Markdown のソースそのもの** を見て、記事としての体裁と誠実性ルールを検査する。
 *
 *   - verified なのに出典（sources）が無い
 *   - updated / description / tags の欠落
 *   - 内部リンクの記法ミス（末尾スラッシュ無し・.md 付き・存在しない宛先）
 *   - 表示名の重複（同じ名前の記事が2つある）
 *   - 陳腐化しやすい表現（「実装予定」「最新」など）が古い更新日のまま残っている
 *
 * 使い方:
 *   node scripts/check-content.mjs           # 問題があれば終了コード 1
 *   node scripts/check-content.mjs --all     # 情報レベルの指摘も表示
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'src/content');
const SHOW_ALL = process.argv.includes('--all');

/** コレクションのディレクトリ → 公開URLのベース（src/lib/nav.ts と対応させる） */
const URL_BASE = {
  characters: '/characters/',
  people: '/people/',
  systems: '/systems/',
  guides: '/guides/',
  terms: '/terms/',
  locations: '/locations/',
  shops: '/shops/',
  vehicles: '/vehicles/',
  arcs: '/arcs/',
  enemies: '/enemies/',
  items: '/items/',
  story: '/story/',
  events: '/events/',
  'alpha-characters': '/alpha/characters/',
  'alpha-systems': '/alpha/systems/',
  'alpha-guides': '/alpha/guides/',
  'alpha-terms': '/alpha/terms/',
};

/** リンク先として存在してよいが記事ではないパス（一覧ページ・ツールなど） */
const STATIC_PAGES = new Set([
  '/',
  '/tools/',
  '/settings/',
  '/release-notes/',
  '/alpha/',
  ...Object.values(URL_BASE),
  '/tools/tier-list/',
  '/tools/team-builder/',
  '/tools/map/',
  '/tools/compare/',
  '/tools/calendar/',
  '/tools/gacha-dashboard/',
  '/tools/gacha-sim/',
  '/tools/gacha-pity/',
  '/tools/reaction-chart/',
  '/tools/planner/',
  '/tools/checklist/',
  '/tools/timer/',
  '/tools/notes/',
]);

/** ごく簡易な frontmatter パーサ（このリポジトリの書式に限定） */
function parseFront(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { front: {}, body: raw, rawFront: '' };
  const front = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      const v = kv[2].trim();
      if (v === '') {
        front[key] = []; // 次行以降の "- ..." を集める
      } else if (v.startsWith('[')) {
        // インライン配列（tags: ["a", "b"]）
        front[key] = v
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((x) => x.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else {
        front[key] = v.replace(/^["']|["']$/g, '');
      }
    } else if (key && /^\s*-\s/.test(line)) {
      if (!Array.isArray(front[key])) front[key] = [];
      front[key].push(line.replace(/^\s*-\s*/, ''));
    }
  }
  return { front, body: raw.slice(m[0].length), rawFront: m[1] };
}

const problems = [];
const notes = [];
const add = (level, file, msg) => (level === 'info' ? notes : problems).push(`${file}: ${msg}`);

// --- 記事を読み込む ---------------------------------------------------------
const articles = [];
for (const dir of Object.keys(URL_BASE)) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of fs.readdirSync(abs)) {
    if (!/\.mdx?$/.test(file)) continue;
    const slug = file.replace(/\.mdx?$/, '');
    const raw = fs.readFileSync(path.join(abs, file), 'utf8');
    const { front, body } = parseFront(raw);
    articles.push({ dir, slug, file: `src/content/${dir}/${file}`, front, body, url: `${URL_BASE[dir]}${slug}/` });
  }
}

const knownUrls = new Set(articles.map((a) => a.url));

// --- 1件ずつ検査 ------------------------------------------------------------
const TODAY = new Date('2026-09-05');
const STALE_DAYS = 240;
const VOLATILE = ['実装予定', '最新章', '現在の最新', '近日', '予定です'];

for (const a of articles) {
  const f = a.front;
  const name = f.nameJa || f.title || f.name || a.slug;

  if (!f.description) add('warn', a.file, 'description がありません');
  if (!f.updated) add('warn', a.file, 'updated（最終更新日）がありません');
  if (!Array.isArray(f.tags) || f.tags.length === 0) add('info', a.file, 'tags が空です');

  const sources = Array.isArray(f.sources) ? f.sources : [];
  if (f.status === 'verified' && sources.length === 0 && !a.dir.startsWith('alpha-')) {
    add('warn', a.file, 'status: verified なのに sources（出典）がありません');
  }

  // 陳腐化しやすい表現 × 古い更新日
  if (f.updated) {
    const days = Math.round((TODAY - new Date(f.updated)) / 86_400_000);
    for (const word of VOLATILE) {
      if (a.body.includes(word) && days > 90) {
        add('warn', a.file, `「${word}」を含むのに ${days} 日更新されていません（陳腐化の可能性）`);
        break;
      }
    }
    if (days > STALE_DAYS) add('info', a.file, `${days} 日更新されていません`);
  }

  // 内部リンクの記法・宛先
  for (const m of a.body.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const href = m[1];
    if (/\.mdx?$/.test(href)) {
      add('warn', a.file, `内部リンクに拡張子が付いています: ${href}`);
      continue;
    }
    const clean = href.split('#')[0];
    if (!clean.endsWith('/')) {
      add('warn', a.file, `内部リンクの末尾に / がありません: ${href}`);
      continue;
    }
    if (!knownUrls.has(clean) && !STATIC_PAGES.has(clean)) {
      add('warn', a.file, `リンク先が存在しません: ${href}`);
    }
  }

  a.displayName = name;
}

// 表示名の重複（別コレクション間は許容。同一コレクション内のみ検査）
const byName = new Map();
for (const a of articles) {
  const key = `${a.dir}:${a.displayName}`;
  if (byName.has(key)) add('warn', a.file, `同じ表示名の記事があります: ${a.displayName}（${byName.get(key)}）`);
  else byName.set(key, a.file);
}

// --- 結果 -------------------------------------------------------------------
const draft = articles.filter((a) => a.front.status === 'draft').length;
console.log(`記事: ${articles.length}件（draft ${draft}件 / verified ${articles.length - draft}件）`);
console.log(`検査: 出典・更新日・内部リンク記法・リンク先・重複・陳腐化`);
console.log('');

if (problems.length === 0) console.log('✓ 問題は見つかりませんでした');
else {
  console.log(`⚠ ${problems.length} 件の指摘:`);
  for (const p of problems) console.log('  - ' + p);
}
if (SHOW_ALL && notes.length) {
  console.log('');
  console.log(`ℹ 情報 (${notes.length} 件):`);
  for (const n of notes) console.log('  - ' + n);
} else if (notes.length) {
  console.log('');
  console.log(`ℹ 情報レベルの指摘が ${notes.length} 件あります（--all で表示）`);
}

process.exit(problems.length ? 1 : 0);
