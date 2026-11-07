// Run with `node --expose-gc --import tsx`: prints one JSON line reporting
// how one engine renders a record another engine of its language built, once
// nothing but the record names the engine that built it, while the rendering
// engine holds a record of its own at the same address with sides of its own.
// A child process, because a collection can only be forced under `--expose-gc`.
import rust, { type Engine } from '../../../rust/src/index.ts';

if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;

async function settle(): Promise<void> {
	for (let round = 0; round < 10; round += 1) {
		collect();
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
}

function recordEngine(): Promise<Engine> {
	return rust.createEngine();
}

function noted(engine: Engine, name: string, note: string) {
	const b = engine.build;
	const statement = b.expressionStatement(b.identifier(name));
	statement.$trivia.leading(b.blockComment(b.blockCommentRegular(note)));
	return statement;
}

const renderer = await recordEngine();
const built = noted(await recordEngine(), 'x', ' its builder ');
noted(renderer, 'y', ' the renderer ');
const before = renderer.render(built).toString();
await settle();
let after: string;
try {
	after = renderer.render(built).toString();
} catch (error) {
	after = `throws: ${(error as Error).message.slice(0, 60)}`;
}
console.log(JSON.stringify({ before, after }));
