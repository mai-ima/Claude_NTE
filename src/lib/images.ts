/**
 * キャラクター画像の出どころ（**UIモード `base` のときだけ効く**）。
 *
 * ★ 前提（大事）
 *   本サイトは**非公式ファンサイト**で、ゲームの画像・イラストの権利は
 *   運営元にある。既定は「画像を使わない（枠のまま）」で、
 *   **切り替えた端末でだけ**画像が出る。`site-state.ts` と同じ作りで、
 *   静的サイトのため設定は `localStorage` にしか残らない。
 *
 *   全員に配りたい場合は `DEFAULT_IMAGE_SOURCE` を書き換えてビルドし直す。
 *   その判断（権利の確認を含む）はサイトの管理者が行う。
 *
 * ★ どこに置くか（`frame` のとき）
 *   `public/images/characters/<記事のID>.webp` （png / jpg / avif も可）
 *   例: `public/images/characters/zanko.webp` → 残虹のカードに出る。
 *   **置いていないキャラは今までどおりの生成アバター**。
 *   ビルド時にファイルの有無を見ているので、置かなくても 404 は出ない。
 *
 * ★ `official` のとき
 *   記事の frontmatter `officialImage` に書いた URL を参照する。
 *   書いていない記事は `frame` と同じ（ローカル画像か生成アバター）。
 */

/** 画像の出どころ。`frame` … 置いた画像だけ／`official` … 公式の URL も使う */
export type ImageSource = 'frame' | 'official';

/** localStorage のキー。管理ページと起動スクリプトで共有する */
export const IMAGES_KEY = 'nte.site.images';

/** ビルドに焼き込む既定。**全員に見えるのはこれ** */
export const DEFAULT_IMAGE_SOURCE: ImageSource = 'frame';

export const IMAGE_SOURCES: {
  value: ImageSource;
  label: string;
  hint: string;
  icon: string;
}[] = [
  {
    value: 'frame',
    label: '置いた画像だけ',
    hint: 'public/images/ に置いた画像を表示します。置いていないものは、色と頭文字で作った図形のままです。',
    icon: 'image',
  },
  {
    value: 'official',
    label: '公式の画像も使う',
    hint: '記事に公式サイトの画像URLが登録されていれば、それも表示します。権利は各運営元にあります。',
    icon: 'globe',
  },
];

export const imageSourceOf = (v: string) =>
  IMAGE_SOURCES.find((s) => s.value === v) ?? IMAGE_SOURCES[0];
