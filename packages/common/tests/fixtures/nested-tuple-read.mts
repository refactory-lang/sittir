// Run with `node --import tsx <objects|records> <levels>`: parses a rust type
// nesting tuple types <levels> deep at the default depth, walks to its
// innermost tuple, and prints one JSON line with the levels it walked and the
// innermost element's text. A child process, because a read too deep for the
// stack ends the process.
import { createEngine } from '../../src/index.ts';
import rust, { type Engine } from '../../../rust/src/index.ts';

const [construction, levelsArg] = process.argv.slice(2);
const levels = Number(levelsArg);
const rs = (construction === 'objects' ? await createEngine(rust, { nodeStorage: 'object' }) : await rust.createEngine()) as unknown as Engine;
const statement = rs.parse(`type T = ${'('.repeat(levels)}u8${',)'.repeat(levels)};\n`).statements()[0];
if (statement === undefined || !rs.is.typeItem(statement)) throw new Error('expected a type item');
let node: unknown = statement.value();
let walked = 0;
while (rs.is.tupleType(node as never)) {
	node = (node as ArrayLike<unknown>)[0];
	walked += 1;
}
console.log(JSON.stringify({ walked, innermost: rs.render(node as never).toString() }));
rs.dispose();
