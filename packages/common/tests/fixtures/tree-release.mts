// Run with `node --expose-gc --import tsx`: prints one JSON line reporting
// which trees the rust addon still holds after collections. A child process,
// because a collection can only be forced under `--expose-gc`.
import { createEngine } from '../../src/index.ts';
import { getActiveBackend } from '../../../rust/src/backend.ts';
import rust from '../../../rust/src/index.ts';

const status = getActiveBackend();
if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
const { native } = status;
if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;

// A finalizer callback runs in a later task, never inside `gc()`, so each
// round yields to the event loop before counting again.
async function settle(target: number): Promise<void> {
	for (let round = 0; round < 20 && native.liveTreeCount() > target; round += 1) {
		collect();
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
}

type Named = { name(): unknown };
const engine = await createEngine(rust);
const base = native.liveTreeCount();
const report: Record<string, unknown> = {};

// A built node around a parsed leaf: nothing else of the leaf's tree stays reachable.
const held = (() => {
	const leaf = (engine.parse('fn g() {}\n').statements()[0] as unknown as Named).name();
	return engine.build.binaryExpression({ left: leaf as never, operator: '+', right: engine.build.identifier('y') });
})();
report.before = String(engine.render(held));
await settle(base);
report.heldCount = native.liveTreeCount() - base;
report.after = String(engine.render(held));

// A spread copy of a parsed leaf holds the leaf's tree as the leaf did.
const copied = (() => {
	const leaf = (engine.parse('fn c() {}\n').statements()[0] as unknown as Named).name() as object;
	const copy = { ...leaf };
	return engine.build.binaryExpression({ left: copy as never, operator: '+', right: engine.build.identifier('y') });
})();
await settle(base + 1);
report.copyCount = native.liveTreeCount() - base;
report.afterCopy = String(engine.render(copied));

// A render handle is lazy: it holds the tree of a node nothing else names
// until it is turned into text.
const handles: { pending?: { toString(): string } } = {};
(() => {
	handles.pending = engine.render(engine.parse('fn p() { a + b; }\n').statements()[0] as never);
})();
await settle(base + 3);
report.pendingCount = native.liveTreeCount() - base;
report.pending = String(handles.pending);
delete handles.pending;

// Trees nothing names are released.
for (let i = 0; i < 50; i += 1) engine.parse(`fn dropped${i}() {}\n`);
await settle(base + 2);
report.droppedCount = native.liveTreeCount() - base;

// A tree outlives a disposed engine, and is released once its node is gone.
const holder: { orphan?: unknown } = {};
await (async () => {
	const short = await createEngine(rust);
	holder.orphan = short.parse('fn orphan() {}\n').statements()[0];
	short.dispose();
})();
await settle(base + 3);
report.orphanCount = native.liveTreeCount() - base;
delete holder.orphan;
await settle(base + 2);
report.afterOrphanCount = native.liveTreeCount() - base;

console.log(JSON.stringify(report));
