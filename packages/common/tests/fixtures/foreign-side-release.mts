// Run with `node --expose-gc --import tsx <parsed|built>`: prints one JSON
// line reporting how an engine renders its parsed or its built node holding,
// in a side, a record another engine of its language built, with a side of
// its own that engine wrote, once nothing but that side names the record or
// its engine. One holder per run, so neither holder's hold covers the other.
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

const kind = process.argv[2];
if (kind !== 'parsed' && kind !== 'built') throw new Error('name the holder: parsed or built');
const holder = await recordEngine();
type Sided = { $trivia: { trailing(entry?: unknown): unknown } };
const parsed = holder.parse('fn f() {\n    g();\n}\n');
const root = kind === 'parsed' ? parsed : holder.build.expressionStatement(holder.build.identifier('x'));
const target = (kind === 'parsed' ? (parsed.statements()[0] as unknown as { body(): { statements(): readonly Sided[] } }).body().statements()[0]! : root) as Sided;

async function written(): Promise<WeakRef<object>> {
	const builder = await recordEngine();
	const comment = builder.build.blockComment(builder.build.blockCommentRegular(' c '));
	comment.$trivia.leading(builder.build.blockComment(builder.build.blockCommentRegular(' d ')));
	target.$trivia.trailing(comment);
	return new WeakRef(comment);
}

const attempt = (read: () => unknown) => {
	try {
		return String(read());
	} catch (error) {
		return `throws: ${(error as Error).message.slice(0, 80)}`;
	}
};
const render = () => ({
	render: attempt(() => holder.render(root as never)),
	read: attempt(() => (target.$trivia.trailing() as readonly { $render(): string }[]).map((entry) => entry.$render()).join(' '))
});

const comment = await written();
const before = render();
await settle();
console.log(JSON.stringify({ collected: comment.deref() === undefined, before, after: render() }));
