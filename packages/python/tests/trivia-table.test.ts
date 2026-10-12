import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sidesOf } from '@sittir/common/utils';
import python from '../src/index.ts';

const engine = await createEngine(python);
const { build } = engine;
type Root = ReturnType<typeof engine.parse>;
type Block = ReturnType<typeof bodyAt>;

function bodyAt(root: Root, at: number) {
	const fn = root.statements()[at];
	if (fn === undefined || !engine.is.functionDefinition(fn)) throw new Error('expected a function');
	const suite = fn.body();
	if (!engine.is.suiteBlock(suite)) throw new Error('expected an indented block');
	return suite.block();
}

function ifBlock(statement: ReturnType<Root['statements']>[number] | undefined) {
	if (statement === undefined || !engine.is.ifStatement(statement)) throw new Error('expected an if statement');
	const suite = statement.consequence();
	if (!engine.is.suiteBlock(suite)) throw new Error('expected an indented block');
	return suite.block();
}

const viaAccessors = (root: Root) => ifBlock(root.statements()[0]);
const viaQuery = (root: Root) => ifBlock(root.$query().$descendants.ofType(engine.kinds.IfStatement).at(0));

const call = (name: string) =>
	build.simpleStatements(build.expressionStatement(build.call({ function: build.identifier(name), arguments: build.argumentList() } as never) as never) as never);

/** The text of each node entry of a side; its layout entries are not text. */
const texts = (entries: readonly unknown[]): string[] =>
	entries.filter((entry) => typeof entry === 'object').map((entry) => String(engine.render(entry as never)).trim());

/** The rendered tree, pinned exactly, and reparsed with no `ERROR`. */
function rendersAs(root: { $render(): string }, expected: string): void {
	const out = root.$render();
	expect(out).toBe(expected);
	expect(engine.parse(out).$errors).toEqual([]);
}

function statementOf(block: Block, at: number) {
	const statement = block.statements()[at];
	if (statement === undefined) throw new Error('expected a statement');
	return statement;
}

describe.each([
	['the accessors', viaAccessors],
	['a query', viaQuery]
])('a write on a block reached through %s', (_, reach) => {
	it('keeps a deeper-indented comment in the block', () => {
		const root = engine.parse('if a:\n  b\n    # four\n  c\n');
		reach(root).$trivia.leading('# lead');
		rendersAs(root, 'if a:\n  # lead\n  b\n    # four\n  c\n');
	});

	it('is accepted on a statement in it, and renders in the whole tree', () => {
		const root = engine.parse('if a:\n    b\n');
		statementOf(reach(root), 0).$trivia.leading('# lead');
		rendersAs(root, 'if a:\n    # lead\n    b\n');
	});
});

describe('the sides of a parsed node come from its tree', () => {
	it('keeps a comment between two untouched children of an edited parent', () => {
		const root = engine.parse('def f():\n    a()\n    # mid\n    b()\n    c()\n');
		statementOf(bodyAt(root, 0), 2).$trivia.leading('# c');
		rendersAs(root, 'def f():\n    a()\n    # mid\n    b()\n    # c\n    c()\n');
	});

	it('reads and writes each side through its node', () => {
		const root = engine.parse('def f():\n    a()  # t\n');
		const statement = statementOf(bodyAt(root, 0), 0);
		if (!engine.is.SimpleStatements(statement)) throw new Error('expected simple statements');
		const [element] = statement;
		if (element === undefined || typeof element === 'number') throw new Error('expected a statement element');
		expect(texts(element.$trivia.trailing())).toEqual(['# t']);
		statement.$trivia.leading('# l');
		expect(texts(statement.$trivia.leading())).toEqual(['# l']);
		rendersAs(root, 'def f():\n    # l\n    a()  # t\n');
	});

	it('renders a write through a parsed holder in a draft that stores its range unread', () => {
		const root = engine.parse('def g():\n    a()\n');
		const g = root.statements()[0];
		if (g === undefined || !engine.is.functionDefinition(g)) throw new Error('expected a function');
		statementOf(bodyAt(root, 0), 0).$trivia.leading('# w');
		expect(g.$with.name(build.identifier('h')).$render()).toBe('def h():\n    # w\n    a()');
	});

	it('reads a side as equal entries that are not the same object', () => {
		const statement = statementOf(bodyAt(engine.parse('def f():\n    # c\n    a()\n'), 0), 0);
		const first = statement.$trivia.leading();
		const second = statement.$trivia.leading();
		expect(second).toEqual(first);
		expect(second).not.toBe(first);
	});

	it("keeps a comment with the statement it trails when its sibling is replaced, and drops the replaced statement's own", () => {
		const block = bodyAt(engine.parse('def f():\n    s1()  # a\n    # b\n    s2()\n'), 0);
		expect(block.$with.statements(statementOf(block, 0), call('s3')).$render()).toBe('s1()  # a\ns3()\n');
	});

	it('renders an ERROR entry verbatim when its owner renders from its template', () => {
		const root = engine.parse('a = 1\n$\nb = 2\n');
		const [first, second] = root.statements();
		if (first === undefined || second === undefined || !engine.is.SimpleStatements(second)) throw new Error('expected two statements');
		const element = second[0];
		if (element === undefined || !engine.is.expressionStatement(element)) throw new Error('expected an expression statement');
		const assignment = element.content();
		if (!engine.is.assignment.eq(assignment)) throw new Error('expected an assignment');
		const edited = root.$with.statements(first, second.$with.elements(element.$with.content(assignment.$with.right(build.integer('3')))));
		expect(edited.$render()).toBe('a = 1\n$\nb = 3\n');
	});
});

