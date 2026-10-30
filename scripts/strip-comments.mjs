// npm build siqilmagan, esbuild esa ba'zi izohlarni (JSDoc, // src/... belgilari) qoldiradi.
// Paketga izoh tushmasin: acorn bilan haqiqiy izohlarni topib o'chiramiz, satr va regex ichidagilarga tegmaydi.
//   node scripts/strip-comments.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'acorn';

const dir = 'dist';

for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const path = join(dir, file);
  const code = readFileSync(path, 'utf8');
  const ranges = [];
  parse(code, { ecmaVersion: 'latest', sourceType: 'module', onComment: (_block, _text, start, end) => ranges.push([start, end]) });
  if (!ranges.length) continue;

  let out = '';
  let at = 0;
  for (let [start, end] of ranges) {
    // Izoh qatorni to'liq egallagan bo'lsa, qatorning o'zi ham o'chadi
    const lineStart = code.lastIndexOf('\n', start - 1) + 1;
    const after = /^[ \t]*(\r?\n|$)/.exec(code.slice(end));
    if (lineStart >= at && !code.slice(lineStart, start).trim() && after) {
      start = lineStart;
      end += after[0].length;
    }
    out += code.slice(at, start);
    at = end;
  }
  out += code.slice(at);
  out = out.replace(/[ \t]+$/gm, '');

  parse(out, { ecmaVersion: 'latest', sourceType: 'module' });
  writeFileSync(path, out);
  console.log(`${file}: ${ranges.length} comments removed`);
}
