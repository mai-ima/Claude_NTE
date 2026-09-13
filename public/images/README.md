# 画像の置き場

**出どころで分けてある。混ぜないこと。**
どの画像がどこから来たかは [docs/IMAGE-SOURCES.md](../../docs/IMAGE-SOURCES.md) に1枚ずつ記録する。

| フォルダ | 何を入れるか | リポジトリに入るか |
| --- | --- | --- |
| `official/` | **公式サイト・公式コミュニティ**から取ったもの | **入る**（同梱して既定で表示） |
| `from-wiki/` | 国内の大手攻略wikiから借りたもの。**公式に無いものだけ** | 入る |
| `from-user/` | 利用者が添付した画像 | 入る |
| `generated/` | こちらで作った画像（撮影・図） | 入る |
| `characters/` | 各自が手元で置く画像（**追跡しない**） | **入らない**（`.gitignore`） |

## 決まり

- **公式にあるものは公式から取る。** 攻略wikiの画像は、公式に無いものだけ。
- **日本国内版を優先する。** どうしても無いときだけ海外版。
  **日本語以外の言語が写り込んだ画像は使わない。**
- 画像の権利は各ゲームの運営元にある。**削除の求めがあれば速やかに外す**。
  窓口は `/legal/` に置いてある。
- 取得は `scripts/fetch-official-images.mjs` で行う（URL の一覧がそこにある）。
  **手で拾ってきて置かない**（どこから来たか分からなくなる）。

## 名前の付け方

```
official/<wiki>/<種類>/<記事のID>.webp      例: official/nte/characters/mint.webp
official/endfield/classes/<職業の英名>.webp  例: official/endfield/classes/guard.webp
```

記事の ID と同じ名前にすると、`src/lib/asset.ts` の `findLocalImage()` が拾う。
