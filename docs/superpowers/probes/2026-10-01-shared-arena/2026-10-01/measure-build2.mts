import { performance } from 'node:perf_hooks';
const REPO = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = await import(`${REPO}/packages/common/src/index.ts`);
const language = (await import(`${REPO}/packages/rust/src/index.ts`)).default;
const rs = await createEngine(language);
const b = rs.build;
function perCall(n, fn) { for (let i = 0; i < 3000; i++) fn(); const t0 = performance.now(); let k; for (let i = 0; i < n; i++) k = fn(); void k; return ((performance.now() - t0) / n) * 1e6; }
const a = b.identifier('a'), c = b.identifier('b');
const rows = [
  ['loose, prebuilt children: binaryExpression({left: node, operator: "+", right: node})', () => b.binaryExpression({ left: a, operator: '+', right: c })],
  ['strict, prebuilt children: binaryExpression.strict(...)', () => b.binaryExpression.strict({ left: a, operator: '+', right: c })],
  ['identifier("x")', () => b.identifier('x')],
  ['identifier.strict("x")', () => b.identifier.strict('x')],
  ['$with on a built node: fn.$with.name(id)', (() => { const fn = b.functionItem({ name: 'f', parameters: b.parameters(), body: b.block() }); return () => fn.$with.name(a); })()],
];
for (const [label, make] of rows) {
  try { make(); console.log(`${label}: ${perCall(30000, make).toFixed(0)} ns`); }
  catch (e) { console.log(`${label}: skipped (${String(e.message).slice(0, 110)})`); }
}
rs.dispose();
