// Run with `node --expose-gc --import tsx`: prints one JSON line reporting
// how an engine renders its parsed and built nodes holding, in a side, a
// record another engine of its language built, with a side of its own that
// engine wrote, once nothing but that side names the record or its engine.
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

const holder = await recordEngine();
const parsed = holder.parse('fn f() {\n    g();\n}\n');
const statement = (parsed.statements()[0] as unknown as { body(): { statements(): readonly { $trivia: { trailing(entry: unknown): unknown } }[] } }).body().statements()[0]!;
const built = holder.build.expressionStatement(holder.build.identifier('x'));

async function written(): Promise<WeakRef<object>> {
	const builder = await recordEngine();
	const comment = builder.build.blockComment(builder.build.blockCommentRegular(' c '));
	comment.$trivia.leading(builder.build.blockComment(builder.build.blockCommentRegular(' d ')));
	statement.$trivia.trailing(comment);
	built.$trivia.trailing(comment);
	return new WeakRef(comment);
}

const render = () => {
	try {
		return { parsed: holder.render(parsed).toString(), built: holder.render(built).toString() };
	} catch (error) {
		return `throws: ${(error as Error).message.slice(0, 80)}`;
	}
};

const comment = await written();
const before = render();
await settle();
console.log(JSON.stringify({ collected: comment.deref() === undefined, before, after: render() }));
