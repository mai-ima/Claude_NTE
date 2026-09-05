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

/**
 * 自動リンクの対象を **wiki ごと**に定義する。
 * 辞書は wiki 単位で作られ、記事にはその記事が属する wiki の辞書だけが適用される。
 * （NTE の記事に αテストの用語が、αテストの記事に NTE の用語が混ざらない）
 *
 * `dir` は src/content 配下のディレクトリ名、`base` は URL のベース。
 * src/lib/nav.ts の SECTIONS / ALPHA_SECTIONS と対応させること。
 */
const WIKI_GROUPS = [
  {
    id: 'nte',
    collections: [
      { dir: 'terms', base: '/terms/' },
      { dir: 'characters', base: '/characters/' },
      { dir: 'people', base: '/people/' },
      { dir: 'shops', base: '/shops/' },
      { dir: 'locations', base: '/locations/' },
      { dir: 'arcs', base: '/arcs/' },
      { dir: 'systems', base: '/systems/' },
      { dir: 'enemies', base: '/enemies/' },
      { dir: 'items', base: '/items/' },
      { dir: 'vehicles', base: '/vehicles/' },
      { dir: 'events', base: '/events/' },
    ],
  },
  {
    id: 'alpha',
    collections: [
      { dir: 'alpha-terms', base: '/alpha/terms/' },
      { dir: 'alpha-characters', base: '/alpha/characters/' },
      { dir: 'alpha-systems', base: '/alpha/systems/' },
      { dir: 'alpha-guides', base: '/alpha/guides/' },
    ],
  },
];

/** ディレクトリ名 → wiki id（記事がどの辞書を使うかの判定に使う） */
const DIR_TO_WIKI = new Map();
for (const g of WIKI_GROUPS) for (const c of g.collections) DIR_TO_WIKI.set(c.dir, g.id);

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

function buildDict(group) {
  const entries = [];
  for (const { dir: dirName, base } of group.collections) {
    const dir = path.join(CONTENT_DIR, dirName);
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
        entries.push({ phrase: p, dir: dirName, base, slug, ascii });
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

/** wiki id → 辞書（ビルド中に一度だけ構築） */
const DICTS = new Map();

function dictFor(wikiId) {
  if (!DICTS.has(wikiId)) {
    const group = WIKI_GROUPS.find((g) => g.id === wikiId) ?? WIKI_GROUPS[0];
    DICTS.set(wikiId, buildDict(group));
  }
  return DICTS.get(wikiId);
}

export default function rehypeTermLinks() {
  return (tree, file) => {
    const fpath = (file && (file.path || (file.history && file.history[0]))) || '';
    const m = /[\\/]content[\\/]([a-z0-9-]+)[\\/]([a-z0-9-]+)\.(md|mdx)$/.exec(fpath);
    if (!m) return;
    // 記事の属する wiki の辞書だけを適用する（wiki 間で用語が混ざらない）
    const dict = dictFor(DIR_TO_WIKI.get(m[1]) ?? 'nte');
    if (!dict.length) return;
    const selfKey = `${m[1]}/${m[2]}`;
    const seen = new Set();
    walk(tree, false, selfKey, dict, seen);
  };
}

/** ノードのタグ名（標準hastは tagName、MDX JSX は name） */
function tagOf(node) {
  return node.type === 'element' ? node.tagName : node.name || '';
}

function walk(node, skip, selfKey, dict, seen) {
  if (!node || !Array.isArray(node.children)) return;
  const tag = tagOf(node);
  const here = skip || (tag && SKIP_TAGS.has(tag));
  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 'text' && !here && child.value && child.value.trim()) {
      const replaced = linkify(child.value, selfKey, dict, seen);
      if (replaced) {
        children.splice(i, 1, ...replaced);
        i += replaced.length - 1;
      }
    } else if (Array.isArray(child.children)) {
      walk(child, here, selfKey, dict, seen);
    }
  }
}

const WORD = /[A-Za-z0-9]/;

function linkify(text, selfKey, dict, seen) {
  let nodes = [{ type: 'text', value: text }];
  let changed = false;
  for (const { phrase, dir, base, slug, ascii } of dict) {
    if (selfKey && `${dir}/${slug}` === selfKey) continue;
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
        properties: { href: `${base}${slug}/`, className: ['auto-term'] },
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
