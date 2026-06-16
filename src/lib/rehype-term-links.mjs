/**
 * rehype プラグイン: 本文中に現れるサイト内エンティティ名（用語・キャラ・店・弧盤・
 * 地名・敵・アイテム・登場人物など）を、その個別ページへ自動リンクする
 * （Wikipediaのような自動リンク）。
 *
 * 方針:
 * - 辞書は src/content/<collection>/*.md の frontmatter（nameJa/title/aliases）から構築。
 * - href は `/<collection>/<slug>/`。
 * - 1ページ・1フレーズにつき最初の1回だけリンク化（リンクの過剰を防ぐ）。
 * - 既存リンク(a)・コード(code/pre)・見出し(h1〜h3)の中はリンクしない。
 * - 長いフレーズを優先（「異象管理局」を「異象」より先に処理）。
 * - エンティティ自身のページへの自己リンクは張らない。
 * 依存を増やさないため、hast を手書きで走査する。
 */
import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.resolve('src/content');
// 自動リンク対象コレクション（href は /<collection>/<slug>/）。
const COLLECTIONS = [
  'terms',
  'characters',
  'people',
  'shops',
  'locations',
  'arcs',
  'systems',
  'enemies',
  'items',
  'vehicles',
  'events',
];

/** 汎用すぎてリンクするとノイズになる語は除外 */
const DENY = new Set([
  '光', '霊', '呪', '闇', '魂', '相', '心', '凸', '例', '街', '島', '駅', '区',
  '本編', 'ガチャ', 'プレイヤー', '都市', '攻略', '戦闘', '育成', '電車', '移動',
  'キャラ', 'キャラクター', 'システム', 'イベント', 'アイテム', 'ショップ',
]);

const SKIP_TAGS = new Set(['a', 'code', 'pre', 'script', 'style', 'kbd', 'h1', 'h2', 'h3']);

/** title/nameJa から、本文に現れやすい主フレーズへ整形（括弧・併記を除去） */
function cleanName(s) {
  return s
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/／.*$/, '')
    .trim();
}

function buildDict() {
  const entries = [];
  for (const collection of COLLECTIONS) {
    const dir = path.join(CONTENT_DIR, collection);
    let files = [];
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
      const slug = file.replace(/\.(md|mdx)$/, '');
      let raw = '';
      try {
        raw = fs.readFileSync(path.join(dir, file), 'utf8');
      } catch {
        continue;
      }
      const fm = raw.match(/^---\n([\s\S]*?)\n---/);
      if (!fm) continue;
      const front = fm[1];
      const title = (front.match(/^title:\s*["']?(.+?)["']?\s*$/m) || [])[1] || '';
      const nameJa = (front.match(/^nameJa:\s*["']?(.+?)["']?\s*$/m) || [])[1] || '';
      const aliasesLine = (front.match(/^aliases:\s*\[(.*)\]/m) || [])[1] || '';
      const aliases = aliasesLine
        .split(',')
        .map((s) => s.replace(/^\s*["']?/, '').replace(/["']?\s*$/, '').trim())
        .filter(Boolean);
      const phrases = new Set();
      // 主フレーズは nameJa 優先（キャラの表示名）、無ければ title
      const primary = cleanName(nameJa || title);
      if (primary) phrases.add(primary);
      const cleanTitle = cleanName(title);
      if (cleanTitle) phrases.add(cleanTitle);
      for (const a of aliases) phrases.add(a);
      for (const p of phrases) {
        if (p.length < 2) continue;
        if (DENY.has(p)) continue;
        const ascii = /^[\x20-\x7e]+$/.test(p);
        // ASCII(英数記号)のみのフレーズは、単語境界チェックを要する＆3文字以上に限定
        if (ascii && p.replace(/[^A-Za-z0-9]/g, '').length < 3) continue;
        entries.push({ phrase: p, collection, slug, ascii });
      }
    }
  }
  // 長いフレーズ優先（部分一致の取り違えを防ぐ）。同長は terms を優先（順序維持で十分）。
  entries.sort((a, b) => b.phrase.length - a.phrase.length);
  // 同一フレーズの重複は最初の1件（最長一致・コレクション順）だけ残す
  const seenPhrase = new Set();
  return entries.filter((e) => {
    if (seenPhrase.has(e.phrase)) return false;
    seenPhrase.add(e.phrase);
    return true;
  });
}

let DICT = null;

export default function rehypeTermLinks() {
  if (!DICT) DICT = buildDict();
  return (tree, file) => {
    if (!DICT.length) return;
    const fpath = (file && (file.path || (file.history && file.history[0]))) || '';
    const m = /[\\/]content[\\/]([a-z]+)[\\/]([a-z0-9-]+)\.(md|mdx)$/.exec(fpath);
    const selfKey = m ? `${m[1]}/${m[2]}` : null;
    const seen = new Set();
    walk(tree, false, selfKey, seen);
  };
}

/** ノードのタグ名（標準hastは tagName、MDX JSX は name） */
function tagOf(node) {
  return node.type === 'element' ? node.tagName : node.name || '';
}

function walk(node, skip, selfKey, seen) {
  if (!node || !Array.isArray(node.children)) return;
  const tag = tagOf(node);
  const here = skip || (tag && SKIP_TAGS.has(tag));
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 'text' && !here && child.value && child.value.trim()) {
      const replaced = linkify(child.value, selfKey, seen);
      if (replaced) {
        children.splice(i, 1, ...replaced);
        i += replaced.length - 1;
      }
    } else if (Array.isArray(child.children)) {
      walk(child, here, selfKey, seen);
    }
  }
}

const WORD = /[A-Za-z0-9]/;

function linkify(text, selfKey, seen) {
  let nodes = [{ type: 'text', value: text }];
  let changed = false;
  for (const { phrase, collection, slug, ascii } of DICT) {
    if (selfKey && `${collection}/${slug}` === selfKey) continue;
    if (seen.has(phrase)) continue;
    for (let n = 0; n < nodes.length; n++) {
      const nd = nodes[n];
      if (nd.type !== 'text') continue;
      const idx = nd.value.indexOf(phrase);
      if (idx === -1) continue;
      if (ascii) {
        const prev = nd.value[idx - 1];
        const next = nd.value[idx + phrase.length];
        if ((prev && WORD.test(prev)) || (next && WORD.test(next))) continue;
      }
      const before = nd.value.slice(0, idx);
      const after = nd.value.slice(idx + phrase.length);
      const link = {
        type: 'element',
        tagName: 'a',
        properties: { href: `/${collection}/${slug}/`, className: ['auto-term'] },
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
