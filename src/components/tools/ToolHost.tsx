/** ツールをidで選んで描画するホスト。client:only で1つ読み込めば良いようにする。
 *  ツール内で例外が発生しても白画面化せず、再試行できるエラーバウンダリで包む。 */
import { useErrorBoundary } from 'preact/hooks';
import { getTool } from './registry';
import { ToolError } from './withBoundary';

export default function ToolHost({ id }: { id: string }) {
  const [error, resetError] = useErrorBoundary();

  if (error) return <ToolError onRetry={() => resetError()} />;

  const tool = getTool(id);
  if (!tool) {
    return <p class="empty">ツールが見つかりませんでした。</p>;
  }
  const Tool = tool.Component;
  return <Tool />;
}
