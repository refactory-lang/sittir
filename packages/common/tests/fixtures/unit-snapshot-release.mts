// Run with `node --expose-gc --import tsx`: prints one JSON line reporting a
// snapshot of a rebuilt node whose unit child holds a comment, rendered after
// the tree it was read from is released. A child process, because a
// collection can only be forced under `--expose-gc`.
import { createEngine } from '../../src/index.ts';
import { snapshotOf } from '../../src/utils.ts';
import { getActiveBackend } from '../../../typescript/src/backend.ts';
import typescript from '../../../typescript/src/index.ts';

const status = getActiveBackend();
if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;

const engine = await createEngine(typescript);
const json = (() => {
	const root = engine.parse('// A\n;\n');
	const draft = root.$with.statements(...root.statements());
	return JSON.stringify(snapshotOf(draft));
})();
const before = engine.render(JSON.parse(json)).toString();
for (let round = 0; round < 10; round += 1) {
	collect();
	await new Promise((resolve) => setTimeout(resolve, 25));
}
let after: string;
try {
	after = engine.render(JSON.parse(json)).toString();
} catch (error) {
	after = `throws: ${(error as Error).message.slice(0, 60)}`;
}
console.log(JSON.stringify({ coordinate: json.includes('$treeHandle'), comment: before.includes('// A'), same: after === before }));
