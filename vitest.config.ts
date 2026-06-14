import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// astro:content（仮想モジュール）は単体テストでは使えないため、getCollection を
// スタブへ差し替える。これで content.ts の純関数（phaseOf/hrefOf 等）を import できる。
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: {
      'astro:content': fileURLToPath(new URL('./test/stubs/astro-content.ts', import.meta.url)),
    },
  },
});
