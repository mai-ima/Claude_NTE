# IMAGE-SOURCES.md — 同梱している画像の出どころ（1枚ずつ）

> **このファイルは台帳**。`public/images/official/` に置いた画像を1枚ずつ記録する。
> どこから来たのか分からない画像を1枚でも増やさないために、足すたびにここへ書く。

## 決まり（利用者の指示 2026-09-13）

- **公式にあるものは公式から**。攻略wikiの画像は公式に無いものだけ（`public/images/from-wiki/`）
- **日本国内版を優先**。海外版もやむを得ない場合は可だが、**日本語以外の言語が写り込んだ画像は使わない**
- 権利は各ゲームの運営元にある。本サイトは非公式のファンサイト。
  **権利者から削除の求めがあれば速やかに外す**（→ `/legal/copyright/`）
- 取り直しは `node scripts/fetch-official-images.mjs`（URL 一覧はスクリプトと記事の frontmatter が持つ）

## 目視で確かめたこと（2026-09-13）

- NTE 17枚・エンドフィールド 44枚を**1枚ずつ表示して確認**した。
  **日本語以外の言語の文字は写っていない**（NTE は背景に英字ロゴ、エンドフィールドは人物のみ）。
- 寸法: NTE は 750×836（縦長のポスター）／エンドフィールドは 303×386 前後（顔のアップ）／
  職業アイコン 139×139・属性アイコン 120×120。
- 容量: WebP（品質82）へ変換して **NTE 3.2MB → 1.4MB**、エンドフィールドは 44枚で約 1.1MB。

---

## NTE（`public/images/official/nte/characters/`）

出どころはすべて**日本語版の公式サイト** `nte.perfectworld.com/jp/`。
記事の frontmatter `officialImage` と同じ URL。

