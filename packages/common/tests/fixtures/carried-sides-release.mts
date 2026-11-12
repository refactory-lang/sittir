// Run with `node --expose-gc --import tsx`: prints one JSON line reporting,
// for each storage, how an edit of a parsed node renders at its first render
// once the parsed node and its root were disposed, nothing else named them and
// they were collected, how many trees the edit then holds, and how the edit's
// render refuses once its source tree was released. A child process, because
// a collection can only be forced under `--expose-gc`.
import { createEngine } from '../../src/index.ts';
import { treeOf } from '../../src/tree-token.ts';
import { getActiveBackend } from '../../../rust/src/backend.ts';
import rust from '../../../rust/src/index.ts';

const status = getActiveBackend();
if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
const { native } = status;
if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;

async function settle(): Promise<void> {
	for (let round = 0; round < 10; round += 1) {
		collect();
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
}

function attempt(render: () => string): string {
	try {
		return render();
	} catch (error) {
		return `throws: ${(error as Error).message.replace(/tree \d+/, 'tree N')}`;
	}
}

type Block = { statements(): readonly unknown[]; readonly $with: { statements(...items: unknown[]): Block } };
const dispose = (node: unknown): void => (node as Partial<Disposable>)[Symbol.dispose]?.();
const report: Record<string, unknown> = {};

for (const nodeStorage of ['object', 'record'] as const) {
	const engine = await createEngine(rust, nodeStorage === 'object' ? { nodeStorage } : {});
	const b = engine.build;
	let tree = 0;
	const edit = (): Block => {
		const root = engine.parse('fn f() {\n    /* c */ ;\n    x();\n}\n');
		const block = (root.statements()[0] as unknown as { body(): Block }).body();
		tree = treeOf(block as object)!.id!;
		const [unit] = block.statements();
		const edited = block.$with.statements(unit, b.expressionStatement(b.callExpression({ function: b.identifier('y'), arguments: b.arguments() })));
		dispose(block);
		dispose(root);
		return edited;
	};
	await settle();
	const base = native.liveTreeCount();
	const collected = edit();
	await settle();
	const held = native.liveTreeCount() - base;
	const rendered = attempt(() => engine.render(collected as never).toString());
	const released = edit();
	const disposed = attempt(() => (native.disposeTree(tree), 'disposed'));
	report[nodeStorage] = { rendered, held, disposed, released: attempt(() => engine.render(released as never).toString()) };
	engine.dispose();
}
console.log(JSON.stringify(report));
