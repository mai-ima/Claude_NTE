/** ツールのレジストリ。ここに登録するだけでハブ一覧と /tools/[id] に反映される。 */
import type { FunctionComponent } from 'preact';
import Notes from './Notes';
import Checklist from './Checklist';
import Timer from './Timer';
import Probability from './Probability';
import Stamina from './Stamina';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide アイコン名
  Component: FunctionComponent;
}

export const TOOLS: ToolDef[] = [
  {
    id: 'checklist',
    name: 'チェックリスト / 進行管理',
    description: 'デイリー消化・収集・育成などの進捗をチェックで管理。',
    icon: 'list-checks',
    Component: Checklist,
  },
  {
    id: 'timer',
    name: 'タイマー / カウンター',
    description: 'カウントダウンと、周回数・素材数を数える汎用カウンター。',
    icon: 'timer',
    Component: Timer,
  },
  {
    id: 'probability',
    name: '確率 / 期待値 計算',
    description: 'ガチャ等の「1回以上当たる確率」「期待試行回数」を一般式で算出。',
    icon: 'percent',
    Component: Probability,
  },
  {
    id: 'stamina',
    name: 'スタミナ / リソース計算',
    description: '現在値・最大値・回復間隔から全回復までの時間と予定時刻を計算。',
    icon: 'battery-charging',
    Component: Stamina,
  },
  {
    id: 'notes',
    name: 'メモ / ノート',
    description: '攻略の覚え書きを複数保存（端末内に自動保存）。',
    icon: 'notebook-pen',
    Component: Notes,
  },
];

export function getTool(id: string): ToolDef | undefined {
  return TOOLS.find((t) => t.id === id);
}