| ファイル | キャラ | 出どころ | 容量 | 取得日 |
| --- | --- | --- | --- | --- |
| `baicang.webp` | 白蔵（ばいざん） | [公式サイト](https://nte.perfectworld.com/public/m/images/main260402/role-poster-baicang.png) | 112KB | 2026-09-13 |
| `chaos.webp` | カオス | [公式サイト](https://nte.perfectworld.com/public/m/images/main260618/role-poster-ka.png) | 59KB | 2026-09-13 |
| `chiz.webp` | ちぃちゃん | [公式サイト](https://nte.perfectworld.com/public/m/images/main260402/role-poster-xiaozhi.png) | 85KB | 2026-09-13 |
| `daffodill.webp` | ダフォディール | [公式サイト](https://nte.perfectworld.com/public/m/images/main260402/role-poster-dfde.png) | 58KB | 2026-09-13 |
| `fadia.webp` | ファルディーヤ | [公式サイト](https://nte.perfectworld.com/public/m/images/main260402/role-poster-fadiya.png) | 86KB | 2026-09-13 |
| `hathor.webp` | ハソール | [公式サイト](https://nte.perfectworld.com/public/m/images/main260402/role-poster-hasuoer.png) | 104KB | 2026-09-13 |
| `hotori.webp` | 潯（ほとり） | [公式サイト](https://nte.perfectworld.com/public/m/images/main260513/role-poster-xun.png) | 96KB | 2026-09-13 |
| `irohi.webp` | イロヒ | [公式サイト](https://nte.perfectworld.com/public/m/images/main260729/role-poster-yi.png) | 91KB | 2026-09-13 |
| `jiuyuan.webp` | 九原（じょえん） | [公式サイト](https://nte.perfectworld.com/public/m/images/main260402/role-poster-jiuyuan.png) | 78KB | 2026-09-13 |
| `lacrimosa.webp` | レクイエム | [公式サイト](https://nte.perfectworld.com/public/m/images/main260603/role-poster-an.png) | 81KB | 2026-09-13 |
| `mint.webp` | ミント | [公式サイト](https://nte.perfectworld.com/public/m/images/main260402/role-poster-mint.png) | 77KB | 2026-09-13 |
| `nanally.webp` | ナナリ | [公式サイト](https://nte.perfectworld.com/public/m/images/main260402/role-poster-nanally.png) | 107KB | 2026-09-13 |
| `rinko.webp` | リンコ | [公式サイト](https://nte.perfectworld.com/public/m/images/main260909/role-poster-lingke.png) | 95KB | 2026-09-13 |
| `sakiri.webp` | 早霧（さきり） | [公式サイト](https://nte.perfectworld.com/public/m/images/main260402/role-poster-zaowu.png) | 92KB | 2026-09-13 |
| `shinku.webp` | 真紅（しんく） | [公式サイト](https://nte.perfectworld.com/public/m/images/main260708/role-poster-zhen.png) | 66KB | 2026-09-13 |
| `zanko.webp` | 残虹（ざんこう） | [公式サイト](https://nte.perfectworld.com/public/m/images/main260819/role-poster-canhong.png) | 73KB | 2026-09-13 |
| `zero.webp` | 零（ゼロ） | [公式サイト](https://nte.perfectworld.com/public/m/images/main260402/role-poster-zero-male.png) | 61KB | 2026-09-13 |

## アークナイツ：エンドフィールド（`public/images/official/endfield/`）

出どころはすべて**日本語版の公式サイト** `endfield.gryphline.com/ja-jp/`（配信 CDN は `web-static.hg-cdn.com`）。

### オペレーター（`operators/`）

| ファイル | オペレーター | 出どころ | 容量 | 取得日 |
| --- | --- | --- | --- | --- |
| `akekuri.webp` | アケクリ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/akekuri.3603d013.png) | 34KB | 2026-09-13 |
| `alesh.webp` | アレッシュ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/alesh.d7f457d2.png) | 35KB | 2026-09-13 |
| `antal.webp` | アンタル | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/antal.763c87e4.png) | 27KB | 2026-09-13 |
| `arcane.webp` | オクギ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/lizhiyan.7ada7b83.png) | 40KB | 2026-09-13 |
| `arclight.webp` | アークライト | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/arclight.e31580d7.png) | 30KB | 2026-09-13 |
| `ardelia.webp` | アルデリア | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/ardelia.565c75af.png) | 39KB | 2026-09-13 |
| `avywenna.webp` | アイビーエナ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/avywenna.2a592659.png) | 32KB | 2026-09-13 |
| `camille.webp` | カミーユ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/camille.a26b2443.png) | 30KB | 2026-09-13 |
| `catcher.webp` | キャッチャー | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/catcher.bc6bcfaa.png) | 26KB | 2026-09-13 |
| `chen-qianyu.webp` | チェン・センユー | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/chen.b0afd1ba.png) | 33KB | 2026-09-13 |
| `da-pan.webp` | ダパン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/dapan.7cdb6a4e.png) | 20KB | 2026-09-13 |
| `ember.webp` | エンバー | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/ember.6391acf9.png) | 39KB | 2026-09-13 |
| `endministrator.webp` | 管理人 | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/endministrator1.c391b13d.png) | 30KB | 2026-09-13 |
| `endministrator-2.webp` | 管理人 | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/endministrator2.5ccb44a8.png) | 32KB | 2026-09-13 |
| `estella.webp` | エステーラ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/estella.38c423af.png) | 22KB | 2026-09-13 |
| `fluorite.webp` | フローライト | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/fluorite.5a8add29.png) | 30KB | 2026-09-13 |
| `gilberta.webp` | ギルベルタ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/gilberta.724f3503.png) | 42KB | 2026-09-13 |
| `laevatain.webp` | レーヴァテイン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/laevatain.edd103d4.png) | 37KB | 2026-09-13 |
| `last-rite.webp` | ラストライト | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/lastrite.3860f541.png) | 46KB | 2026-09-13 |
| `lifeng.webp` | リーフォン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/lifeng.ef41bc3a.png) | 30KB | 2026-09-13 |
| `liino.webp` | リーノ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/liino.8d027d2a.png) | 47KB | 2026-09-13 |
| `mi-fu.webp` | ミ・フ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/mifu.e1d79970.png) | 44KB | 2026-09-13 |
| `perlica.webp` | ペリカ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/prelica.d0bbdb53.png) | 35KB | 2026-09-13 |
| `pochiena.webp` | プチエナ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/purrche.d6659019.png) | 26KB | 2026-09-13 |
| `pogranichnik.webp` | ポグラニチニク | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/pogranichnik.80f2ddbb.png) | 36KB | 2026-09-13 |
| `rossi.webp` | ロッシ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/rossi.c58b721b.png) | 35KB | 2026-09-13 |
| `snowshine.webp` | スノーシャイン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/snowshine.bb2c0bdc.png) | 29KB | 2026-09-13 |
| `tangtang.webp` | タンタン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/tangtang.b5cd99e9.png) | 33KB | 2026-09-13 |
| `typhoeus.webp` | ティフォロス | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/typhoea.87cfb4cd.png) | 44KB | 2026-09-13 |
| `wulfgard.webp` | ウルフガード | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/wulfgard.609a252f.png) | 30KB | 2026-09-13 |
| `xaihi.webp` | ザイヒ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/xaihi.9ba3eb36.png) | 39KB | 2026-09-13 |
| `yvonne.webp` | イヴォンヌ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/yvonne.9695c304.png) | 39KB | 2026-09-13 |
| `zhuang-fangyi.webp` | ゾアン・ファンイ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/zhuangfy.50a608b8.png) | 36KB | 2026-09-13 |

