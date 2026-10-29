// Sahifa ochilganda yuklanadigan hajmni tekshiradi: dist/index.js va u statik import qiladigan chunk'lar (gzip -9).
// CI'da ishlaydi: kimdir bilmasdan three.js'ni asosiy faylga tortib kirsa, PR qizil bo'ladi.
//   node scripts/check-size.mjs [limitKB=5]
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const LIMIT_KB = Number(process.argv[2] ?? 5);
const dir = 'dist';

// faqat statik importlar: dinamik import('./renderer-*.js') keyinroq yuklanadi va hisobga kirmaydi
const seen = new Set();
function collect(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const code = readFileSync(join(dir, file), 'utf8');
  for (const m of code.matchAll(/(?:^|[;\n}])\s*import\s*(?:[^'"()]*?from\s*)?['"]\.\/([^'"]+)['"]/g)) collect(m[1]);
}
collect('index.js');

const bytes = [...seen].reduce((sum, f) => sum + gzipSync(readFileSync(join(dir, f)), { level: 9 }).length, 0);
const kb = bytes / 1024;
console.log(`first load: ${kb.toFixed(2)} KB gzip (${[...seen].join(', ')}), limit ${LIMIT_KB} KB`);
if (kb > LIMIT_KB) {
  console.error(`Too big: the element must stay under ${LIMIT_KB} KB. Is three.js imported statically somewhere?`);
  process.exit(1);
}
