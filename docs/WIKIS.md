# WIKIS.md — このサイトに置かれている wiki の一覧（正）

> このサイトは「1サイト＝1ゲーム」ではなく、**wiki を並置**する構成。
> ここが wiki 一覧の**正**。wiki を足す・状態を変えるときは、まずこの表を更新する。
>
> 実装の正は `src/lib/wikis.ts`（`WIKI_LIST`）。**この表と食い違ったら実装が正**なので、
> 気づいたらここを直すこと。

最終更新: 2026-09-07

## 一覧

| id | URL | 状態 | UI | 記事 | ゲームの権利者 |
| --- | --- | --- | --- | --- | --- |
| `nte` | `/` | **運用中** | 共通（`BaseLayout` + `base/components/themes/ui-*.css`） | 267 | Hotta Studio / Perfect World Games |
| `endfield` | `/endfield/` | **運用中** | **専用**（`EndfieldLayout` + `endfield.css`） | 0（準備中） | Hypergryph / MOUNTAIN CONTOUR / GRYPHLINE |
| `genshin` | `/genshin/` | 準備中 | **専用**（`GenshinLayout` + `genshin.css`） | — | COGNOSPHERE PTE. LTD. / miHoYo |
| `wuwa` | `/wuwa/` | 準備中 | **専用**（`WuwaLayout` + `wuwa.css`） | — | KURO GAMES |
| `hsr` | `/hsr/` | 準備中 | **専用**（`HsrLayout` + `hsr.css`） | — | COGNOSPHERE PTE. LTD. / miHoYo |
| `alpha` | `/alpha/` | サンプル | **専用**（`AlphaLayout` + `alpha.css`） | 8 | （実在しないゲーム） |

`kind` は3種類:

| kind | 意味 | ページ | コレクション |
| --- | --- | --- | --- |
| `live` | 通常運用 | 一覧・記事あり | あり |
| `planned` | **準備中** | **トップ1枚だけ** | **なし（`sections: []`）** |
| `sample` | 実在しないゲームのダミー（マルチwiki機能の検証用） | 一覧・記事あり | あり |

## 見た目の分担

**wiki ごとに UI を完全に分ける**のがこのサイトの方針
（利用者の指示。`.claude/state/DECISIONS.md` 2026-09-07）。
各ゲームのUIを観察した記録は **[docs/UI-RESEARCH.md](./UI-RESEARCH.md)**。

| wiki | 既定の配色 | 特徴 | スマホのナビ |
| --- | --- | --- | --- |
| NTE | 明色 | 一般的な wiki。設定14件・**UIモード11種**・ツール13種 | 下部タブバー |
| └ うち **NTE（公式サイト風）** | **暗色** | 濃灰 `#1d1d1d` × シアン `#4fe5fb`（**実測**）。見出しは赤とシアンの色ズレ | 下部タブバー |
| エンドフィールド | 明色 | **白地**＋UIパーツの黒 `#191919`＋蛍光イエロー `#fffa00`（**実画面で実測**）。厚い帯で区切る／番号付き見出し／45度のハザード帯 | **右下ボタン → 全画面シート** |
| 原神 | 明色 | クリームの地＋**白い6pxの太枠**（実測7回）。暖色の半透明・柔らかい曲線 | （1ページのみ） |
| 鳴潮 | **暗色** | 黒 `#000`＋**金** `#dab67d`（実測）。**極細1pxの罫線**／角丸は**左上と右下だけ** | （1ページのみ） |
| スターレイル | 明色 | 白地＋太い黒＋黄の面。**右上だけ角丸**（実測11回）／黒帯の英字メニュー・現在地は**青**・CTAは**金** | （1ページのみ） |

| α | 明色 | 丸いカード。モバイル寄り | 下部タブバー |

> エンドフィールドの黒地は**ローディング画面だけ**だった（本編は白地）。
> 鳴潮のアクセントも**シアンではなく金**。どちらも実画面／実CSSを見て 2026-09-07 に訂正した。
> 2026-09-08 にさらに下層ページまで見て、エンドフィールドの
> **カラーバーは3色**（マゼンタ→黄→緑）、**ハザード帯は −45度・3px/6px** と分かり直した。

