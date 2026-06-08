/** リリースノート（更新履歴）。各バージョンで私（Claude）が追記する。 */

export interface ReleaseNote {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  changes: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: 'v0.2.0',
    date: '2026-06-08',
    title: '実データ化・Vercel移行・専用ページ・ツール拡充',
    changes: [
      'Vercel 一本化（base="/"）。GitHub Pages 用の base 設定が原因の CSS/JS 読み込み不全（素のHTML表示）を修正。',
      '単一 wiki から型付きコレクション（キャラ/システム/ガイド/ロケーション/敵/アイテム/ストーリー）へ再設計。1エンティティ＝1専用ページ化。',
      'NTE（Neverness to Everness）の実データを Web 調査し、出典付きで全記事を執筆（キャラ17体・システム6・ガイド6・ロケーション7・敵4・アイテム6・ストーリー2）。',
      'グローバルサイドバー（折りたたみ式）・モバイル下部ナビ・iPhone セーフエリア対応を追加。',
      '新ツール: ガチャ天井トラッカー / インタラクティブ・マップ / チームビルダー / ティアリスト / 育成・スタミナ計画。',
      'ストーリーのネタバレを折りたたみ（Spoiler）に。属性色のオリジナル生成アバターを導入（公式画像は権利配慮で非同梱）。',
      'キャラ一覧に属性/ロール/レア度フィルタを追加。個人メモ機能は維持。',
    ],
  },
  {
    version: 'v0.1.1',
    date: '2026-06-08',
    title: 'PWA廃止と堅牢化',
    changes: [
      'PWA（Service Worker / manifest / @vite-pwa）を完全に廃止。Pagefind索引のプリキャッシュ肥大化によるインストール肥大・初回オフライン化の重さを回避し、純粋な静的サイトに。',
      'ツールの localStorage フックを、同一ページの複数アイランド間で同期する設計に変更（書き込み競合・上書きを防止。別タブ変更にも追従）。',
      'MDX内部リンクを相対パスに統一し、base付与のrehypeプラグインを撤去（Astro更新に強い構成へ）。',
      'Pagefind検索が base 配下（/claude_nte）でも動作することを確認（bundlePath を明示）。',
      'GitHub Pages へデプロイ。',
    ],
  },
  {
    version: 'v0.1.0',
    date: '2026-06-08',
    title: '初版リリース',
    changes: [
      'サイト基盤を Astro + MDX + Preact で構築（静的出力・GitHub Pages 対応）。',
      '4テーマ（ミニマル/クリーン・ダークモダン・ソフト/温かみ・OS連動）と設定ページを実装。',
      'wiki: カテゴリ別一覧・記事ページ・目次・「要確認」バッジ・全文検索（Pagefind）を実装。',
      'wiki シード記事（はじめに/基本システム/攻略ガイド/各カテゴリの雛形）を収録。',
      'ツール: メモ・チェックリスト・タイマー/カウンター・確率/期待値・スタミナ計算を実装。',
      '記事ごとの個人メモ（localStorage）と、データのエクスポート/インポート/初期化を実装。',
      'PWA 対応（インストール・オフライン閲覧）。',
    ],
  },
];