describe('a node renders the layout its entries hold', () => {
	it('renders a parsed one-line suite on one line after a write elsewhere in its tree', () => {
		const root = engine.parse('if a: b; c\nd\n');
		const last = root.statements()[1];
		if (last === undefined) throw new Error('expected a statement');
		last.$trivia.leading('# d');
		rendersAs(root, 'if a: b; c\n# d\nd\n');
	});

	it('renders a statement written into a parsed block with the seam defaults', () => {
		const block = bodyAt(engine.parse('def f():\n    a()\n'), 0);
		expect(block.$with.statements(...block.statements(), call('b')).$render()).toBe('a()\nb()\n');
	});

	it("carries a moved node's layout entries into its new tree", () => {
		const moved = engine.parse('def f():\n    a()\n\n    # c\n    b()\n').statements()[0];
		if (moved === undefined) throw new Error('expected a function');
		const target = engine.parse('g()\n');
		rendersAs(target.$with.statements(...target.statements(), moved), 'g()\ndef f():\n    a()\n\n    # c\n    b()\n');
	});
});

describe("a document's final line break is its source's", () => {
	for (const body of ['# c', 'x = 1\n# c', 'x = 1 # c']) {
		for (const source of [body, `${body}\n`]) {
			it(JSON.stringify(source), () => {
				const root = engine.parse(source);
				expect(root.$render()).toBe(source);
				expect(root.$with.statements(...root.statements()).$render()).toBe(source);
			});
		}
	}
});

describe('a snapshot of an edited tree', () => {
	it('takes its sides from the table, with no stamps in its data, and spells an in-line gap with its seam default', () => {
		const root = engine.parse('def f():\n    # keep\n    x = 1  # same\n');
		statementOf(bodyAt(root, 0), 0).$trivia.leading('# new');
		const data = JSON.stringify(root.$snapshot());
		expect(data).not.toMatch(/"\$sameLine"|"\$tokensBetween"/);
		expect(engine.render(root.$snapshot()).toString()).toBe(root.$render().replace('x = 1  # same', 'x = 1 # same'));
	});
});

describe('the owner a side belongs to', () => {
	it("leaves a comment on its line's statement when the next statement's leading is written", () => {
		const root = engine.parse('def f():\n    s1()  # x\n    s2()\n');
		statementOf(bodyAt(root, 0), 1).$trivia.leading('# c');
		rendersAs(root, 'def f():\n    s1()  # x\n    # c\n    s2()\n');
	});

	it('renders a write through each side with the layout of that side', () => {
		const root = engine.parse('def f():\n    a()\n');
		const statement = statementOf(bodyAt(root, 0), 0);
		statement.$trivia.leading('# l');
		statement.$trivia.trailing('# t');
		rendersAs(root, 'def f():\n    # l\n    a() # t\n');
	});

	it("gives a file of comments only to the root's inner, and renders it as its source", () => {
		const root = engine.parse('# a\n\n# b\n');
		expect(engine.isEmptyNode(root)).toBe(true);
		expect(texts(sidesOf(root)?.inner ?? [])).toEqual(['# a', '# b']);
		expect(root.$render()).toBe('# a\n\n# b\n');
	});

	it('reads a write through a query back through the accessors', () => {
		const root = engine.parse('if a:\n    b\n');
		viaQuery(root).$trivia.leading('# q');
		expect(texts(viaAccessors(root).$trivia.leading())).toEqual(['# q']);
	});
});
