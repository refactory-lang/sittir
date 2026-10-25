// Usage: node [--stack-size=<kB>] --import tsx probe.mts <checkout> <object|records> <depth> [left|paren]
// Renders <depth> nested binary expressions (or parenthesized expressions)
// in an expression statement and prints one JSON line: the text length, or
// the refusal and the frame that raised it. A native stack overflow ends the
// process instead (exit 139), so run one depth per process.
const [W, storage = 'object', arg = '4000', form = 'left'] = process.argv.slice(2);
const common = `${W}/packages/common/src`;
let rs: any;
if (storage === 'records') {
	const arena = (await import(`${W}/packages/rust/src/arena.ts`)).default;
	rs = await arena.createEngine();
	const { useRecordConstruction } = await import(`${common}/create-engine.ts`);
	useRecordConstruction(rs, await import(`${W}/packages/rust/src/factories/records.ts`));
} else {
	const { createEngine } = await import(`${common}/index.ts`);
	rs = await createEngine((await import(`${W}/packages/rust/src/index.ts`)).default);
}
const b = rs.build as any;
let e = b.identifier('x');
for (let at = 0; at < Number(arg); at += 1) e = form === 'left' ? b.binaryExpression({ left: e, operator: '+', right: b.identifier('y') }) : b.parenthesizedExpression(e);
try {
	const text: string = b.expressionStatement(e).$render();
	console.log(JSON.stringify({ storage, arg, form, length: text.length }));
} catch (error) {
	const stack = String((error as Error).stack).split('\n');
	console.log(JSON.stringify({ storage, arg, form, refusal: stack[0]?.slice(0, 160), at: stack[1]?.trim().slice(0, 140) }));
}
