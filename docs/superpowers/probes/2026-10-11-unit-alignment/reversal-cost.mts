import { createEngine } from '@sittir/common';
import typescript from '../../../../packages/typescript/src/index.ts';

const ts = await createEngine(typescript);
const n = Number(process.argv[2] ?? 4000);
const src = (process.env.NOUNIT ? '' : '// A\n;\n') + Array.from({ length: n }, (_, i) => `x${i}();`).join('\n') + '\n';
const root = ts.parse(src);
const stmts = root.statements();
const before = process.memoryUsage().heapUsed;
const t = performance.now();
const out = root.$with.statements(...[...stmts].reverse()).$render();
console.log(JSON.stringify({ n, unit: !process.env.NOUNIT, ms: Math.round(performance.now() - t), heapMB: Math.round((process.memoryUsage().heapUsed - before) / 1e6), tail: out.slice(-12) }));