**CSS を混ぜないこと。** 各レイアウトは自分の CSS 1本だけを import する。
`pnpm test:ui` の `STYLE_MARKS` が、他 wiki の目印クラスが混ざっていないかを検査している。

## エンドフィールドのセクション（12種）

| # | コレクション | dir | URL |
| --- | --- | --- | --- |
| 01 | `endfieldOperators` | `endfield-operators` | `/endfield/operators/` |
| 02 | `endfieldWeapons` | `endfield-weapons` | `/endfield/weapons/` |
| 03 | `endfieldGear` | `endfield-gear` | `/endfield/gear/` |
| 04 | `endfieldIndustry` | `endfield-industry` | `/endfield/industry/` |
| 05 | `endfieldEnemies` | `endfield-enemies` | `/endfield/enemies/` |
| 06 | `endfieldAreas` | `endfield-areas` | `/endfield/areas/` |
| 07 | `endfieldSystems` | `endfield-systems` | `/endfield/systems/` |
| 08 | `endfieldItems` | `endfield-items` | `/endfield/items/` |
| 09 | `endfieldEvents` | `endfield-events` | `/endfield/events/` |
| 10 | `endfieldStory` | `endfield-story` | `/endfield/story/` |
| 11 | `endfieldGuides` | `endfield-guides` | `/endfield/guides/` |
| 12 | `endfieldTerms` | `endfield-terms` | `/endfield/terms/` |

## 準備中の wiki を足す／運用中に変えるとき

**足すとき**（`docs/RECIPES.md`「wiki を1つ足す」の簡略版）:

1. `src/lib/wikis.ts` … `WikiId` に id、`WikiMeta` を1件（`kind: 'planned'`・`sections: []`・
   **`officialUrl` は実在を確認してから**・`rightsHolder` 必須）、`WIKI_LIST` に追加
2. `src/layouts/<Game>Layout.astro` と `src/styles/<game>.css` … **そのゲームのUIで**新規に作る
   （調べ方と観察結果は `docs/UI-RESEARCH.md`）
3. `src/pages/<base>/index.astro` … 準備中ページ1枚
4. `scripts/check-ui.mjs` … `INDEPENDENT_BASES` と `STYLE_MARKS` に追加
5. `scripts/check-content.mjs` … `STATIC_PAGES` に `/<base>/`
6. `astro.config.mjs` … sitemap の `filter` に追加（中身が無いページを検索に載せない）
7. `scripts/audit-browser.mjs` … `PAGES` に追加

**準備中 → 運用中に変えるとき**:

1. `kind` を `'live'` に、`sections` にセクションを定義（`src/lib/nav.ts`）
2. `src/content.config.ts` にコレクション、`src/content/<game>-*/` にディレクトリ
3. `src/lib/rehype-term-links.mjs` の `WIKI_GROUPS` に**その wiki のグループ**を追加
   （混ぜると他 wiki の記事へリンクが張られる）
4. `scripts/check-content.mjs` の `URL_BASE` にコレクションの対応
5. `astro.config.mjs` の sitemap `filter` から**外す**
6. 一覧ページ・記事ページを作る

## 注意点

- **`primaryNav` / `bottomNav` に他 wiki のページを混ぜない**。
  混ざると「α のタブから NTE に飛ばされる」事故になる（実際に起きた）。
  `test/wikis.test.ts` が全 wiki を回して検査している。
- **コレクション名は全 wiki 横断で一意**（同じくテストが検査）。
- **wiki をまたぐリンクには `data-astro-reload`**。NTE は View Transitions を使うが、
  専用UIの wiki は積んでいないので、部分入れ替えされると壊れる。`pnpm test:ui` が検査。
- **フッターの wiki 羅列は運用中だけ**（`LIVE_WIKIS`）。6件並べると横に溢れる。
