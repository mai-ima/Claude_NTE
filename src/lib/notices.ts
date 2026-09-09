/**
 * お知らせ（サイトからの告知）。
 *
 * 置き場所が2つある。**混ぜて表示するが、出どころは画面上で区別する**。
 *
 *   1. ここに書いた `NOTICES` … ビルドに同梱され、**すべての閲覧者に見える**。
 *   2. 管理ページ（/admin/）で作ったもの … `localStorage` に入り、
 *      **作った端末のブラウザでしか見えない**（このサイトは静的サイトで、
 *      書き込み先のサーバーが無いため）。
 *
 * 2 の制約は管理ページと一覧ページに明記してある。隠すと嘘になる。
 *
 * ★ 内容は事実だけを書く（このサイト自身の告知なので、確かめられる範囲に限る）。
 */

/** お知らせの重み。見た目（色と印）が変わるだけで、並び順には影響しない。 */
export type NoticeLevel = 'info' | 'important' | 'maintenance';

export interface Notice {
  /** URL に使う。半角英数とハイフンのみ */
  id: string;
  /** 掲載日 YYYY-MM-DD */
  date: string;
  title: string;
  /** 本文。改行で段落を分ける（HTML は書かない） */
  body: string;
  level: NoticeLevel;
  /** 一覧の先頭に留める */
  pinned?: boolean;
}

export const NOTICE_LEVELS: { value: NoticeLevel; label: string; icon: string }[] = [
  { value: 'info', label: 'お知らせ', icon: 'info' },
  { value: 'important', label: '重要', icon: 'alert-circle' },
  { value: 'maintenance', label: 'メンテナンス', icon: 'wrench' },
];

export const levelOf = (v: string) =>
  NOTICE_LEVELS.find((l) => l.value === v) ?? NOTICE_LEVELS[0];

/** 全員に見えるお知らせ（ビルド同梱）。新しいものを上に足す。 */
export const NOTICES: Notice[] = [
  {
    id: 'endfield-articles-open',
    date: '2026-09-09',
    title: 'アークナイツ：エンドフィールドの記事を掲載開始しました',
    body: [
      'これまで枠だけだったエンドフィールドの wiki に、記事の掲載を始めました。オペレーター、バージョン「雪氷の幽夢」、新エリア、職分・属性・ブレイクなどの基礎用語、戦闘の基本と、はじめての方への案内を掲載しています。',
      'ガチャ（スカウト）の排出率と天井の回数は、公式の数値を確認できていないため掲載していません。ゲーム内の確率表記をご確認ください。',
      'あわせて、NTE 側も9月9日のアップデート（リンコの実装、新モード「軌道外ブレイク」など）に対応しました。',
    ].join('\n\n'),
    level: 'info',
  },
  {
    id: 'notices-open',
    date: '2026-09-08',
    title: 'お知らせページを作りました',
    body: [
      'このページで、wiki の更新や仕様の変更についてお知らせします。',
      '記事そのものの更新履歴は、各記事の下部にある更新日・確認日をご覧ください。',
      'サイト全体の変更点は「更新履歴」のページにまとめています。',
    ].join('\n\n'),
    level: 'info',
  },
  {
    id: 'legal-published',
    date: '2026-09-08',
    title: '利用規約・プライバシーポリシーなどを公開しました',
    body: [
      '利用規約、プライバシーポリシー、免責事項、著作権・権利表記の4つを公開しました。どのページからも、下部の「規約・ポリシー」から開けます。',
      '本サイトは広告・アクセス解析・Cookie を使用していません。設定やツールに入力した内容は、お使いの端末の中だけに保存されます。',
    ].join('\n\n'),
    level: 'important',
  },
  {
    id: 'six-wikis',
    date: '2026-09-08',
    title: 'wiki が6つになりました',
    body: [
      'アークナイツ：エンドフィールドの攻略wiki を追加し、原神・鳴潮・崩壊：スターレイルのページを用意しました。',
      '原神・鳴潮・崩壊：スターレイルはまだ準備中で、記事はありません。公開の時期が決まりましたら、このページでお知らせします。',
    ].join('\n\n'),
    level: 'info',
  },
];

export const noticeHref = (id: string) => `/notices/${id}/`;

/** 掲載日の新しい順（固定したものが先）。同じ日なら id で安定させる。 */
export const sortNotices = <T extends Notice>(list: T[]): T[] =>
  [...list].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.id.localeCompare(b.id);
  });

/** 日付の表示。YYYY-MM-DD → 2026年9月8日 */
export const noticeDate = (d: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return d;
  return `${Number(m[1])}年${Number(m[2])}月${Number(m[3])}日`;
};
