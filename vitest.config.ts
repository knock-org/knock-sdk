import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { knockai: new URL('./src/core/index.ts', import.meta.url).pathname } },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: { provider: 'v8', include: ['src/**'] },
  },
});
