// Run with `node --expose-gc --import tsx`: prints one JSON line reporting
// how a tree renders once a comment written into it from another parse is
// all that names the other parse's tree. A child process, because a
// collection can only be forced under `--expose-gc`.
import { createEngine } from '../../src/index.ts';
import { getActiveBackend } from '../../../rust/src/backend.ts';
import rust from '../../../rust/src/index.ts';

const status = getActiveBackend();
if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
const { native } = status;
if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;

async function settle(): Promise<void> {
	for (let round = 0; round < 10; round += 1) {
		collect();
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
}

type Statement = { $trivia: { leading(...items: unknown[]): unknown } };
const engine = await createEngine(rust);
const recipient = engine.parse('fn r() {}\n');
(() => {
	const donor = (engine.parse('// c\nfn d() {}\n').statements()[0] as unknown as Statement).$trivia.leading() as unknown[];
	(recipient.statements()[0] as unknown as Statement).$trivia.leading(donor[0]);
})();
const before = recipient.$render();
await settle();
let after: string;
try {
	after = recipient.$render();
} catch (error) {
	after = `throws: ${(error as Error).message.slice(0, 60)}`;
}
console.log(JSON.stringify({ before, after, live: native.liveTreeCount() }));
