/**
 * エンドフィールド公式wiki（SKPORT / wiki.skport.com）の API を読むための共通処理。
 *
 * ★ 分かったこと（2026-09-14 に実際に通信して確かめた）
 *   - API の本体は `https://zonai.skport.com`。
 *   - **ログインは要らない**。`/web/v1/auth/refresh` が誰にでもトークンを返す。
 *   - すべての要求に**署名**が要る。作り方はフロントの JS から読み取った:
 *       s    = パス + (GET なら query 文字列、そうでなければ body)
 *              + timestamp + JSON.stringify({platform, timestamp, dId, vName})
 *       sign = MD5(HmacSHA256(s, token)).toString()
 *   - 言語の指定は `sk-language` ヘッダ。**`ja-jp` ではなく `ja`**。
 *     ここを間違えると `code:0` のまま**中身が空**で返る（気づきにくい）。
 *
 * ★ 使い方
 *     import { get } from './lib/skport.mjs';
 *     const j = await get('/web/v1/wiki/item/catalog', { onlyOnline: 'false' });
 */
import crypto from 'node:crypto';

export const HOST = 'https://zonai.skport.com';
/** 公式wiki の見た目上の入口（記事の出典に使う） */
export const WIKI_URL = 'https://wiki.skport.com/endfield';

let token = '';

/** ログイン不要のトークンを取り直す */
export async function auth(lang = 'ja') {
  const res = await fetch(`${HOST}/web/v1/auth/refresh`, {
    headers: { 'sk-language': lang, platform: '3', vName: '1.0.0' },
  });
  const j = await res.json();
  token = j?.data?.token ?? '';
  if (!token) throw new Error('トークンを取得できませんでした');
  return token;
}

function signHeaders(path, payload, secret) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const head = { platform: '3', timestamp, dId: '', vName: '1.0.0' };
  const s = path + (payload || '') + timestamp + JSON.stringify(head);
  const hmac = crypto.createHmac('sha256', secret).update(s).digest('hex');
  return { ...head, sign: crypto.createHash('md5').update(hmac).digest('hex') };
}

/** GET。401 が返ったらトークンを取り直して1度だけやり直す */
export async function get(path, params = {}, lang = 'ja') {
  if (!token) await auth(lang);
  const qs = new URLSearchParams(params).toString();
  for (let i = 0; i < 3; i++) {
    const headers = { ...signHeaders(path, qs, token), 'sk-language': lang };
    const res = await fetch(HOST + path + (qs ? `?${qs}` : ''), { headers });
    if (res.status === 401) {
      await auth(lang);
      continue;
    }
    const j = await res.json().catch(() => null);
    if (j?.code === 0) return j.data;
    throw new Error(`API エラー ${path}: ${JSON.stringify(j).slice(0, 200)}`);
  }
  throw new Error(`API が通りませんでした: ${path}`);
}

/* ------------------------------------------------------------------ *
 * 記事本文の形式（ブロック文書）を、ふつうの文字列へ直す
 * ------------------------------------------------------------------ */

/** 公式が使っている色名 → こちらでの意味。属性の色づけは記事側の仕組みに任せる */
const COLOR_NOTE = {
  light_function_green: 'green',
  light_function_blue: 'blue',
  light_function_blueness: 'cyan',
  light_function_brown: 'num',
  light_text_primary: '',
  light_text_secondary: '',
  light_text_tertiary: '',
};

/**
 * インライン要素の並び → 文字列。
 * `entry`（素材などの参照）は `{{entry:ID×個数}}` として残し、
 * 呼び出し側で名前に置き換えられるようにする。
 */
function inlineText(elements = [], opts = {}) {
  let out = '';
  for (const e of elements) {
    if (e.kind === 'text') {
      let t = e.text?.text ?? '';
      if (!t) continue;
      if (opts.marks !== false) {
        const color = COLOR_NOTE[e.color] ?? '';
        if (e.bold || color === 'num') t = `**${t}**`;
      }
      out += t;
    } else if (e.kind === 'entry') {
      const c = e.entry?.count && e.entry.count !== '1' ? `×${e.entry.count}` : '';
      out += `{{entry:${e.entry?.id}${c}}}`;
    } else if (e.kind === 'pronunciation') {
      out += e.pronunciation?.text?.text ?? e.pronunciation?.text ?? '';
    } else if (e.kind === 'link') {
      const label = e.link?.text?.text ?? e.link?.title ?? '';
      out += label;
    }
  }
  return out.replace(/\*\*\*\*/g, '');
}

/** 1ブロックを行の配列にする（表は2次元配列として別に返す） */
function blockToLines(doc, id, acc) {
  const b = doc.blockMap?.[id];
  if (!b) return;
  if (b.kind === 'text') {
    const t = inlineText(b.text?.inlineElements);
    const level = b.text?.kind === 'heading2' ? 2 : b.text?.kind === 'heading3' ? 3 : 0;
    if (t) acc.push({ kind: level ? 'heading' : 'p', level, text: t });
    return;
  }
  if (b.kind === 'quote') {
    const inner = [];
    for (const c of b.quote?.childIds ?? []) blockToLines(doc, c, inner);
    const text = inner.map((x) => x.text).filter(Boolean).join(' ');
    if (text) acc.push({ kind: 'quote', text });
    return;
  }
  if (b.kind === 'table') {
    const t = b.table;
    const rows = [];
    for (const r of t.rowIds ?? []) {
      const row = [];
      for (const c of t.columnIds ?? []) {
        const cell = t.cellMap?.[`${r}_${c}`];
        const inner = [];
        for (const cid of cell?.childIds ?? []) blockToLines(doc, cid, inner);
        row.push(inner.map((x) => x.text).filter(Boolean).join(' / '));
      }
      rows.push(row);
    }
    acc.push({ kind: 'table', rows, rowHeader: !!t.rowHeader, colHeader: !!t.colHeader });
    return;
  }
  if (b.kind === 'image') {
    acc.push({ kind: 'image', url: b.image?.url, w: b.image?.width, h: b.image?.height });
    return;
  }
  if (b.kind === 'externalVideo') {
    acc.push({ kind: 'video', url: b.externalVideo?.url });
    return;
  }
  /* horizontalLine などは落とす */
}

/** ブロック文書 → 行の配列 */
export function docToLines(doc) {
  if (!doc || !doc.blockIds) return [];
  const acc = [];
  for (const id of doc.blockIds) blockToLines(doc, id, acc);
  return acc;
}

/** ブロック文書 → 段落だけをつないだ平文 */
export function docToText(doc) {
  return docToLines(doc)
    .filter((l) => l.kind === 'p' || l.kind === 'quote' || l.kind === 'heading')
    .map((l) => l.text)
    .join('\n');
}
