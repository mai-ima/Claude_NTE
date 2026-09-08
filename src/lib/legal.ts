/**
 * 法的文書の共通データ。
 *
 * 4本の文書（利用規約・プライバシー・免責事項・権利表記）と目次ページで
 * 共有する。**ここに書く内容は実装の事実と一致していなければならない**ので、
 * 断定できることだけを書く。確かめ方は各項目のコメントに残してある。
 */

/** 文書を書き換えたら、この日付も更新すること（各ページの末尾に出る） */
export const LEGAL_UPDATED = '2026-09-08';

/** 問い合わせ・訂正依頼の窓口。
 *  全記事の「このページを編集」リンクが同じリポジトリを指しており、
 *  すでに公開している導線なので、ここも同じ場所に揃える。 */
export const CONTACT_URL = 'https://github.com/mai-ima/claude_nte/issues';

export interface LegalDoc {
  slug: string;
  title: string;
  /** 目次に出す1行説明 */
  blurb: string;
  icon: string;
}

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: 'terms',
    title: '利用規約',
    blurb: 'このサイトを見るとき・引用するときの決まりごと。',
    icon: 'scroll-text',
  },
  {
    slug: 'privacy',
    title: 'プライバシーポリシー',
    blurb: '取得している情報と、していないこと。',
    icon: 'shield-check',
  },
  {
    slug: 'disclaimer',
    title: '免責事項',
    blurb: '情報の正確さについて、どこまで保証できるか。',
    icon: 'triangle-alert',
  },
  {
    slug: 'copyright',
    title: '著作権・権利表記',
    blurb: '各ゲームの権利者と、このサイトの文章の扱い。',
    icon: 'copyright',
  },
];

export const legalHref = (slug: string) => `/legal/${slug}/`;
