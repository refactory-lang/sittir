/**
 * Shows: the case the bracket rule alone gets wrong. A list inside an
 *   f-string's replacement field sits between `{` and `}`, so a pass that
 *   only asks for brackets breaks it like the tuple on the next line; the
 *   parser accepts the result, CPython before 3.12 does not. This is the
 *   site that needs a declared "does not admit a line break".
 *   fixtures/fstring.py holds both lists.
 * Needs:  fixtures (make-fixtures.sh) and a prototype variant built for python.
 * Run (from the root of the checkout to measure):
 *   ./node_modules/.bin/tsx <probes>/example-fstring.mts [width]   default: 30
 *   With SITTIR_LAYOUT_DUMP=1 (validation variant) the table of each render
 *   is printed too.
 * Prints: the rendering with the width unset and at the width.
 */
import { engineFor, fixture } from './root.mts';

const node = await fixture('rebuild-fstring-py.ts', 'rebuildF');
for (const width of [undefined, Number(process.argv[2] ?? 30)]) {
	const engine = await engineFor('python', width === undefined ? {} : { width });
	console.log(`--- width ${width ?? 'off'}`);
	console.log(String(engine.render(node as never)));
}
