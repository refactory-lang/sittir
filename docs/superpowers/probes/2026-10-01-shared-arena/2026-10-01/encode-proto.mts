/**
 * Feasibility probe: write rebuilt node data into a flat u32 buffer plus a UTF-8 string pool,
 * and compare with today's projection (`toTransportData`), which builds a second object tree.
 *
 * The encoder here is generic (it enumerates keys and looks slot ids up in a map); generated
 * per-kind writers would know each kind's slots and skip both, so this is an upper bound.
 */
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const REPO = process.env.SITTIR_ROOT ?? process.cwd();
const [grammar = 'rust'] = process.argv.slice(2);
const { toTransportData } = await import(`${REPO}/packages/common/src/transport-data.ts`);

const fixtures = (
  JSON.parse(readFileSync(`${REPO}/rust/crates/sittir-${grammar}/test-fixtures.json`, 'utf8')) as {
    kind: string;
    input: unknown;
  }[]
).filter((f) => f.kind === 'render');
const inputs = fixtures.map((f) => f.input);

import { Arena } from './encode-runtime.mts';

function countValues(value: unknown): number {
  if (Array.isArray(value)) return value.reduce((n: number, v) => n + countValues(v), 0);
  if (value === null || typeof value !== 'object')
    return typeof value === 'string' || typeof value === 'number' ? 1 : 0;
  let n = 1;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith('_') || key === '$other') n += countValues(child);
  }
  return n;
}
const values = inputs.reduce((n: number, i) => n + countValues(i), 0);

function loop(n: number, fn: () => void): number {
  for (let i = 0; i < 5; i++) fn();
  const t0 = performance.now();
  for (let i = 0; i < n; i++) fn();
  return (performance.now() - t0) / n;
}

const arena = new Arena();
let words = 0;
let poolBytes = 0;
const encode = loop(60, () => {
  words = 0;
  poolBytes = 0;
  for (const input of inputs) {
    arena.reset();
    arena.node(input as Record<string, unknown>);
    words += arena.next;
    poolBytes += arena.nextByte;
  }
});
const project = loop(60, () => {
  for (const input of inputs) toTransportData(input);
});

console.log(`# ${grammar}: ${inputs.length} fixtures, ${values} slot values`);
console.log(`today, projection to a second object tree: ${((project * 1e6) / values).toFixed(0)} ns per slot value`);
console.log(`generic arena encoder (upper bound):       ${((encode * 1e6) / values).toFixed(0)} ns per slot value`);
console.log(
  `arena size: ${words * 4 + poolBytes} bytes for all fixtures (${((words * 4 + poolBytes) / values).toFixed(0)} bytes per slot value)`
);
