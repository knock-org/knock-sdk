import { defineConfig } from 'tsup';

const shared = { sourcemap: true, minify: true, treeshake: true, splitting: false, target: 'es2019' } as const;

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/core/index.ts',
      vue: 'src/frameworks/vue/index.ts',
      angular: 'src/frameworks/angular/index.ts',
      testing: 'src/testing/index.ts',
      contract: 'src/core/contract.ts',
    },
    format: ['esm', 'cjs'],
    dts: false, // TS 7 has no JS API; declarations come from `tsc -p tsconfig.build.json`
    clean: true,
    external: ['@knock-ai/sdk', 'react', 'vue', '@angular/core', 'rxjs'],
  },
  // tsup's rollup treeshake pass strips 'use client'; without it a Next.js server component importing @knock-ai/sdk/react breaks.
  {
    ...shared,
    treeshake: false,
    entry: { react: 'src/frameworks/react/index.ts' },
    format: ['esm', 'cjs'],
    external: ['@knock-ai/sdk', 'react'],
  },
  // Browser globals for the CDN path: the stub vendors paste, and the facade it loads.
  {
    ...shared,
    entry: { snippet: 'src/core/snippet.ts', 'knockai.iife': 'src/core/iife.ts' },
    format: ['iife'],
    outExtension: () => ({ js: '.js' }),
  },
]);
