/**
 * 法的文書の共通データ。
 *
 * 4本の文書（利用規約・プライバシー・免責事項・権利表記）と目次ページで
 * 共有する。**ここに書く内容は実装の事実と一致していなければならない**ので、
 * 断定できることだけを書く。確かめ方は各項目のコメントに残してある。
 */

/** 文書を書き換えたら、この日付も更新すること（各ページの末尾に出る）。
 *  2026-09-13: 画像を同梱する方針に変わったため、著作権の条文を実態へ合わせ、
 *  広告・解析・アプリ・投稿に備えた条項を足した。文書は4本から8本になった。 */
export const LEGAL_UPDATED = '2026-09-13';

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
    blurb: '本サイトの利用条件・禁止事項・引用の扱いを定めた規約です。',
    icon: 'scroll-text',
  },
  {
    slug: 'privacy',
    title: 'プライバシーポリシー',
    blurb: '情報の取扱い。解析・広告・Cookie は使用していません。',
    icon: 'shield-check',
  },
  {
    slug: 'disclaimer',
    title: '免責事項',
    blurb: '掲載情報の正確性と、損害に対する責任の範囲。',
    icon: 'triangle-alert',
  },
  {
    slug: 'copyright',
    title: '著作権・権利表記',
    blurb: '各ゲームの権利の帰属と、掲載している画像の扱い。',
    icon: 'copyright',
  },
  {
    slug: 'cookie',
    title: 'Cookie ポリシー',
    blurb: 'Cookie の使用について。現在は使用していません。',
    icon: 'cookie',
  },
  {
    slug: 'guidelines',
    title: 'コミュニティガイドライン',
    blurb: '記事の直しを提案していただくときの決まりごと。',
    icon: 'users',
  },
  {
    slug: 'takedown',
    title: '権利者の皆様へ',
    blurb: '掲載の停止・削除のお申し出の窓口と手順。',
    icon: 'shield-alert',
  },
  {
    slug: 'commerce',
    title: '特定商取引法に基づく表記',
    blurb: '有料の販売は行っていません。将来に備えた表記です。',
    icon: 'receipt',
  },
];

export const legalHref = (slug: string) => `/legal/${slug}/`;
