/** リリースノート（更新履歴）。各バージョンで私（Claude）が追記する。 */

export interface ReleaseNote {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  changes: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
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
