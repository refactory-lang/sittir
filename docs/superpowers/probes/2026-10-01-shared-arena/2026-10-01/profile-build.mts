const REPO = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = await import(`${REPO}/packages/common/src/index.ts`);
const language = (await import(`${REPO}/packages/rust/src/index.ts`)).default;
const rs = await createEngine(language);
const b = rs.build;
const a = b.identifier('a'), c = b.identifier('b');
const until = Date.now() + 5000;
let n = 0, keep;
while (Date.now() < until) {
  for (let i = 0; i < 500; i++) { keep = b.binaryExpression.strict({ left: a, operator: '+', right: c }); keep = b.identifier('x'); }
  n += 1000;
}
console.log('built', n, 'nodes', typeof keep);
rs.dispose();
