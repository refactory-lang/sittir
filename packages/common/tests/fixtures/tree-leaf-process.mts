// Run with `node --import tsx`: prints, as one JSON line, the read data of a
// leaf this process parsed: its storage members, which carry its coordinate,
// and its text, and not its hold on the tree. The members are copied by hand
// because the leaf's own JSON (`toJSON`) names no coordinate at all.
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';

const engine = await createEngine(rust);
const leaf = (engine.parse('fn f() {}\n').statements()[0] as unknown as { name(): object }).name();
console.log(JSON.stringify({ ...Object.fromEntries(Object.entries(leaf).filter(([key, member]) => typeof member !== 'function' && key !== '$trivia')), $text: (leaf as { $text(): string }).$text() }));
