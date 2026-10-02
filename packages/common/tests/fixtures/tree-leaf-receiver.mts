// Run with `node --import tsx <this> <leaf JSON>`: a process handed read data
// another process parsed. Tree ids count from 0 in every process, so it
// first parses trees of its own until the copy's tree id names one of them:
// a lookup alone would then answer the copy from the wrong source. Prints
// one JSON line: what it rendered, or the refusal.
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';

const leaf = JSON.parse(process.argv[2] ?? '') as { $handle?: number; $parentHandle?: number; $treeHandle?: number };
const engine = await createEngine(rust);
const treeId = Math.floor((leaf.$handle ?? leaf.$parentHandle ?? leaf.$treeHandle ?? 0) / 2 ** 32);
const own = Array.from({ length: treeId + 1 }, () => engine.parse('fn zzzzzz() {}\n'));
try {
	const built = engine.build.binaryExpression({
		left: leaf as never,
		operator: '+',
		right: engine.build.identifier('y')
	});
	console.log(JSON.stringify({ rendered: String(engine.render(built)), own: own.length }));
} catch (error) {
	console.log(JSON.stringify({ error: (error as Error).message }));
}
