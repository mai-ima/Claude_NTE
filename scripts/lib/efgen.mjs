/**
 * 公式wiki（SKPORT）の材料から記事を書き出すときの、共通の道具。
 * オペレーター・武器・装備…どの分類でも同じ形の材料が来るので、ここにまとめる。
 */
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '../..');
export const DATA = path.join(ROOT, 'scripts/data/endfield-wiki');
export const TODAY = new Date().toISOString().slice(0, 10);
export const WIKI = 'https://wiki.skport.com/endfield';

export const readData = (name) => JSON.parse(fs.readFileSync(path.join(DATA, `${name}.json`), 'utf8'));

/* ------------------------------------------------------------------ *
 * 文字まわり
 * ------------------------------------------------------------------ */

export const q = (s) => `"${String(s).replace(/"/g, '\\"')}"`;

/** 英語名 → 記事の slug。日本語名からは作れないので英語名を使う */
export function slugify(en) {
  return String(en ?? '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** 日本語名の末尾に付くギリシャ文字（強化版の印）→ slug に足す語 */
const GREEK = { α: 'alpha', β: 'beta', γ: 'gamma', δ: 'delta', ε: 'epsilon' };

/**
 * 分類ひとつぶんの「itemId → slug」を作る。
 *
 * **取得スクリプトと生成スクリプトで必ず同じ結果になること**が大事なので、
 * ここ1か所に寄せている（画像のファイル名と記事の slug がずれると絵が出ない）。
 *
 * 決め方
 *   1. 既にある記事の題名と一致すれば、**その記事の slug をそのまま使う**
 *   2. 英語名を slug にする
 *   3. 日本語名の末尾が「…α」「…δ」なら `-alpha` `-delta` を足す
 *      （公式は強化版に同じ英語名を付けていて、そのままだとぶつかる）
 *   4. それでもぶつかるときは `-<itemId>` を足す
 *   5. 英語名が無いものは `item-<itemId>`
 *
 * @param entries `[itemId, { name, en }]` の配列
 * @param known   既にある記事の「題名 → slug」
 */
export function buildSlugMap(entries, known = {}) {
  const out = {};
  const used = new Map(); // slug → itemId
  const byName = new Map(); // 正規化した名前 → slug
  const norm = (m) => String(m.name ?? '').trim().replace(/（[男女]）$/, '');
  /* 既にある記事の slug は先に押さえる（後から来たものに奪わせない） */
  for (const [itemId, meta] of entries) {
    const s = known[norm(meta)];
    if (s && !used.has(s)) { out[itemId] = s; used.set(s, itemId); byName.set(norm(meta), s); }
  }
  for (const [itemId, meta] of entries) {
    if (out[itemId]) continue;
    const name = norm(meta);
    /* **名前が同じものは同じ slug にする**。公式wikiには同名の項目が別々に
       登録されていることがある（例: 白亜・アンゲロミラ が2件）。
       記事は1本にまとめたいので、ここで同じ行き先にしておく。 */
    if (byName.has(name)) { out[itemId] = byName.get(name); continue; }
    const base = slugify(meta.en);
    if (!base) { out[itemId] = `item-${itemId}`; used.set(out[itemId], itemId); byName.set(name, out[itemId]); continue; }
    const greek = GREEK[String(meta.name ?? '').trim().slice(-1)];
    let s = base;
    if (used.has(s) && greek) s = `${base}-${greek}`;
    if (used.has(s)) s = `${base}-${itemId}`;
    out[itemId] = s;
    used.set(s, itemId);
    byName.set(name, s);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 素材の参照と表
 * ------------------------------------------------------------------ */

/** `{{entry:ID×個数}}` を名前に直す関数を作る */
export function entryResolver(index) {
  return (s) =>
    String(s ?? '')
      // 参照が続けて並ぶと名前がくっついて読めないので、あいだに中黒を入れる
      .replace(/\}\}\{\{/g, '}}・{{')
      .replace(/\{\{entry:(\d+)(?:×(\d+))?\}\}/g, (_, id, n) => {
        const name = index.items[id]?.name ?? `#${id}`;
        if (!n || n === '0') return name;
        return `${name}×${Number(n).toLocaleString('en-US')}`;
      });
}

/**
 * 行の配列 → Markdown の表
 *
 * `mergeUnlabeled` … 見出しの無い列を、左どなりの列へ括弧つきで畳む。
 *   公式の武器の表は「値」と「段階（1/3）」を別の列に分けていて、
 *   そのままだと見出しの無い列が並んでしまう。
 */
export function mdTable(rows, resolve, { dropEmptyFirstColumn = true, mergeUnlabeled = false } = {}) {
  if (!rows?.length) return '';
  const cell = (s) => resolve(s).replace(/\|/g, '\\|').replace(/\n+/g, ' / ').trim();
  let body = rows.map((r) => r.map(cell));
  if (dropEmptyFirstColumn && body.every((r) => !r[0])) body = body.map((r) => r.slice(1));
  /* 中身が全部空の列は落とす（公式の表には飾りの空列がある） */
  let width = Math.max(...body.map((r) => r.length));
  body = body.map((r) => [...r, ...Array(width - r.length).fill('')]);

  if (mergeUnlabeled && body.length > 1) {
    for (let c = width - 1; c >= 1; c -= 1) {
      if (body[0][c]) continue; // 見出しがある列はそのまま
      for (let r = 1; r < body.length; r += 1) {
        if (!body[r][c]) continue;
        body[r][c - 1] = body[r][c - 1] ? `${body[r][c - 1]}（${body[r][c]}）` : body[r][c];
      }
      body = body.map((r) => r.filter((_, i) => i !== c));
    }
    width = body[0].length;
  }
  const keep = [];
  for (let c = 0; c < width; c += 1) if (body.some((r) => r[c])) keep.push(c);
  body = body.map((r) => keep.map((c) => r[c]));
  if (!body.length || !body[0].length) return '';
  const head = body[0];
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...body.slice(1).map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');
}

/** 蒸留した行の配列 → Markdown */
export function linesToMd(lines, resolve, headingLevel = '###') {
  const out = [];
  for (let i = 0; i < (lines ?? []).length; i += 1) {
    const l = lines[i];
    if (l.kind === 'heading') {
      const next = lines[i + 1];
      const label = l.text.replace(/\*\*/g, '').trim();
      if (next?.kind === 'quote') {
        out.push(`${headingLevel} ${label}（${next.text.replace(/\*\*/g, '').trim()}）`);
        i += 1;
      } else out.push(`${headingLevel} ${label}`);
      continue;
    }
    if (l.kind === 'quote') { out.push(`> ${resolve(l.text)}`); continue; }
    if (l.kind === 'p') { out.push(resolve(l.text)); continue; }
    if (l.kind === 'table') {
      /* 公式の `rowHeader` は「1行目が見出しか」。false のまま Markdown にすると
         1行目（＝ふつうのデータ）が見出しに化ける。2列の縦並びの表がこれに当たるので、
         そのときだけ「項目／内容」の見出しを足す。 */
      const cols = Math.max(...l.rows.map((r) => r.length));
      const needHead = l.rowHeader === false && cols === 2;
      out.push(mdTable(needHead ? [['項目', '内容'], ...l.rows] : l.rows, resolve, {
        dropEmptyFirstColumn: !needHead,
      }));
      continue;
    }
  }
  return out.filter(Boolean).join('\n\n');
}

/** 章／ブロックを名前で引く */
export const blockOf = (item, chapter, title) =>
  item.chapters.find((c) => c.title.trim() === chapter)?.blocks.find((b) => b.title === title);

/* ------------------------------------------------------------------ *
 * 既存の記事を読む（手で書いたものを消さないため）
 * ------------------------------------------------------------------ */

/** ごく簡易な frontmatter パーサ（このリポジトリの書式に限定） */
export function parseFront(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { front: {}, sources: [], sections: {} };
  const front = {};
  const sources = [];
  let key = null;
  let cur = null;
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      cur = null;
      const v = kv[2].trim();
      if (v === '') front[key] = [];
      else if (v.startsWith('[')) {
        front[key] = v.replace(/^\[|\]$/g, '').split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      } else front[key] = v.replace(/^["']|["']$/g, '');
      continue;
    }
    if (key === 'sources') {
      const lab = line.match(/^\s*-\s*label:\s*"?(.*?)"?\s*$/);
      if (lab) { cur = { label: lab[1], url: '' }; sources.push(cur); continue; }
      const url = line.match(/^\s*url:\s*"?(.*?)"?\s*$/);
      if (url && cur) cur.url = url[1];
      continue;
    }
    if (key && /^\s*-\s/.test(line)) {
      if (!Array.isArray(front[key])) front[key] = [];
      front[key].push(line.replace(/^\s*-\s*/, ''));
    }
  }
  const body = raw.slice(m[0].length);
  const sections = {};
  let title = null;
  let buf = [];
  for (const line of body.split('\n')) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      if (title) sections[title] = buf.join('\n').trim();
      title = h[1].trim();
      buf = [];
    } else if (title) buf.push(line);
  }
  if (title) sections[title] = buf.join('\n').trim();
  return { front, sources: sources.filter((s) => s.url), sections };
}

/** ディレクトリの中から「title → slug」を作る（既にある記事の slug を使い続けるため） */
export function slugByTitle(dir) {
  const map = {};
  if (!fs.existsSync(dir)) return map;
  for (const f of fs.readdirSync(dir)) {
    if (!/\.mdx?$/.test(f)) continue;
    const { front } = parseFront(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (front.title) map[front.title] = f.replace(/\.mdx?$/, '');
  }
  return map;
}

/** 出典を重複なく積む */
export function mergeSources(...lists) {
  const out = [];
  for (const list of lists) {
    for (const s of list ?? []) {
      if (s?.url && !out.some((x) => x.url === s.url)) out.push(s);
    }
  }
  return out;
}

/** frontmatter の行の配列 → YAML */
export function frontMatter(pairs, sources) {
  const lines = [];
  for (const [k, v] of pairs) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      lines.push(`${k}: [${v.map(q).join(', ')}]`);
    } else if (typeof v === 'boolean' || typeof v === 'number') {
      lines.push(`${k}: ${v}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${q(v)}`);
    }
  }
  lines.push('sources:');
  for (const s of sources) lines.push(`  - label: ${q(s.label)}\n    url: ${q(s.url)}`);
  return lines.join('\n');
}
