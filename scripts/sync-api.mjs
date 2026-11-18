// Writes api/core.d.ts: the declarations a vendor compiles against (the built dist/types/core/index.d.ts, types.d.ts
// and chat-types.d.ts, joined, without their source map lines). `--check` fails when the build differs from it, so
// a change to a public type is a diff a reviewer reads.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const FILES = ['index', 'types', 'chat-types'].map((name) => `dist/types/core/${name}.d.ts`);
const OUT = 'api/core.d.ts';
const check = process.argv.includes('--check');
const api = FILES.map((file) => `// ${file}\n${readFileSync(file, 'utf8').replace(/^\/\/# sourceMappingURL=.*$/m, '').trimEnd()}\n`).join('\n');

if (!check) {
  mkdirSync('api', { recursive: true });
  writeFileSync(OUT, api);
  console.log(`api:sync: wrote ${OUT}`);
} else if (!existsSync(OUT) || readFileSync(OUT, 'utf8') !== api) {
  console.error('public types changed: run npm run api:sync and commit the diff');
  process.exit(1);
} else {
  console.log(`api:check: ${OUT} matches ${FILES.join(', ')}`);
}