### 立ち絵（`illust/`）

**全身のイラスト**。公式サイトのオペレーター個別表示（CSS の
`.__02-Operator_illustration__…[data-key=…]`）が使っている絵で、
一覧の顔アップ（`operators/`）とは**別のファイル**。

原寸は 1800px 前後・1枚あたり最大 13MB（ティフォロスで実測 12.9MB）あるため、
**幅900に縮めて WebP** にしてから同梱している（33枚で約 6.7MB）。
ファイル名は記事のIDに合わせてある（公式のキーとは違うものがある。例: `typhoea` → `typhoeus`）。

| ファイル | オペレーター | 出どころ | 容量 | 取得日 |
| --- | --- | --- | --- | --- |
| `akekuri.webp` | アケクリ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/akekuri.751608ae.png) | 161KB | 2026-09-13 |
| `alesh.webp` | アレッシュ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/alesh.bfe6a583.png) | 221KB | 2026-09-13 |
| `antal.webp` | アンタル | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/antal.5a3548af.png) | 198KB | 2026-09-13 |
| `arcane.webp` | オクギ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/lizhiyan.5e6e07c8.png) | 199KB | 2026-09-13 |
| `arclight.webp` | アークライト | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/arclight.e46ed671.png) | 133KB | 2026-09-13 |
| `ardelia.webp` | アルデリア | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/ardelia.36d836c7.png) | 202KB | 2026-09-13 |
| `avywenna.webp` | アイビーエナ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/avywenna.3346feee.png) | 175KB | 2026-09-13 |
| `camille.webp` | カミーユ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/camille.81d81ef7.png) | 175KB | 2026-09-13 |
| `catcher.webp` | キャッチャー | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/catcher.d4e72ab0.png) | 163KB | 2026-09-13 |
| `chen-qianyu.webp` | チェン・センユー | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/chen.2a091fd4.png) | 212KB | 2026-09-13 |
| `da-pan.webp` | ダパン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/dapan.8a1d195a.png) | 176KB | 2026-09-13 |
| `ember.webp` | エンバー | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/ember.9364370e.png) | 167KB | 2026-09-13 |
| `endministrator.webp` | 管理人 | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/endministrator1.ec409283.png) | 201KB | 2026-09-13 |
| `endministrator-2.webp` | 管理人 | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/endministrator2.1ec20a16.png) | 194KB | 2026-09-13 |
| `estella.webp` | エステーラ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/estella.0c009bcd.png) | 222KB | 2026-09-13 |
| `fluorite.webp` | フローライト | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/fluorite.cf452cf1.png) | 162KB | 2026-09-13 |
| `gilberta.webp` | ギルベルタ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/gilberta.92aa17d4.png) | 228KB | 2026-09-13 |
| `laevatain.webp` | レーヴァテイン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/laevatain.d0ca2837.png) | 348KB | 2026-09-13 |
| `last-rite.webp` | ラストライト | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/lastrite.4a02d8bb.png) | 218KB | 2026-09-13 |
| `lifeng.webp` | リーフォン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/lifeng.7253579c.png) | 243KB | 2026-09-13 |
| `liino.webp` | リーノ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/liino.f5676406.png) | 282KB | 2026-09-13 |
| `mi-fu.webp` | ミ・フ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/mifu.7b3a74cf.png) | 210KB | 2026-09-13 |
| `perlica.webp` | ペリカ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/perlica.6710bc97.png) | 153KB | 2026-09-13 |
| `pochiena.webp` | プチエナ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/purrche.bdb051d3.png) | 225KB | 2026-09-13 |
| `pogranichnik.webp` | ポグラニチニク | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/pogranichnik.6983f122.png) | 155KB | 2026-09-13 |
| `rossi.webp` | ロッシ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/rossi.b7ae95b5.png) | 190KB | 2026-09-13 |
| `snowshine.webp` | スノーシャイン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/snowshine.1f6d3a0e.png) | 225KB | 2026-09-13 |
| `tangtang.webp` | タンタン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/tangtang.2602b587.png) | 213KB | 2026-09-13 |
| `typhoeus.webp` | ティフォロス | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/typhoea.c4a79f82.png) | 204KB | 2026-09-13 |
| `wulfgard.webp` | ウルフガード | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/wulfgard.53a6686b.png) | 162KB | 2026-09-13 |
| `xaihi.webp` | ザイヒ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/xaihi.43d608d9.png) | 250KB | 2026-09-13 |
| `yvonne.webp` | イヴォンヌ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/yvonne.a74396e6.png) | 211KB | 2026-09-13 |
| `zhuang-fangyi.webp` | ゾアン・ファンイ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/zhuangfy.c6750f9c.png) | 263KB | 2026-09-13 |

