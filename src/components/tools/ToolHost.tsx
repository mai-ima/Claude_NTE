/** ツールをidで選んで描画するホスト。client:only で1つ読み込めば良いようにする。 */
import { getTool } from './registry';

export default function ToolHost({ id }: { id: string }) {
  const tool = getTool(id);
  if (!tool) {
    return <p class="empty">ツールが見つかりませんでした。</p>;
  }
  const Tool = tool.Component;
  return <Tool />;
}
