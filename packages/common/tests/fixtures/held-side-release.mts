// Run with `node --expose-gc --import tsx`: prints one JSON line reporting a
// render of a tree that holds a side, before another tree that holds one is
// released, in the same job as the collection that releases it (before its
// finalizer runs), and after; and whether the addon let the released tree go.
// A child process, because a collection can only be forced under `--expose-gc`.
import { createEngine } from '../../src/index.ts';
import { getActiveBackend } from '../../../rust/src/backend.ts';
import rust from '../../../rust/src/index.ts';

const status = getActiveBackend();
if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
const { native } = status;
if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;

type Sided = { $trivia: { trailing(...items: unknown[]): unknown } };
const engine = await createEngine(rust);
const b = engine.build;
const comment = (text: string) => b.blockComment(b.blockCommentRegular(` ${text} `));
const render = (): string => {
	try {
		return recipient.$render();
	} catch (error) {
		return `throws: ${(error as Error).message.slice(0, 80)}`;
	}
};
const recipient = engine.parse('fn r() {}\n');
(recipient.statements()[0] as unknown as Sided).$trivia.trailing(comment('r'));
const live = native.liveTreeCount();
(() => {
	const dropped = engine.parse('fn d() {}\n');
	(dropped.statements()[0] as unknown as Sided).$trivia.trailing(comment('d'));
})();
const before = render();
await new Promise((resolve) => setTimeout(resolve, 0));
collect();
const raced = render();
for (let round = 0; round < 10; round += 1) {
	collect();
	await new Promise((resolve) => setTimeout(resolve, 25));
}
const after = render();
console.log(JSON.stringify({ before, raced, after, released: native.liveTreeCount() === live }));