### 職業・属性のアイコン（`classes/` / `elements/`）

公式サイトの CSS（`_next/static/media/`）で `[data-key]` ごとに指定されているもの。
職業は黒地に白の記号、属性は色地に白の記号。**文字はどれにも入っていない**。

> **確認済み（2026-09-13）**: 公式サイトの絞り込み（職業のドロップダウン）に
> `data-key` と日本語ラベルが対で入っていた。`guard=前衛 / caster=術師 / support=補助 /
> shielder=重装 / vanguard=先鋒 / assault=突撃`。属性も同じ作りで
> `fire=灼熱 / ice=寒冷 / electric=電磁 / nature=自然 / physic=物理`。
> 割り当ては合っている（→ `src/lib/endfield.ts`）。

| ファイル | 種類 | 出どころ | 容量 | 取得日 |
| --- | --- | --- | --- | --- |
| `classes/assault.webp` | 職業アイコン | 公式サイトの CSS から | 1KB | 2026-09-13 |
| `classes/caster.webp` | 職業アイコン | 公式サイトの CSS から | 1KB | 2026-09-13 |
| `classes/guard.webp` | 職業アイコン | 公式サイトの CSS から | 1KB | 2026-09-13 |
| `classes/shielder.webp` | 職業アイコン | 公式サイトの CSS から | 2KB | 2026-09-13 |
| `classes/support.webp` | 職業アイコン | 公式サイトの CSS から | 1KB | 2026-09-13 |
| `classes/vanguard.webp` | 職業アイコン | 公式サイトの CSS から | 2KB | 2026-09-13 |
| `elements/electric.webp` | 属性アイコン | 公式サイトの CSS から | 1KB | 2026-09-13 |
| `elements/fire.webp` | 属性アイコン | 公式サイトの CSS から | 1KB | 2026-09-13 |
| `elements/ice.webp` | 属性アイコン | 公式サイトの CSS から | 1KB | 2026-09-13 |
| `elements/nature.webp` | 属性アイコン | 公式サイトの CSS から | 1KB | 2026-09-13 |
| `elements/physic.webp` | 属性アイコン | 公式サイトの CSS から | 1KB | 2026-09-13 |

