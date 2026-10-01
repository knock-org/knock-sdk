// Post-build step that makes one package work for every consumer toolchain:
//   • dist/types/**/*.d.cts  — CommonJS twins of the ESM declarations, so `require` consumers under
//     node16/nodenext get CJS-flavoured types instead of an "ES module cannot be required" error.
//   • <subpath>/package.json — folder shims for resolvers that ignore `exports` (webpack 4, Jest < 28,
//     TypeScript `moduleResolution: node`), mirroring what the exports map says.
// Pure string work: TypeScript 7 ships no JS compiler API to lean on.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const types = 'dist/types';

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

let twins = 0;
for (const file of walk(types).filter((f) => f.endsWith('.d.ts'))) {
  const cts = readFileSync(file, 'utf8')
    .replace(/(from\s+|import\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\.js\2/g, '$1$2$3.cjs$2')
    .replace(/^\/\/# sourceMappingURL=.*$/m, '');
  writeFileSync(file.replace(/\.d\.ts$/, '.d.cts'), cts);
  twins++;
}

export const SUBPATHS = {
  react: 'frameworks/react/index',
  vue: 'frameworks/vue/index',
  angular: 'frameworks/angular/index',
  testing: 'testing/index',
  contract: 'core/contract',
};

for (const [name, typesPath] of Object.entries(SUBPATHS)) {
  mkdirSync(name, { recursive: true });
  const up = relative(name, '.') || '.';
  const shim = {
    private: true,
    main: `${up}/dist/${name}.cjs`,
    module: `${up}/dist/${name}.js`,
    types: `${up}/dist/types/${typesPath}.d.ts`,
    sideEffects: false,
  };
  writeFileSync(join(name, 'package.json'), JSON.stringify(shim, null, 2) + '\n');
}

console.log(`finalize-dist: ${twins} .d.cts twins, ${Object.keys(SUBPATHS).length} subpath shims (${dirname(types)})`);
