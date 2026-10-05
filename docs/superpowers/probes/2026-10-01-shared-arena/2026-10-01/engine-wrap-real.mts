/** What the engine API adds around the language's own builders, guards and render, on the real rust package. */
import { performance } from 'node:perf_hooks';
const WT = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = await import(`${WT}/packages/common/src/index.ts`);
const { inEngine, engineOf } = await import(`${WT}/packages/common/src/engine-scope.ts`);
const { isNode, isParsedNode } = await import(`${WT}/packages/common/src/utils.ts`);
const { toTransportData } = await import(`${WT}/packages/common/src/transport-data.ts`);
const rust = (await import(`${WT}/packages/rust/src/index.ts`)).default;
const hooks = await rust.load();
const engine = await createEngine(rust);
const handle = { current: engine };

const time = (fn: () => unknown, n = 20_000): number => {
	for (let i = 0; i < 5_000; i++) fn();
	let best = Infinity;
	for (let r = 0; r < 9; r++) { const t0 = performance.now(); for (let i = 0; i < n; i++) fn(); best = Math.min(best, ((performance.now() - t0) / n) * 1e6); }
	return best;
};
const row = (label: string, through: number, direct: number) => console.log(`${label.padEnd(58)} ${through.toFixed(0).padStart(6)} ns   ${direct.toFixed(0).padStart(6)} ns   ${(through - direct).toFixed(0).padStart(5)} ns`);
console.log(`${''.padEnd(58)} engine API    language    added`);

const b = engine.build, raw = hooks.build;
const x = b.identifier('x'), y = b.identifier('y');
row("build.identifier('x')", time(() => b.identifier('x')), time(() => inEngine(handle, () => raw.identifier('x'))));
row('build.binaryExpression({ left, operator, right })', time(() => b.binaryExpression({ left: x, operator: '+', right: y })), time(() => inEngine(handle, () => raw.binaryExpression({ left: x, operator: '+', right: y }))));
row("build.lineComment.regular(' c')", time(() => b.lineComment.regular(' c')), time(() => inEngine(handle, () => raw.lineComment.regular(' c'))));
row('build.binaryExpression.strict({ … })', time(() => b.binaryExpression.strict({ left: x, operator: engine.kinds.Plus ?? '+', right: y } as never)), time(() => inEngine(handle, () => raw.binaryExpression.strict({ left: x, operator: engine.kinds.Plus ?? '+', right: y } as never))));
const guardName = Object.keys(hooks.is).find((key) => /^identifier$/i.test(key)) ?? Object.keys(hooks.is).find((key) => typeof hooks.is[key] === 'function')!;
const engineGuard = engine.is[guardName], languageGuard = hooks.is[guardName];
row(`is.${guardName}(node)`, time(() => engineGuard(x), 200_000), time(() => languageGuard(x), 200_000));
row('isNode(node)', time(() => engine.isNode(x), 200_000), time(() => isNode(x), 200_000));

// render: the walk that finds which engine read a node's parsed parts
function collectReaders(value: unknown, readers: Set<unknown>): void {
	if (Array.isArray(value)) { for (const item of value) collectReaders(item, readers); }
	else if (value !== null && typeof value === 'object' && !isNode(value)) { for (const item of Object.values(value)) collectReaders(item, readers); }
	else if (value !== null && typeof value === 'object') {
		if (isParsedNode(value)) { const reader = engineOf(value); if (reader !== undefined) readers.add(reader); return; }
		for (const [key, item] of Object.entries(value)) { if (key.startsWith('_') || key === '$other' || key === '$_trivia') collectReaders(item, readers); }
	}
}
const chain = (depth: number): unknown => depth === 0 ? b.identifier('a') : b.binaryExpression({ left: chain(depth - 1), operator: '+', right: b.callExpression({ function: b.identifier('f'), arguments: [b.identifier('x'), b.identifier('y')] }) });
const trees: unknown[] = [];
for (let i = 0; i < 400; i++) trees.push(b.letDeclaration({ pattern: b.identifier('v'), value: chain(6) }));
const count = (value: unknown): number => { if (Array.isArray(value)) return value.reduce((n: number, v) => n + count(v), 0); if (value === null || typeof value !== 'object') return 0; const rec = value as Record<string, unknown>; let n = typeof rec.$type === 'number' ? 1 : 0; for (const key of Object.keys(rec)) if (key.charCodeAt(0) === 95) n += count(rec[key]); return n; };
const shaped = (value: unknown): unknown => { if (Array.isArray(value)) return value.map(shaped); if (value === null || typeof value !== 'object') return value; const out: Record<string, unknown> = {}; for (const key of Object.keys(value)) { const item = (value as Record<string, unknown>)[key]; out[key] = key.charCodeAt(0) === 95 ? shaped(item) : item; } return out; };
const shapedTrees = trees.map(shaped);
const nodes = trees.reduce((n: number, t) => n + count(t), 0);
const over = (list: unknown[], fn: (tree: unknown) => unknown): number => { let best = Infinity; for (let r = 0; r < 9; r++) { const t0 = performance.now(); for (let k = 0; k < 5; k++) for (const tree of list) fn(tree); best = Math.min(best, (performance.now() - t0) / 5); } return (best * 1e6) / nodes; };
for (const [label, list] of [['as built today', trees], ['same data, shared shape', shapedTrees]] as const) {
	const walk = over(list, (tree) => collectReaders(tree, new Set()));
	const project = over(list, (tree) => toTransportData(tree));
	const handleOnly = over(list, (tree) => engine.render(tree as never));
	const text = over(list, (tree) => String(engine.render(tree as never)));
	console.log(`render, ${label}: to text ${text.toFixed(0)} ns per node; collectReaders ${walk.toFixed(0)}, toTransportData ${project.toFixed(0)}, engine.render before the native call ${handleOnly.toFixed(0)}, native call ${(text - handleOnly).toFixed(0)}`);
}
