/**
 * UIモード（ベータ機能）の定義と適用ロジック。
 * - 'classic'  : 従来のUI（既定）
 * - 'new'      : 画面の構成そのものを変えるフルチェンジ
 *                （デスクトップは左の縦レール、モバイルは浮かぶドック）
 *                ※ 以前は「次期ベース候補」としていたが、利用者の指示で外した。
 *                   次期ベースの役割は 'base' が担う（2026-09-10）
 * - 'new-classic': 従来UIを近代化した非ベータの新デザイン
 * - 'editorial': 紙の特集記事風（太罫線・ハードシャドウ・活字タイポ）
 * - 'liquid'   : 本格リキッドグラス（厚い曇りガラス・カプセル形状）
 * - 'aurora'   : 不透明×ネオングラデーション＋発光（ガラスでない）
 * - 'apple'    : Apple HIG 風のクリーンなフラット（仮称）
 * - 'base'     : ★次期ベース。スマホアプリの作法（青紫のアクセント／大きめの角丸／
 *                カード中心／チップ／下線タブ／下端のタブバー）で組んだ土台
 * - 'nte'      : NTE 公式サイトの配色と質感を再現（シアン #4fe5fb。
 *                暗いテーマ＝公式のニュース一覧、明るいテーマ＝公式の記事ページ）
 * html[data-ui='<mode>'] でスタイルを切り替える。テーマ（配色）とは独立。
 */

export type UIMode =
  | 'classic'
  | 'new'
  | 'new-classic'
  | 'editorial'
  | 'liquid'
  | 'aurora'
  | 'apple'
  | 'terminal'
  | 'clay'
  | 'blueprint'
  | 'base'
  | 'old-base'
  | 'nte';

export const UI_KEY = 'nte.ui';
/**
 * 「旧 Base → old-Base」の移し替えを**一度だけ**にするための目印。
 *
 * ★ なぜ要るか
 *   移し替えを毎回やると、**新しい Base を選んでも次に開いたとき old-Base に戻って**しまう。
 *   一度移したらここに印を書き、以後は触らない。
 */
export const UI_MIGRATED_KEY = 'nte.ui.migrated';
const DEFAULT_UI: UIMode = 'classic';

/**
 * 見た目の一覧。
 *
 * ★ `group` の意味（利用者の決定 2026-09-13）
 *   - `'main'`  … ふだん使うもの。設定でそのまま並べる（5つ）
 *   - `'extra'` … 遊びの見た目。設定では「おまけ」に畳んで置く（7つ）
 *   増えすぎて選びにくくなったので分けた。**CSS は消していない**ので、
 *   すでに選んでいる端末はそのまま使える。
 */
export const UI_MODES: {
  value: UIMode;
  label: string;
  hint: string;
  beta: boolean;
  group: 'main' | 'extra';
}[] = [
  { value: 'classic', label: '従来UI', hint: 'これまでのシンプルな表示', beta: false, group: 'main' },
  {
    value: 'base',
    label: 'Base',
    hint: 'アプリのような見た目。帯のヘッダー、常に見える絞り込み、並び順の切り替え、下線のタブ',
    beta: false,
    group: 'main',
  },
  {
    value: 'old-base',
    label: 'old-Base',
    hint: '一つ前の Base。丸みのあるカードと青紫のアクセント',
    beta: false,
    group: 'main',
  },
  {
    value: 'new',
    label: 'New',
    hint: '画面の構成から作り直した見た目。パソコンは左の縦メニュー、スマホは浮かぶタブ',
    beta: true,
    group: 'main',
  },
  {
    value: 'nte',
    label: 'NTE（公式サイト風）',
    hint: 'NTE 公式サイトの配色と質感を再現。シアンのアクセント、見出しは色ズレ、目次の印は四角→ピンクの菱形。暗いテーマは公式の一覧、明るいテーマは公式の記事ページの配色になります',
    beta: true,
    group: 'main',
  },
  { value: 'new-classic', label: 'New Classic', hint: '従来UIを近代化した非ベータの新デザイン（洗練タイポ・やわらか影）', beta: false, group: 'extra' },
  { value: 'editorial', label: 'Editorial', hint: '紙の特集記事風。太い罫線とハードシャドウ', beta: true, group: 'extra' },
  { value: 'liquid', label: 'Liquid Glass', hint: '本格リキッドグラス。厚い曇りガラスとカプセル', beta: true, group: 'extra' },
  { value: 'aurora', label: 'Aurora Neon', hint: '不透明×ネオングラデーションと発光（ガラスではない）', beta: true, group: 'extra' },
  { value: 'apple', label: 'Apple（仮称）', hint: 'HIG風のクリーンなフラットデザイン', beta: true, group: 'extra' },
  { value: 'terminal', label: 'Terminal', hint: 'レトロCRT/端末風。等幅・走査線・記号UI', beta: true, group: 'extra' },
  { value: 'clay', label: 'Clay', hint: 'やわらかニューモーフィズム。ぷっくり3D', beta: true, group: 'extra' },
  { value: 'blueprint', label: 'Blueprint', hint: '製図/設計図風。方眼と四隅のティック', beta: true, group: 'extra' },
];

const VALID: UIMode[] = UI_MODES.map((m) => m.value);

export function getStoredUI(): UIMode {
  try {
    const v = localStorage.getItem(UI_KEY);
    if (v === 'beta') return 'editorial'; // 旧「新UI(ベータ)」からの移行
    /* 旧 Base を選んでいた端末は old-Base へ移す（見た目が変わらないように）。
       **一度だけ**行い、印を残す。
       ★ 同じ移行を BaseLayout の起動スクリプトにも書いてある（二重管理）。
         片方だけ直すと、起動直後だけ別の見た目になる。 */
    if (v === 'base' && localStorage.getItem(UI_MIGRATED_KEY) !== '1') {
      localStorage.setItem(UI_MIGRATED_KEY, '1');
      localStorage.setItem(UI_KEY, 'old-base');
      return 'old-base';
    }
    if (VALID.includes(v as UIMode)) return v as UIMode;
  } catch {
    /* localStorage 不可環境は既定値 */
  }
  return DEFAULT_UI;
}

export function applyUI(mode: UIMode): void {
  document.documentElement.setAttribute('data-ui', mode);
  // 'nte' のグリッチは見出しの文字の複製が要る（公式が3枚重ねているのと同じ理屈）。
  // 初回表示は BaseLayout の inline スクリプトが付けるが、設定パネルで
  // 切り替えたときはここで付ける。付けっぱなしでも他モードには影響しない。
  if (mode === 'nte') {
    try {
      const h = document.querySelector('.page-head h1');
      if (h && !h.hasAttribute('data-glitch')) {
        h.setAttribute('data-glitch', (h.textContent ?? '').trim());
      }
    } catch {
      /* 付けられなくてもグリッチが出ないだけ。表示は壊れない */
    }
  }
}

export function setUI(mode: UIMode): void {
  try {
    localStorage.setItem(UI_KEY, mode);
    /* 自分で選んだ時点で「移し替え済み」とする。
       これをしないと、**新しい Base を選んでも次に開いたとき old-Base に戻る**
       （旧 Base と同じ値なので、移し替えの対象と見分けが付かないため）。 */
    localStorage.setItem(UI_MIGRATED_KEY, '1');
  } catch {
    /* 保存不可でも適用は行う */
  }
  applyUI(mode);
}
