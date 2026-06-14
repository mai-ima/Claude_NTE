/** vitest 用 astro:content スタブ。実データは使わず、import を解決させるだけ。 */
export async function getCollection(): Promise<unknown[]> {
  return [];
}
export type CollectionEntry<_T = string> = {
  id: string;
  data: Record<string, unknown>;
};
