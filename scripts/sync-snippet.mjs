// Inlines the built CDN stub (dist/snippet.js) into every doc that shows it, between
// `<!-- knockai-snippet:start -->` / `<!-- knockai-snippet:end -->`. `--check` fails if any is stale,
// so the pasted snippet can never drift from the tested build again.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FILES = ['README.md', 'docs/quickstart.md', 'skills/install-knock-sdk/references/cdn.md'];
const START = '<!-- knockai-snippet:start -->';
const END = '<!-- knockai-snippet:end -->';
const check = process.argv.includes('--check');
const stub = readFileSync('dist/snippet.js', 'utf8').replace(/\/\/# sourceMappingURL=\S*/g, '').trim();
const block = `${START}\n\`\`\`html\n<script>\n${stub}\nknockai.init({ tagId: 'YOUR_TAG_ID' });\n</script>\n\`\`\`\n${END}`;

let stale = 0;
for (const file of FILES) {
  const src = readFileSync(file, 'utf8');
  const [before, rest] = src.split(START);
  if (rest === undefined) throw new Error(`${file}: missing ${START}`);
  const after = rest.slice(rest.indexOf(END) + END.length);
  const next = before + block + after;
  if (next === src) continue;
  stale++;
  if (!check) writeFileSync(file, next);
  console.log(`${check ? 'stale' : 'updated'}: ${file}`);
}

// Hand-written jsDelivr links (docs, examples, the install skill) must pin the range the stub loads.
const range = stub.match(/npm\/knockai@([^/]+)\//)[1];
const pinned = /cdn\.jsdelivr\.net\/npm\/knockai@[^/"'\s]+\//g;
const linked = ['docs', 'examples', 'skills'].flatMap((dir) =>
  readdirSync(dir, { recursive: true }).filter((f) => /\.(md|html)$/.test(f)).map((f) => join(dir, f)),
);
for (const file of ['README.md', 'llms.txt', ...linked]) {
  const src = readFileSync(file, 'utf8');
  const next = src.replace(pinned, `cdn.jsdelivr.net/npm/knockai@${range}/`);
  if (next === src) continue;
  stale++;
  if (!check) writeFileSync(file, next);
  console.log(`${check ? 'stale' : 'updated'}: ${file} (jsDelivr range must be knockai@${range})`);
}
if (check && stale) process.exit(1);