---

## 攻略wiki由来（`public/images/from-wiki/`）

**公式サイトに無いものだけ**。NTE の公式サイト（`nte.perfectworld.com/jp/`）の画像を
2026-09-13 に全部洗ったところ、置いてあるのは**キャラのポスター・名前ロゴ・世界観の写真・
スライド・お知らせのバナーだけ**で、弧盤やアイテムの絵は1枚も無かった。そこだけを wiki で埋める。

出どころ: **Game8 のNTE攻略wiki**「弧盤一覧」（<https://game8.jp/nte/782300>）。取得日 2026-09-13。
画像は 220×220（`…/thumb`。これが最大）。

**名前が一覧と完全に一致するものだけ**を持ってきた。食い違うものは入れていない
（→ `scripts/data/nte-wiki-images.json` の `_meta.保留`）。

| ファイル | 弧盤 | ランク | 形態（一覧の表記） |
| --- | --- | --- | --- |
| `arcs/eternal-waltz.webp` | 永遠のワルツ | S | 集合 |
| `arcs/flame-soul-hurricane.webp` | 炎魂ハリケーン | S | プラズマ |
| `arcs/frenzy-vortex.webp` | 熱狂の渦 | S | 固体 |
| `arcs/galaxy-afterimage.webp` | 銀河の残像 | S | プラズマ |
| `arcs/ora-ora.webp` | オラオラ！ | A | プラズマ |
| `arcs/prepare.webp` | プリペア | S | プラズマ |
| `arcs/reality-shelter.webp` | 現実の避難所 | S | 固体 |
| `arcs/tears-under-mask.webp` | 仮面の下の涙 | S | 気体 |
| `arcs/whale-song.webp` | 鯨の歌 | S | プラズマ |

9枚とも目視で確認した。弧盤（レコード盤のような装置）のアイコンで、**文字は入っていない**。

> **決着（2026-09-13）**: ゲームウィズの弧盤一覧（50種）と突き合わせて解決した。
> - 物質形態は**2サイトが一致した9本を確定**（`verified`）、Game8 だけの1本は下書きのまま。
> - 「執行の青春妄想」は**こちらの誤り**。2サイトとも「**漆黒の青春妄想**」だったので直した。
> - 「ラスト・ローズ」は Game8 の「ラストローズ」と同じもの（S・液体で一致）。
>   「最後のバラ」は**別の弧盤**で、こちらには記事が無い。
> - 「アストロ・コーラー」「喰心刃」はゲームウィズにあり、こちらの値と一致した。
> - **形態の呼び方はサイトで違う**: ゲームエイト「固体・液体・集合」＝ゲームウィズ
>   「ソリッド・リキッド・重合体」。気体とプラズマは共通。こちらは前者を使う。

---

## まだ入れていないもの

| 何 | なぜ | どうする |
| --- | --- | --- |
| NTE のキャラ8人ぶん | 公式サイトにポスターが無い（未実装・旧版のキャラ） | 国内大手wikiで探す（`from-wiki/`） |
| 弧盤4本（上の「保留」） | 名前が食い違う・一覧に無い | 名前を確かめてから入れる |
| アイテム・敵・場所 | 公式サイトに個別画像が無い | 弧盤と同じやり方で攻略wikiから |
| ゲームロゴ | 使うと公式サイトと紛らわしい | 使うかどうかを決めてから |
