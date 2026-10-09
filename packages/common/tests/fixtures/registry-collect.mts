// Run with `node --expose-gc --import tsx`: prints one JSON line reporting
// whether a wrapper only a query reached was collected, and whether the
// wrapper every route returns afterwards is one object. A child process,
// because a collection can only be forced under `--expose-gc`.
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';

if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;

type Let = { readonly $type: number };
const engine = await createEngine(rust);
const isLet = (node: unknown): node is Let => engine.is.letDeclaration(node as never);
const root = engine.parse('fn a() {}\nfn b() { let x = 1; }\n', { depth: 1 });
const viaQuery = (): Let => {
	const found = Array.from(root.$query().$descendants as Iterable<unknown>).find(isLet);
	if (found === undefined) throw new Error('expected a let declaration');
	return found;
};
const viaAccessors = (): Let => {
	const second = root.statements()[1] as unknown as { body(): { statements(): readonly unknown[] } };
	const found = second.body().statements()[0];
	if (!isLet(found)) throw new Error('expected a let declaration');
	return found;
};

const tick = (): Promise<unknown> => new Promise((resolve) => setTimeout(resolve, 25));
const ref = new WeakRef(viaQuery());
// `deref()` keeps its target alive until the current job ends, and a
// finalizer callback runs in a later task, so every `gc()` runs in a job of
// its own, between two yields to the event loop.
let collected = false;
for (let round = 0; round < 20 && !collected; round += 1) {
	await tick();
	collect();
	await tick();
	collected = ref.deref() === undefined;
}
const again = viaQuery();
console.log(JSON.stringify({ collected, sameAfter: viaAccessors() === again && viaQuery() === again }));
