// Post-build step that makes one package work for every consumer toolchain:
//   • dist/types/**/*.d.cts  — CommonJS twins of the ESM declarations, so `require` consumers under
//     node16/nodenext get CJS-flavoured types instead of an "ES module cannot be required" error.
//   • <subpath>/package.json — folder shims for resolvers that ignore `exports` (webpack 4, Jest < 28,
//     TypeScript `moduleResolution: node`), mirroring what the exports map says.
// Then it checks that dist carries no chat code (the chat is the Knock tag's: the SDK only asks the tag for it), that
// every file in dist parses as ES2019, and that the public declarations hold no `any`.
// String work, plus acorn for the parse: TypeScript 7 ships no JS compiler API to lean on.
import { createRequire } from 'node:module';
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

// The chat is the Knock tag's (Knock.loadChat()): no file in dist carries chat code, and no chat file is left in it.
const CHAT_CODE = /react\.element|data-knock-chat-host|createChatHolder|mountChat/;
const dist = (file) => readFileSync(join('dist', file), 'utf8');
const scripts = readdirSync('dist').filter((f) => /\.(c|m)?js$/.test(f));
// Every file in dist parses as ES2019 (webpack 4's acorn 6 rejects `?.` and `??`).
const require = createRequire(import.meta.url);
const { parse } = require('acorn');
function es2019(file) {
  for (const sourceType of ['module', 'script']) {
    try {
      parse(dist(file), { ecmaVersion: 2019, sourceType });
      return true;
    } catch {
      // the other source type, then a broken rail
    }
  }
  return false;
}
// What a vendor compiles against, comments stripped: they may say what they like.
const PUBLIC_TYPES = ['index', 'types', 'chat-types'].map((name) => `${types}/core/${name}.d.ts`);
const declaration = (file) => readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, '$1');
const rails = [
  [!scripts.some((f) => /^chat|\.mjs$/.test(f)), 'dist holds no chat file (chat*.js, *.mjs): the chat is the Knock tag\'s'],
  ...scripts.map((f) => [!CHAT_CODE.test(dist(f)), `dist/${f} carries no chat code`]),
  ...scripts.map((f) => [!/\bimport\(/.test(dist(f)), `dist/${f} loads no file of its own with import()`]),
  ...scripts.map((f) => [es2019(f), `dist/${f} is ES2019 (no ?., ?? or later syntax)`]),
  ...PUBLIC_TYPES.map((f) => [!/\bany\b/.test(declaration(f)), `${f} holds no any`]),
];
const broken = rails.filter(([ok]) => !ok).map(([, rail]) => rail);
if (broken.length) {
  console.error(`finalize-dist: ${broken.length} rail(s) broken:\n  ${broken.join('\n  ')}`);
  process.exit(1);
}
console.log(`finalize-dist: ${rails.length} rails hold`);
