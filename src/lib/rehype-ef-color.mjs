/**
 * rehype プラグイン: エンドフィールドの記事で、**属性の名前を属性の色**にする。
 *
 * ★ なぜ作るか（利用者の指示 2026-09-13「公式とゲーム内UIを完全再現して」）
 *   公式wikiのスキル説明は、本文の中で
 *     「敵に**自然ダメージ**（緑）を与える。…ブレイク値**17**（オレンジ）」
 *   のように、**属性の名前をその属性の色**、**数値をオレンジ**にしている。
 *   読み物としての密度が上がるので、同じ扱いにする。
 *
 * ★ 何をするか
 *   - `灼熱／寒冷／電磁／自然／物理` の直後に `ダメージ` が続く箇所を
 *     `<span class="ef-el" data-el="fire">…</span>` で包む。
 *   - 色は `src/lib/endfield.ts` の実測値（公式のアイコン画像から拾った地の色）。
 *
 * ★ 何をしないか
 *   - **属性名だけ**の箇所（「自然属性のオペレーター」など）は**触らない**。
 *     本文のあちこちが色づくと、かえって読みにくいため。
 *   - **数値には触らない**。どの数値を強調すべきかは文脈によるので、
 *     記事を書くときに `**17**` のように書き手が決める。
 *   - 既存のリンク・コード・見出しの中は触らない（自動リンクと同じ約束）。
 *
 * ★ 効く範囲
 *   `src/content/endfield-*` の記事だけ。ファイルのパスで判定する。
 */

/** 属性の名前 → キーと色（`src/lib/endfield.ts` と同じ値。あちらは TS なのでここに写す） */
const ELEMENTS = [
  { label: '灼熱', key: 'fire', hue: '#fe633c' },
  { label: '寒冷', key: 'ice', hue: '#20c7d1' },
  { label: '電磁', key: 'electric', hue: '#d79a00' },
  { label: '自然', key: 'nature', hue: '#6f9c1f' },
  { label: '物理', key: 'physic', hue: '#444444' },
];

/* 「自然ダメージ」のように、属性名＋ダメージ の並びだけを拾う */
const RE = new RegExp(`(${ELEMENTS.map((e) => e.label).join('|')})ダメージ`, 'g');

const SKIP = new Set(['a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'script', 'style']);

export default function rehypeEfColor() {
  return (tree, file) => {
    const p = String(file?.history?.[0] ?? file?.path ?? '');
    // エンドフィールドの記事だけに効かせる
    if (!/[\\/]src[\\/]content[\\/]endfield-/.test(p)) return;

    const walk = (node) => {
      if (!node || !Array.isArray(node.children)) return;
      const out = [];
      for (const child of node.children) {
        if (child.type === 'element') {
          if (!SKIP.has(child.tagName)) walk(child);
          out.push(child);
          continue;
        }
        if (child.type !== 'text' || !RE.test(child.value)) {
          out.push(child);
          continue;
        }
        RE.lastIndex = 0;
        let last = 0;
        let m;
        while ((m = RE.exec(child.value))) {
          if (m.index > last) out.push({ type: 'text', value: child.value.slice(last, m.index) });
          const el = ELEMENTS.find((e) => e.label === m[1]);
          out.push({
            type: 'element',
            tagName: 'span',
            properties: {
              className: ['ef-el'],
              'data-el': el.key,
              style: `--ef-el:${el.hue}`,
            },
            children: [{ type: 'text', value: m[0] }],
          });
          last = m.index + m[0].length;
        }
        if (last < child.value.length) out.push({ type: 'text', value: child.value.slice(last) });
      }
      node.children = out;
    };
    walk(tree);
  };
}
