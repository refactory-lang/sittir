// Run with `node --expose-gc --import tsx`: prints one JSON line reporting,
// for object storage, whose parses keep their trees, whether what the rust
// addon's live trees hold natively
// and what their reports have told V8 agree while trees are parsed, rendered
// and edited, and whether both return to where they started once every tree
// is released: one by `disposeTree`, the rest by collection once the engine
// that parsed and edited them is disposed and unreachable. A child process,
// because a collection can only be forced under `--expose-gc`.
import { createEngine } from '../../src/index.ts';
import { treeOf } from '../../src/tree-token.ts';
import { getActiveBackend } from '../../../rust/src/backend.ts';
import rust from '../../../rust/src/index.ts';

const status = getActiveBackend();
if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
const { native } = status;
if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;

async function settle(target: number): Promise<void> {
	for (let round = 0; round < 20 && native.liveTreeCount() > target; round += 1) {
		collect();
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
}

const SOURCES = ['fn f(a: u8) -> u8 {\n    // keep\n    a + 1\n}\n', 'fn s() -> S {\n    S { x: 1, y: 2 }\n}\n', 'fn g() {\n    let v = vec![1, 2, 3];\n    v.len();\n}\n'];
type Item = { readonly $with: { name(value: unknown): object } };
type Root = { statements(): readonly unknown[] };
type Memory = { trees: number; counted: number; reported: number };
const agrees = (memory: Memory): boolean => memory.counted === memory.reported;
const report: Record<string, unknown> = {};

async function run(): Promise<{ during: Memory; disposed: Memory; engineGone: Memory }> {
	const engine = await createEngine(rust, { nodeStorage: 'object' });
	const held = SOURCES.map((source) => {
		const root = engine.parse(source) as unknown as Root;
		String(engine.render(root as never));
		const edited = (root.statements()[0] as Item).$with.name(engine.build.identifier('z'));
		String(engine.render(edited as never));
		return [root, edited] as const;
	});
	const [first] = held;
	if (first === undefined) throw new Error('no sources');
	const during = native.treeMemory();
	native.disposeTree(treeOf(first[0])!.id!);
	const disposed = native.treeMemory();
	engine.dispose();
	return { during, disposed, engineGone: native.treeMemory() };
}

{
	await settle(0);
	const start = native.treeMemory();
	const { during, disposed, engineGone } = await run();
	await settle(start.trees);
	const end = native.treeMemory();
	report.object = {
		grew: during.counted > start.counted,
		agrees: agrees(during),
		disposeTree: disposed.trees === during.trees - 1 && disposed.counted < during.counted && agrees(disposed),
		engineDispose: engineGone.trees === disposed.trees && agrees(engineGone),
		back: end.trees === start.trees && end.counted === start.counted && end.reported === start.reported
	};
}
report.final = native.treeMemory();
console.log(JSON.stringify(report));
