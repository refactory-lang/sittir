/**
 * Shows: the width setting on python, where a line break outside brackets
 *   ends the statement. fixtures/sample.py holds separated lists inside
 *   brackets (breakable) and outside them (an unparenthesised import list, a
 *   tuple assignment, a return tuple: not breakable).
 * Needs:  fixtures (make-fixtures.sh) and a prototype variant built for
 *   python. With SITTIR_LAYOUT_UNSAFE=1 (validation variant) the bracket
 *   requirement is dropped and the reparse check turns true.
 * Run (from the root of the checkout to measure):
 *   ./node_modules/.bin/tsx <probes>/example-python.mts [width]   default: 60
 * Prints: the rendering with the width unset and at the width, each followed
 *   by whether reparsing it yields an ERROR node.
 */
import { engineFor, fixture } from './root.mts';

const node = await fixture('rebuild-sample-py.ts', 'rebuildSample');
const check = await engineFor('python');
for (const width of [undefined, Number(process.argv[2] ?? 60)]) {
	const engine = await engineFor('python', width === undefined ? {} : { width });
	const text = String(engine.render(node as never));
	console.log(`--- width ${width ?? 'off'}`);
	console.log(text);
	const tree = check.parse(text, { deep: true });
	console.log('reparse has error:', JSON.stringify(tree, (_key, value) => (typeof value === 'bigint' ? Number(value) : value)).includes('"ERROR"'));
}
