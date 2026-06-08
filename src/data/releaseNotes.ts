/** リリースノート（更新履歴）。各バージョンで私（Claude）が追記する。 */

export interface ReleaseNote {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  changes: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
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
