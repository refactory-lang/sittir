// Run with `node --import tsx`: prints, as one JSON line, a leaf this process
// parsed. Its coordinate is valid only against this process's tree table.
import { createEngine } from '../../src/index.ts';
import rust from '../../../rust/src/index.ts';

const engine = await createEngine(rust);
const leaf = (engine.parse('fn f() {}\n').statements()[0] as unknown as { name(): object }).name();
console.log(JSON.stringify(leaf));
