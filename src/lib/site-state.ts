/**
 * サイトの状態（通常 / メンテナンス / 停止）。
 *
 * ★ 前提（大事）
 *   このサイトは**静的サイト**（ビルドした HTML を置いているだけ）で、
 *   サーバー側のプログラムもデータベースもない。したがって状態の切り替えは
 *   **その端末のブラウザ（localStorage）に対してだけ効く**。
 *   全員に見せるメンテナンス表示にしたい場合は、ここの `DEFAULT_SITE_STATE` を
 *   書き換えてビルドし直す（＝全員に配られる）。
 *
 *   この2段構えを管理ページに明記してある。「全員に効く」ように見せない。
 */

export type SiteMode = 'normal' | 'maintenance' | 'suspended';

export interface SiteState {
  mode: SiteMode;
  /** 画面に出す一文。空なら各モードの既定文を使う */
  message: string;
  /** 「◯日◯時ごろまで」の表示に使う。空なら出さない */
  until: string;
}

export const SITE_MODES: {
  value: SiteMode;
  label: string;
  hint: string;
  icon: string;
  /** 既定の見出しと本文（管理ページで空にしたときに使う） */
  heading: string;
  message: string;
}[] = [
  {
    value: 'normal',
    label: '通常',
    hint: 'ふだんどおり、すべてのページを表示します。',
    icon: 'circle-check',
    heading: '',
    message: '',
  },
  {
    value: 'maintenance',
    label: 'メンテナンス',
    hint: '作業中の案内を全ページに重ねて出します。閉じて中身を見ることもできます。',
    icon: 'wrench',
    heading: 'ただいまメンテナンス中です',
    message:
      '内容の更新作業を行っています。表示が乱れたり、情報が古いままの場合があります。しばらくお待ちください。',
  },
  {
    value: 'suspended',
    label: '停止',
    hint: '公開を止めた案内を出します。閉じられません（規約・ポリシーだけは開けます）。',
    icon: 'circle-pause',
    heading: '現在、公開を停止しています',
    message: '本サイトは一時的に公開を停止しています。再開の予定が決まりましたらお知らせします。',
  },
];

export const modeOf = (v: string) => SITE_MODES.find((m) => m.value === v) ?? SITE_MODES[0];

/** ビルドに焼き込む既定の状態。**全員に見える**のはこれだけ。 */
export const DEFAULT_SITE_STATE: SiteState = {
  mode: 'normal',
  message: '',
  until: '',
};

/** localStorage のキー。管理ページと起動スクリプトで共有する。 */
export const STATE_KEY = 'nte.site.state';
/** お知らせ（この端末で作ったもの）のキー */
export const NOTICES_KEY = 'nte.site.notices';
/** 管理ページのロックを解除した印のキー */
export const ADMIN_KEY = 'nte.admin.unlocked';
