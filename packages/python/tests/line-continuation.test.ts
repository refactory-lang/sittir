import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const pyStrict = await createEngine(python, { api: 'strict' });
const strict = pyStrict.build;
const call = (name: string) => strict.call({ function: strict.identifier(name), arguments: strict.argumentList() });
const statement = (expression: object) => strict.module(strict.simpleStatements(strict.expressionStatement(expression as never)));

describe('a line continuation trailing an expression', () => {
	it('keeps the gap before its backslash, with no line break ahead of it', () => {
		const joined = strict.booleanOperator({
			left: call('f').$trivia.trailing(strict.lineContinuation.newline('\\\n')),
			operator: py.kinds.OrKeyword,
			right: call('g')
		});
		const rendered = pyStrict.render(statement(joined)).toString();
		expect(rendered).toBe('f() \\\nor g()\n');
		expect(py.parse(rendered).$errors).toHaveLength(0);
	});

	it('reads back as one statement', () => {
		const text = 'len("a") \\\nor len("aa")\n';
		expect(py.parse(text).$errors).toHaveLength(0);
		expect(py.render(py.parse(text)).toString()).toBe(text);
	});
});

type Engine = typeof py;
type Node = {
	$type: number;
	$text(): string;
	$trivia: Record<'leading' | 'trailing', (...entries: unknown[]) => unknown[]>;
	$with: Record<string, (...items: unknown[]) => { $render(): unknown }>;
	statements(): Node[];
	$query(): { $descendants: Iterable<Node | number> & { ofType(kind: number): Iterable<Node | number> } };
};

const identifier = (engine: Engine, root: Node, text: string) =>
	[...root.$query().$descendants.ofType(engine.kinds.Identifier)].find((node): node is Node => typeof node !== 'number' && node.$text() === text)!;

const POSITIONS = [
	{ position: 'leading a statement', target: 'x = 1\ny = 2\n', side: 'leading', at: (_: Engine, root: Node) => root.statements()[1]!, expected: 'x = 1\n\\\ny = 2\n' },
	{ position: 'after an operator', target: 'total = a + b\n', side: 'leading', at: (engine: Engine, root: Node) => identifier(engine, root, 'b'), expected: 'total = a + \\\nb\n' },
	{ position: 'trailing the left operand', target: 'total = a + b\n', side: 'trailing', at: (engine: Engine, root: Node) => identifier(engine, root, 'a'), expected: 'total = a \\\n+ b\n' },
	{ position: 'after an opening bracket', target: 'f(a)\n', side: 'leading', at: (engine: Engine, root: Node) => identifier(engine, root, 'a'), expected: 'f(\\\na)\n' },
	{ position: 'first line of a file', target: 'x = 1\n', side: 'leading', at: (_: Engine, root: Node) => root.statements()[0]!, expected: '\\\nx = 1\n' }
] as const;

const DONORS = { 'a spaced donor': 'total = a + \\\nb\n', 'a tight donor': 'total = a+\\\nb\n' } as const;

const KEEPS_ITS_READ_RUNS: Record<keyof typeof DONORS, readonly string[]> = {
	'a spaced donor': ['after an opening bracket'],
	'a tight donor': []
};

const parsedContinuation = (engine: Engine, donor: string) => {
	const root = engine.parse(donor) as unknown as Node;
	for (const node of [root, ...root.$query().$descendants]) {
		if (typeof node === 'number') continue;
		for (const side of ['leading', 'trailing'] as const) {
			const entry = node.$trivia[side]().find((item) => typeof item !== 'number' && (item as Node).$type === engine.kinds.LineContinuationNewline);
			if (entry !== undefined) return entry;
		}
	}
	throw new Error(`no line continuation in ${JSON.stringify(donor)}`);
};

const written = (engine: Engine, entry: (engine: Engine) => unknown, { target, side, at }: (typeof POSITIONS)[number]) => {
	const root = engine.parse(target) as unknown as Node;
	at(engine, root).$trivia[side](entry(engine));
	return String(root.$with.statements!(...root.statements()).$render());
};

describe.each(['object', 'arena'] as const)('a line continuation written onto a side of a rebuilt tree, in %s storage', (nodeStorage) => {
	const engine = createEngine(python, { nodeStorage });

	describe.each(POSITIONS)('$position', (row) => {
		it('renders a built entry with the gap before it and its own line break', async () => {
			expect(written(await engine, (e) => e.build.lineContinuation.newline('\\\n'), row)).toBe(row.expected);
		});

		for (const [donor, source] of Object.entries(DONORS) as [keyof typeof DONORS, string][]) {
			const test = nodeStorage === 'object' && KEEPS_ITS_READ_RUNS[donor].includes(row.position) ? it.fails : it;
			test(`renders a parsed entry from ${donor} as the built entry renders`, async () => {
				expect(written(await engine, (e) => parsedContinuation(e, source), row)).toBe(row.expected);
			});
		}
	});
});
