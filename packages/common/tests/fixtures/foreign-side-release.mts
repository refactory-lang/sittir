// Run with `node --expose-gc --import tsx <parsed|built|unit>`: prints one
// JSON line reporting how an engine renders its parsed or its built node
// holding, in a side, a record another engine of its language built, with a
// side of its own that engine wrote, once nothing but that side names the
// record or its engine. `unit` holds it in a side of a unit of a built block,
// which the holder then rebuilds with an item before the unit, and clears on
// the block it rebuilt from. One holder per run, so neither holder's hold
// covers the other.
import { useRecordConstruction } from '../../src/engine-boundary.ts';
import { unitSidesOf } from '../../src/node-data.ts';
import { writeUnitSides } from '../../src/utils.ts';
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

type Sided = { $trivia: { trailing(entry?: unknown): unknown } };
type Block = { statements(): Iterable<unknown>; $with: { statements(...items: unknown[]): object } };

const kind = process.argv[2];
if (kind !== 'parsed' && kind !== 'built' && kind !== 'unit') throw new Error('name the holder: parsed, built or unit');
const holder = await recordEngine();

const attempt = (read: () => unknown) => {
	try {
		return String(read());
	} catch (error) {
		return `throws: ${(error as Error).message.slice(0, 80)}`;
	}
};

async function sidedComment(): Promise<object> {
	const builder = await recordEngine();
	const comment = builder.build.blockComment(builder.build.blockCommentRegular(' c '));
	comment.$trivia.leading(builder.build.blockComment(builder.build.blockCommentRegular(' d ')));
	return comment;
}

function inSide(): { root: object; read: () => unknown; written: () => Promise<WeakRef<object>> } {
	const parsed = holder.parse('fn f() {\n    g();\n}\n');
	const root = kind === 'parsed' ? parsed : holder.build.expressionStatement(holder.build.identifier('x'));
	const target = (kind === 'parsed' ? (parsed.statements()[0] as unknown as { body(): { statements(): readonly Sided[] } }).body().statements()[0]! : root) as Sided;
	return {
		root,
		read: () => (target.$trivia.trailing() as readonly { $render(): string }[]).map((entry) => entry.$render()).join(' '),
		written: async () => {
			const comment = await sidedComment();
			target.$trivia.trailing(comment);
			return new WeakRef(comment);
		}
	};
}

function inUnitSide(): { root: object; read: () => unknown; written: () => Promise<WeakRef<object>> } {
	const statements = [...(holder.parse('fn f() {\n    ;\n    x();\n}\n').statements()[0] as unknown as { body(): Block }).body().statements()];
	const held: { root?: object } = {};
	return {
		get root() {
			return held.root!;
		},
		read: () => ((unitSidesOf(held.root!) as readonly { leading?: readonly { $render(): string }[] }[])[0]!.leading ?? []).map((entry) => entry.$render()).join(' '),
		written: async () => {
			const comment = await sidedComment();
			const block = holder.build.block({ statements: statements as never }) as unknown as Block;
			writeUnitSides(block, [{ slot: '_statements', item: 0, leading: [comment] }]);
			held.root = block.$with.statements(holder.build.expressionStatement(holder.build.identifier('y')), ...block.statements());
			writeUnitSides(block, []);
			return new WeakRef(comment);
		}
	};
}

const holding = kind === 'unit' ? inUnitSide() : inSide();
const render = () => ({ render: attempt(() => holder.render(holding.root as never)), read: attempt(holding.read) });

const comment = await holding.written();
const before = render();
await settle();
console.log(JSON.stringify({ collected: comment.deref() === undefined, before, after: render() }));
