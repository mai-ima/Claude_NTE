# iOS アプリ（SwiftUI）へ移すための設計

> 利用者の決定（2026-09-13）: **iOS アプリを新しく作る**。WebView で包むのではなく、
> SwiftUI でネイティブに作る。この文書は**その土台**の設計で、Swift のコードはまだ書いていない。
> 決定の原文は [.claude/state/DECISIONS.md](../.claude/state/DECISIONS.md)。

## 1. いまできていること（アプリ側から見て）

| できること | 置き場 | 備考 |
| --- | --- | --- |
| 全記事を機械が読める形で取れる | `/api/index.json` と `/api/<コレクション名>.json` | 公開済みの記事だけ。下書きは入らない |
| 保存・履歴の形が決まっている | `src/lib/user-data.ts` の `ItemRef` | アプリ側も同じ形にすれば、あとで同期できる |
| 保存先を差し替えられる | 同上 `setSource()` | Web 側はいま localStorage |

## 2. データの取り方

```
GET /api/index.json              目次。wiki とコレクションの一覧、それぞれの件数
GET /api/<コレクション名>.json    そのコレクションの全記事（frontmatter ＋ 本文の Markdown）
```

`/api/index.json` の `apiVersion` を見てから読む。形を変えるときは番号を上げる。

```jsonc
// /api/index.json
{
  "apiVersion": 1,
  "generatedAt": "2026-09-13T00:00:00.000Z",
  "wikis": [
    {
      "id": "nte",
      "name": "NTE 完全攻略wiki",
      "base": "",
      "kind": "live",
      "collections": [
        { "collection": "characters", "label": "キャラクター", "href": "/characters/", "count": 25, "endpoint": "/api/characters.json" }
      ]
    }
  ]
}
```

```jsonc
// /api/characters.json
{
  "collection": "characters",
  "count": 25,
  "items": [
    {
      "id": "mint",
      "collection": "characters",
      "title": "ミント",
      "href": "/characters/mint/",
      "data": { "name": "Mint", "nameJa": "ミント", "rarity": "A", "element": "Anima", "sources": [ … ] },
      "body": "**ミント（Mint）** は …"      // 記事の原文（Markdown）
    }
  ]
}
```

**気をつけること**

- `body` は**原文の Markdown**。サイトでは用語リンクや見出しリンクをビルド時に足しているので、
  アプリで同じ見た目にしたいなら同じ規則を実装する（→ `src/lib/rehype-term-links.mjs`）。
- `data` の中身は**コレクションごとに違う**。Swift では `[String: JSONValue]` のような
  緩い型で受けて、画面ごとに必要な鍵だけ取り出すのが安全。スキーマは `src/content.config.ts` が正。
- 日付は `YYYY-MM-DD` の文字列に揃えてある。

### 取り込みの流れ（推奨）

1. 起動時に `/api/index.json` を取る。`generatedAt` を前回と比べ、変わっていなければ何もしない。
2. 変わっていたら各 `endpoint` を取り、端末のデータベース（SwiftData か SQLite）へ入れる。
3. 以後は端末側から読む。**通信が無くても読める**状態にする（wiki は移動中に見ることが多い）。

## 3. 画面の構成

参考画像（利用者が示したゲームwikiアプリ）と、いまの base UI に合わせる。

| タブ | 中身 | Web 側の対応 |
| --- | --- | --- |
| ホーム | 注目のキャラ・最近見たページ・お知らせ・データベースの入口 | `/` |
| 検索 | 全文検索（端末内の索引） | Pagefind（Web 側）に相当するものを自前で |
| 保存 | 保存したページ・最近見たページ | `/favorites/` |
| 設定 | 表示の好み・このアプリについて・権利表記 | `/settings/` `/legal/` |

**一覧 → 記事** の2階層は Web と同じ。記事画面は「絵 → 名前 → タグ → 基本情報 → 本文」の順
（参考画像4枚目・base UI もこの順に直してある）。

## 4. 保存と履歴

Web 側と**同じ形**にする。あとで同期するときに変換が要らない。

```swift
struct ItemRef: Codable, Identifiable {
    let key: String      // "characters:mint"
    let title: String
    let href: String     // "/characters/mint/"
    let kind: String     // "characters"
    let wiki: String     // "nte"
    let at: Date
    var id: String { key }
}
```

規則も合わせる（→ `test/user-data.test.ts` が Web 側の規則を固定している）。

- 保存は**新しいものが先頭**。同じ `key` は1件だけ。
- 履歴は同じページを重ねず、**新しい方から 30 件**まで。

## 5. サーバーを入れるとき

利用者の決定（2026-09-13）: **いまの段階では Neon を導入しない**。入れるときの想定は次の4つ。

| 用途 | Web 側でどこを差し替えるか |
| --- | --- |
| 記事データの置き場 | `/api/*.json` の作り方（いまはビルド時に生成） |
| 利用者ごとの保存 | `user-data.ts` の `setSource()` に HTTP 実装を渡す |
| 閲覧数・いいね | **新設**。数える仕組みが無いので、いまは画面にも出していない |
| 管理ページのデータ共有 | `site-state.ts`（いまは端末ごと） |

アプリ側も同じ境界で作る（**保存の入口を1か所に集める**）。

## 6. 権利まわり（必ず守る）

- **非公式ファンアプリである旨と権利者名**を、アプリ内に明記する（Web と同じ）。
- **公式の画像・ロゴ・フォントを同梱しない**。Web 側は URL を参照するだけにしてある。
  アプリで表示する場合も同じ（同梱するとストア審査と権利の両方で問題になる）。
- 解析・広告を入れるなら、**入れる前に** プライバシーポリシーを直す（Web 側と同じ決まり）。

## 7. まだ決めていないこと

- 検索の作り方（端末内の索引をどう持つか）。記事 288 本ぶんの全文をどう畳むか。
- 記事の Markdown をどう描くか（自前で描くか、ライブラリを使うか）。
- 配布の形（TestFlight から始めるのか、ストアに出すのか）。
