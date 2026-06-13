/**
 * 「このページを編集」リンクの組み立て。
 * 本サイトは静的（Vercel）＋ git 管理のため、編集は GitHub 上の PR ベースで行う
 * （Wikipedia のような即時編集ではなく、GitHub の編集画面→プルリクの流れ）。
 */
const REPO = 'mai-ima/claude_nte';
// 編集の取り込み先ブランチ（標準的な「Edit this page」は既定ブランチを指す）。
const EDIT_BRANCH = 'main';

/** リポジトリ相対のファイルパス（例: src/content/terms/anomaly.md）から編集URLを作る。 */
export function editUrl(filePath: string): string {
  const clean = filePath.replace(/^\/+/, '');
  return `https://github.com/${REPO}/edit/${EDIT_BRANCH}/${clean}`;
}

/** コレクション名＋slug から既定の編集URLを作る（拡張子は既定で .md）。 */
export function editUrlFor(collection: string, id: string, ext = 'md'): string {
  return editUrl(`src/content/${collection}/${id}.${ext}`);
}
