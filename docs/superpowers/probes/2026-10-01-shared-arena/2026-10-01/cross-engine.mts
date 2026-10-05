/** What happens today when a node holds parts parsed by another engine. */
const WT = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = await import(`${WT}/packages/common/src/index.ts`);
const rust = (await import(`${WT}/packages/rust/src/index.ts`)).default;
const a = await createEngine(rust);
const other = await createEngine(rust);
const attempt = (label: string, run: () => unknown) => {
	try { console.log(`${label.padEnd(64)} -> ${JSON.stringify(String(run()))}`); }
	catch (error) { console.log(`${label.padEnd(64)} -> throws: ${(error as Error).message.slice(0, 150)}`); }
};
const parsedByOther = () => other.parse('fn f() { a + b; }\n').statements()[0].name();
const leaf = a.build.identifier('y');

const passed = parsedByOther();
const loose = a.build.binaryExpression({ left: passed, operator: '+', right: leaf });
const strict = a.build.binaryExpression.strict({ left: passed, operator: a.kinds.Plus ?? '+', right: leaf } as never);
console.log('loose builder stores the node it was given:', loose.left() === passed, '| stored value has $engine:', typeof loose.left().$engine === 'function');
console.log('strict builder stores the node it was given:', strict.left() === passed, '| stored value has $engine:', typeof strict.left().$engine === 'function');

attempt('a.render(built by a, child parsed by other, loose)', () => a.render(loose));
attempt('a.render(built by a, child parsed by other, strict)', () => a.render(strict));
attempt('node.$render() of the same, loose', () => loose.$render());
attempt('other.render(built by a, child parsed by other, strict)', () => other.render(strict));

// a parsed node of engine a, edited to hold a child parsed by the other engine
const rootA = a.parse('fn g() { c; }\n');
const editedA = rootA.statements()[0].$with.name(parsedByOther());
attempt('a.render(parsed by a, edited to hold a child parsed by other)', () => a.render(editedA));
// same engine throughout, for reference
const own = a.parse('fn f() { a + b; }\n').statements()[0].name();
attempt('a.render(built by a, child parsed by a)', () => a.render(a.build.binaryExpression({ left: own, operator: '+', right: leaf })));
