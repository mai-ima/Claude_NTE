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
 *                カード中心／チップ／下線タブ／浮かぶタブバー）で組んだ土台
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
  | 'nte';

export const UI_KEY = 'nte.ui';
const DEFAULT_UI: UIMode = 'classic';

export const UI_MODES: { value: UIMode; label: string; hint: string; beta: boolean }[] = [
  { value: 'classic', label: '従来UI', hint: 'これまでのシンプルな表示', beta: false },
  {
    value: 'base',
    label: 'Base（次期ベース）',
    hint: 'アプリのような見た目。青紫のアクセント、丸みのあるカード、絞り込みのチップ、下線のタブ、下に浮かぶタブバー',
    beta: false,
  },
  {
    value: 'new',
    label: 'New',
    hint: '画面の構成から作り直した見た目。パソコンは左の縦メニュー、スマホは浮かぶタブ',
    beta: true,
  },
  { value: 'new-classic', label: 'New Classic', hint: '従来UIを近代化した非ベータの新デザイン（洗練タイポ・やわらか影）', beta: false },
  { value: 'editorial', label: 'Editorial', hint: '紙の特集記事風。太い罫線とハードシャドウ', beta: true },
  { value: 'liquid', label: 'Liquid Glass', hint: '本格リキッドグラス。厚い曇りガラスとカプセル', beta: true },
  { value: 'aurora', label: 'Aurora Neon', hint: '不透明×ネオングラデーションと発光（ガラスではない）', beta: true },
  { value: 'apple', label: 'Apple（仮称）', hint: 'HIG風のクリーンなフラットデザイン', beta: true },
  { value: 'terminal', label: 'Terminal', hint: 'レトロCRT/端末風。等幅・走査線・記号UI', beta: true },
  { value: 'clay', label: 'Clay', hint: 'やわらかニューモーフィズム。ぷっくり3D', beta: true },
  { value: 'blueprint', label: 'Blueprint', hint: '製図/設計図風。方眼と四隅のティック', beta: true },
  {
    value: 'nte',
    label: 'NTE（公式サイト風）',
    hint: 'NTE 公式サイトの配色と質感を再現。シアンのアクセント、見出しは色ズレ、目次の印は四角→ピンクの菱形。暗いテーマは公式の一覧、明るいテーマは公式の記事ページの配色になります',
    beta: true,
  },
];

const VALID: UIMode[] = UI_MODES.map((m) => m.value);

export function getStoredUI(): UIMode {
  try {
    const v = localStorage.getItem(UI_KEY);
    if (v === 'beta') return 'editorial'; // 旧「新UI(ベータ)」からの移行
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
  } catch {
    /* 保存不可でも適用は行う */
  }
  applyUI(mode);
}
