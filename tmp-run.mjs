import { get } from './scripts/lib/skport.mjs';
for (const lang of ['en', 'en-us']) {
  try {
    const d = await get('/web/v1/wiki/item/catalog', { typeMainId: '1', typeSubId: '2' }, lang);
    const items = d.catalog?.[0]?.typeSub?.[0]?.items ?? [];
    console.log(lang, '→', items.length, '件', items.slice(0, 6).map((x) => `${x.itemId}:${x.name}`).join(' / '));
  } catch (e) { console.log(lang, 'ERR', e.message.slice(0, 120)); }
}
