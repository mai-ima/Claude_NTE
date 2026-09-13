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
| `arclight.webp` | アークライト | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/arclight.e31580d7.png) | 30KB | 2026-09-13 |
| `ardelia.webp` | アルデリア | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/ardelia.565c75af.png) | 39KB | 2026-09-13 |
| `avywenna.webp` | アイビーエナ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/avywenna.2a592659.png) | 32KB | 2026-09-13 |
| `camille.webp` | カミーユ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/camille.a26b2443.png) | 30KB | 2026-09-13 |
| `catcher.webp` | キャッチャー | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/catcher.bc6bcfaa.png) | 26KB | 2026-09-13 |
| `chen.webp` | チェン・センユー | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/chen.b0afd1ba.png) | 33KB | 2026-09-13 |
| `dapan.webp` | ダパン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/dapan.7cdb6a4e.png) | 20KB | 2026-09-13 |
| `ember.webp` | エンバー | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/ember.6391acf9.png) | 39KB | 2026-09-13 |
| `endministrator1.webp` | 管理人 | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/endministrator1.c391b13d.png) | 32KB | 2026-09-13 |
| `endministrator2.webp` | 管理人 | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/endministrator2.5ccb44a8.png) | 30KB | 2026-09-13 |
| `estella.webp` | エステーラ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/estella.38c423af.png) | 22KB | 2026-09-13 |
| `fluorite.webp` | フローライト | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/fluorite.5a8add29.png) | 30KB | 2026-09-13 |
| `gilberta.webp` | ギルベルタ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/gilberta.724f3503.png) | 42KB | 2026-09-13 |
| `laevatain.webp` | レーヴァテイン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/laevatain.edd103d4.png) | 37KB | 2026-09-13 |
| `lastrite.webp` | ラストライト | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/lastrite.3860f541.png) | 46KB | 2026-09-13 |
| `lifeng.webp` | リーフォン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/lifeng.ef41bc3a.png) | 30KB | 2026-09-13 |
| `liino.webp` | リーノ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/liino.8d027d2a.png) | 47KB | 2026-09-13 |
| `lizhiyan.webp` | オクギ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/lizhiyan.7ada7b83.png) | 40KB | 2026-09-13 |
| `mifu.webp` | ミ・フ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/mifu.e1d79970.png) | 44KB | 2026-09-13 |
| `perlica.webp` | ペリカ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/prelica.d0bbdb53.png) | 35KB | 2026-09-13 |
| `pogranichnik.webp` | ポグラニチニク | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/pogranichnik.80f2ddbb.png) | 36KB | 2026-09-13 |
| `purrche.webp` | プチエナ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/purrche.d6659019.png) | 26KB | 2026-09-13 |
| `rossi.webp` | ロッシ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/rossi.c58b721b.png) | 35KB | 2026-09-13 |
| `snowshine.webp` | スノーシャイン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/snowshine.bb2c0bdc.png) | 29KB | 2026-09-13 |
| `tangtang.webp` | タンタン | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/tangtang.b5cd99e9.png) | 33KB | 2026-09-13 |
| `typhoea.webp` | ティフォロス | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/typhoea.87cfb4cd.png) | 44KB | 2026-09-13 |
| `wulfgard.webp` | ウルフガード | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/wulfgard.609a252f.png) | 30KB | 2026-09-13 |
| `xaihi.webp` | ザイヒ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/xaihi.9ba3eb36.png) | 39KB | 2026-09-13 |
| `yvonne.webp` | イヴォンヌ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/yvonne.9695c304.png) | 39KB | 2026-09-13 |
| `zhuangfy.webp` | ゾアン・ファンイ | [公式サイト](https://web-static.hg-cdn.com/endfield/official-v4/_next/static/media/zhuangfy.50a608b8.png) | 36KB | 2026-09-13 |

### 職業・属性のアイコン（`classes/` / `elements/`）

公式サイトの CSS（`_next/static/media/`）で `[data-key]` ごとに指定されているもの。
職業は黒地に白の記号、属性は色地に白の記号。**文字はどれにも入っていない**。

> **要確認**: `classes/support.webp` だけ、記号が他の5つ（星・杖・剣・盾・爪痕）と系統が違って見える。
> 公式サイトで職業ごとの表示を実際に開いて、割り当てが合っているか確かめること（段階5）。

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

## まだ入れていないもの

| 何 | なぜ | どうする |
| --- | --- | --- |
| NTE のキャラ8人ぶん | 公式サイトにポスターが無い（未実装・旧版のキャラ） | 国内大手wikiで探す（`from-wiki/`） |
| 弧盤・アイテム・敵・場所 | 公式サイトに個別画像が無い | 同上 |
| ゲームロゴ | 使うと公式サイトと紛らわしい | 使うかどうかを決めてから |
