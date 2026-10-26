// Run with `node --expose-gc --import tsx`: prints one JSON line reporting
// how one engine renders a record another engine of its language built, once
// nothing but the record names the engine that built it, while the rendering
// engine holds a record of its own at the same address with sides of its own.
// A child process, because a collection can only be forced under `--expose-gc`.
import { useRecordConstruction } from '../../src/engine-boundary.ts';
import arena from '../../../rust/src/arena.ts';

if (typeof globalThis.gc !== 'function') throw new Error('run with --expose-gc');
const collect = globalThis.gc;

async function settle(): Promise<void> {
	for (let round = 0; round < 10; round += 1) {
		collect();
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
}

const recordsModule = await import('../../../rust/src/factories/records.ts');
type Engine = Awaited<ReturnType<typeof arena.createEngine>>;

async function recordEngine(): Promise<Engine> {
	const engine = await arena.createEngine();
	useRecordConstruction(engine, recordsModule);
	return engine;
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
