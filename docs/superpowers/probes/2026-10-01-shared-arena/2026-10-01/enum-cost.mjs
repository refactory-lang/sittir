// What key enumeration costs by the number of named keys, with and without index properties.
import { performance } from 'node:perf_hooks';
const which = process.argv[2];
const fast = new Function('o', 'return %HasFastProperties(o)');
const literal = (count) => new Function('f', `return { ${Array.from({ length: count }, (_, i) => (i < 8 ? `$k${i}: ${i}` : `name${i}: f`)).join(', ')} };`);
const shared = () => 1;
const lit13 = literal(13), lit45 = literal(45);
const named = (count) => (count === 13 ? lit13 : lit45)(shared);
const make = { n13: () => named(13), n45: () => named(45), n13idx: () => { const o = named(13); o[0] = 1; o[1] = 2; o[2] = 3; return o; }, n45idx: () => { const o = named(45); o[0] = 1; o[1] = 2; o[2] = 3; return o; } }[which];
if (make === undefined) { console.log('n13 n13idx n45 n45idx'); process.exit(0); }
const nodes = Array.from({ length: 1024 }, make);
const time = (fn) => { let best = Infinity; for (let r = 0; r < 7; r++) { let acc = 0; const t0 = performance.now(); for (let i = 0; i < 400_000; i++) acc += fn(nodes[i & 1023]); best = Math.min(best, ((performance.now() - t0) / 400_000) * 1e6); if (acc === 0) throw new Error('x'); } return best; };
const entries = (node) => { let n = 0; for (const [key, raw] of Object.entries(node)) { if (typeof raw === 'function') continue; n += key.length; } return n; };
const forIn = (node) => { let n = 0; for (const key in node) { const c = key.charCodeAt(0); if (c !== 36 && c !== 95) continue; n += key.length + (typeof node[key] === 'function' ? 0 : 1); } return n; };
const keys = (node) => { let n = 0; const list = Object.keys(node); for (let i = 0; i < list.length; i++) { const key = list[i]; const c = key.charCodeAt(0); if (c !== 36 && c !== 95) continue; n += key.length; } return n; };
time(entries); time(forIn); time(keys);
console.log(`${which.padEnd(7)} fast ${nodes.filter(fast).length}/1024  Object.entries ${time(entries).toFixed(0).padStart(5)} ns   for-in by prefix ${time(forIn).toFixed(0).padStart(5)} ns   Object.keys by prefix ${time(keys).toFixed(0).padStart(5)} ns`);
