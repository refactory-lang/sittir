// A worker thread handed read data cloned from another thread. Tree ids
// count from 0 on every thread, so it first parses trees of its own until
// the clone's tree id names one of them: a lookup alone would then answer
// the clone from the wrong source. The clone holds no tree, and that is
// what refuses it.
import { parentPort, workerData } from 'node:worker_threads';
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';

const engine = await createEngine(rust);
const { leaf } = workerData as { leaf: { $handle?: number; $parentHandle?: number; $treeHandle?: number } };
const treeId = Math.floor((leaf.$handle ?? leaf.$parentHandle ?? leaf.$treeHandle ?? 0) / 2 ** 32);
const own = Array.from({ length: treeId + 1 }, () => engine.parse('fn zzzzzz() {}\n'));
try {
	const built = engine.build.binaryExpression({
		left: leaf as never,
		operator: '+',
		right: engine.build.identifier('y')
	});
	parentPort?.postMessage({ rendered: String(engine.render(built)), own: own.length });
} catch (error) {
	parentPort?.postMessage({ error: (error as Error).message });
}
