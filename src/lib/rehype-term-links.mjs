/**
 * rehype プラグイン: 本文中に現れる「用語(terms)」の語を、その用語ページへ
 * 自動的にリンクする（Wikipediaのような自動リンク）。
 *
 * 方針:
 * - 用語辞書は src/content/terms/*.md の frontmatter（title/aliases）から構築。
 * - 1ページ・1フレーズにつき最初の1回だけリンク化（リンクの過剰を防ぐ）。
 * - 既存リンク(a)・コード(code/pre)・見出し(h1〜h3)の中はリンクしない。
 * - 長いフレーズを優先（「異象管理局」を「異象」より先に処理）。
 * - 用語ページ自身への自己リンクは張らない。
 * 依存を増やさないため、hast を手書きで走査する。
 */
import fs from 'node:fs';
import path from 'node:path';

const TERMS_DIR = path.resolve('src/content/terms');

/** 汎用すぎてリンクするとノイズになる語は除外 */
const DENY = new Set([
  '光', '霊', '呪', '闇', '魂', '相', '心', '凸', '例', '街', '島', '駅', '区',
  '本編', 'ガチャ', 'プレイヤー', '都市', '攻略', '戦闘', '育成',
]);

const SKIP_TAGS = new Set(['a', 'code', 'pre', 'script', 'style', 'kbd', 'h1', 'h2', 'h3']);

function buildDict() {
  const entries = [];
  let files = [];
  try {
    files = fs.readdirSync(TERMS_DIR);
  } catch {
    return entries;
  }
  for (const file of files) {
    if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
    const slug = file.replace(/\.(md|mdx)$/, '');
    let raw = '';
    try {
      raw = fs.readFileSync(path.join(TERMS_DIR, file), 'utf8');
    } catch {
      continue;
    }
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const front = fm[1];
    const title = (front.match(/^title:\s*["']?(.+?)["']?\s*$/m) || [])[1] || '';
    const aliasesLine = (front.match(/^aliases:\s*\[(.*)\]/m) || [])[1] || '';
    const aliases = aliasesLine
      .split(',')
      .map((s) => s.replace(/["'\s]/g, ''))
      .filter(Boolean);
    const phrases = new Set();
    const clean = title
      .replace(/（.*?）/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/／.*$/, '')
      .trim();
    if (clean) phrases.add(clean);
    for (const a of aliases) phrases.add(a);
    for (const p of phrases) {
      // 英語別名は3文字以上、日本語は2文字以上を採用（短すぎる/汎用は除外）
      if (p.length < 2) continue;
      if (DENY.has(p)) continue;
      if (/^[A-Za-z0-9 .!-]+$/.test(p) && p.length < 3) continue;
      entries.push({ phrase: p, slug, lower: p.toLowerCase() });
    }
  }
  // 長いフレーズ優先（部分一致の取り違えを防ぐ）
  entries.sort((a, b) => b.phrase.length - a.phrase.length);
  return entries;
}

let DICT = null;

export default function rehypeTermLinks() {
  if (!DICT) DICT = buildDict();
  return (tree, file) => {
    if (!DICT.length) return;
    const fpath = (file && (file.path || (file.history && file.history[0]))) || '';
    const selfSlug = (/[\\/]terms[\\/]([a-z0-9-]+)\.(md|mdx)$/.exec(fpath) || [])[1] || null;
    const seen = new Set();
    walk(tree, false, selfSlug, seen);
  };
}

function walk(node, skip, selfSlug, seen) {
  if (!node || !node.children || !Array.isArray(node.children)) return;
  const here =
    skip || (node.type === 'element' && node.tagName && SKIP_TAGS.has(node.tagName));
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 'text' && !here && child.value && child.value.trim()) {
      const replaced = linkify(child.value, selfSlug, seen);
      if (replaced) {
        children.splice(i, 1, ...replaced);
        i += replaced.length - 1;
      }
    } else if (child.type === 'element') {
      walk(child, here, selfSlug, seen);
    }
  }
}

function linkify(text, selfSlug, seen) {
  let nodes = [{ type: 'text', value: text }];
  let changed = false;
  for (const { phrase, slug } of DICT) {
    if (slug === selfSlug) continue;
    if (seen.has(phrase)) continue;
    for (let n = 0; n < nodes.length; n++) {
      const nd = nodes[n];
      if (nd.type !== 'text') continue;
      const idx = nd.value.indexOf(phrase);
      if (idx === -1) continue;
      const before = nd.value.slice(0, idx);
      const after = nd.value.slice(idx + phrase.length);
      const link = {
        type: 'element',
        tagName: 'a',
        properties: { href: `/terms/${slug}/`, className: ['auto-term'] },
        children: [{ type: 'text', value: phrase }],
      };
      const repl = [];
      if (before) repl.push({ type: 'text', value: before });
      repl.push(link);
      if (after) repl.push({ type: 'text', value: after });
      nodes.splice(n, 1, ...repl);
      seen.add(phrase);
      changed = true;
      break;
    }
  }
  return changed ? nodes : null;
}
