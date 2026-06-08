/** wiki カテゴリのメタ情報（表示順・アイコン）。
 *  記事フロントマターの `category` がここの `id` と対応する。 */

export interface CategoryMeta {
  id: string;
  label: string;
  icon: string; // lucide アイコン名
  order: number;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'はじめに', label: 'はじめに', icon: 'book-open', order: 0 },
  { id: '基本システム', label: '基本システム', icon: 'settings-2', order: 10 },
  { id: '攻略ガイド', label: '攻略ガイド', icon: 'compass', order: 20 },
  { id: 'キャラクター', label: 'キャラクター', icon: 'users', order: 30 },
  { id: '武器・装備', label: '武器・装備', icon: 'sword', order: 40 },
  { id: 'アイテム', label: 'アイテム', icon: 'package', order: 50 },
  { id: 'マップ・探索', label: 'マップ・探索', icon: 'map', order: 60 },
  { id: '敵・ボス', label: '敵・ボス', icon: 'skull', order: 70 },
  { id: 'イベント', label: 'イベント', icon: 'calendar', order: 80 },
  { id: 'ストーリー', label: 'ストーリー', icon: 'scroll-text', order: 90 },
  { id: 'FAQ', label: 'FAQ', icon: 'help-circle', order: 100 },
];

export function categoryMeta(id: string): CategoryMeta {
  return (
    CATEGORIES.find((c) => c.id === id) ?? {
      id,
      label: id,
      icon: 'file-text',
      order: 999,
    }
  );
}

/** 主要なグローバルナビ */
export const PRIMARY_NAV = [
  { label: 'ホーム', href: '/', icon: 'home' },
  { label: 'wiki', href: '/wiki/', icon: 'library' },
  { label: 'ツール', href: '/tools/', icon: 'wrench' },
  { label: '更新履歴', href: '/release-notes/', icon: 'history' },
  { label: '設定', href: '/settings/', icon: 'settings' },
];
