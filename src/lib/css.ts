/**
 * CSS カスタムプロパティ（`--xxx`）を含む style オブジェクトを作るヘルパ。
 * preact の style 属性の型はカスタムプロパティを直接許容しないため、
 * その値の組み立てをこのヘルパ1か所に集約し、呼び出し側の `as any` を排除する。
 *
 * 例: style={cssVars({ '--el': hue })}
 *     style={cssVars({ '--el': c.el }, { margin: '0 auto 4px' })}
 */
export function cssVars(
  vars: Record<`--${string}`, string | number>,
  base?: Record<string, string | number>,
): Record<string, string | number> {
  return { ...(base ?? {}), ...vars };
}
