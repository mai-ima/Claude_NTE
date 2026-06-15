/** ツールのレジストリ。ここに登録するだけでハブ一覧と /tools/[id] に反映される。 */
import type { FunctionComponent } from 'preact';
import Notes from './Notes';
import Checklist from './Checklist';
import Timer from './Timer';
import GachaPity from './GachaPity';
import GachaDashboard from './GachaDashboard';
import GachaSim from './GachaSim';
import ReactionChart from './ReactionChart';
import Planner from './Planner';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide アイコン名
  Component: FunctionComponent;
}

export const TOOLS: ToolDef[] = [
  {
    id: 'gacha-dashboard',
    name: 'ガチャ計画ダッシュボード',
    description: '天井・所持円石/サイコロ・1日収入・目標から、引ける連数・到達日・累積確率を1画面に統合（旧「確率グラフ」「予算プランナー」を統合）。',
    icon: 'layout-dashboard',
    Component: GachaDashboard,
  },
  {
    id: 'gacha-sim',
    name: 'ガチャ・シミュレーター',
    description: 'すごろく式ボードを引く演出付きシミュレーター（70連転換／90連確定・すり抜け無し）。天井・引き運の統計も表示。',
    icon: 'dices',
    Component: GachaSim,
  },
  {
    id: 'gacha-pity',
    name: 'ガチャ天井トラッカー',
    description: 'スカボロー市場の天井（70連でボード転換／90連で確定・すり抜け無し）を管理。確定まで・必要円石を表示。',
    icon: 'dice-6',
    Component: GachaPity,
  },
  {
    id: 'reaction-chart',
    name: '異能連環チェッカー',
    description: '属性リングと反応一覧表。属性をタップして起こせる反応（創生/覆紋/濁燃/暗星/浸染/延滞）を確認。',
    icon: 'atom',
    Component: ReactionChart,
  },
  {
    id: 'planner',
    name: '育成・スタミナ計画',
    description: '本性ピクセルの回復バー／周回可能数と、シティスタミナの週リセット、デイリー/ウィークリーのタスク管理。',
    icon: 'calendar-check',
    Component: Planner,
  },
  {
    id: 'checklist',
    name: 'チェックリスト / 進行管理',
    description: '収集・育成などの進捗を進捗バー付きで管理。',
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
