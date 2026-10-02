// Run with `node --import tsx`: prints, as one JSON line, a leaf this process
// parsed. The JSON carries the leaf's coordinate and not its hold on the tree.
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';

const engine = await createEngine(rust);
const leaf = (engine.parse('fn f() {}\n').statements()[0] as unknown as { name(): object }).name();
console.log(JSON.stringify(leaf));
