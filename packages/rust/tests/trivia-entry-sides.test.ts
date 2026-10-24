import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { useRecordConstruction } from '@sittir/common/engine';
import arena from '../src/arena.ts';
import rust from '../src/index.ts';

const objects = await createEngine(rust);
type Engine = typeof objects;
const records = (await arena.createEngine()) as Engine;
useRecordConstruction(records, await import('../src/factories/records.ts'));
const constructions: readonly [string, Engine][] = [
	['objects', objects],
	['arena objects', (await arena.createEngine()) as Engine],
	['records', records]
];

type Side = 'leading' | 'trailing';
type Sided = { readonly $trivia: { leading(...items: never[]): unknown; trailing(...items: never[]): unknown } };

const withSide = <N extends Sided>(node: N, side: Side, entries: readonly unknown[]): N => {
	if (entries.length === 0) return node;
	if (side === 'leading') node.$trivia.leading(...(entries as never[]));
	else node.$trivia.trailing(...(entries as never[]));
	return node;
};

function helpers(rs: Engine) {
	const b = rs.build;
	const comment = () => b.blockComment(b.blockCommentRegular(' c '));
	const statement = (name: string) => b.expressionStatement(b.identifier(name));
	const sided = (before: readonly unknown[], after: readonly unknown[]) => withSide(withSide(comment(), 'leading', before), 'trailing', after);
	const rendered = (held: unknown) => b.functionItem({ name: b.identifier('f'), parameters: b.parameters(), body: b.block({ statements: [statement('a'), held as never, statement('z')] }) }).$render();
	return { L: b.layout, comment, statement, sided, rendered };
}

type Layout = ReturnType<typeof helpers>['L'];
const shapes: readonly [string, Side, (L: Layout) => readonly unknown[], (L: Layout) => readonly unknown[]][] = [
	['leading: space | comment | space', 'leading', (L) => [L.space], (L) => [L.space]],
	['leading: newline | comment | newline', 'leading', (L) => [L.newline], (L) => [L.newline]],
	['leading: comment | space', 'leading', () => [], (L) => [L.space]],
	['leading: space | comment', 'leading', (L) => [L.space], () => []],
	['leading: blankline | comment | tight', 'leading', (L) => [L.blankline], (L) => [L.tight]],
	['trailing: space | comment | space', 'trailing', (L) => [L.space], (L) => [L.space]],
	['trailing: newline | comment', 'trailing', (L) => [L.newline], () => []],
	['trailing: comment | newline', 'trailing', () => [], (L) => [L.newline]]
];

const nestedOf = (rs: Engine, side: Side, before: (L: Layout) => readonly unknown[], after: (L: Layout) => readonly unknown[]) => {
	const { L, statement, sided, rendered } = helpers(rs);
	return rendered(withSide(statement('x'), side, [sided(before(L), after(L))]));
};

describe.each(constructions)("an entry's own sides are its neighbours in the side that holds it (%s)", (_, rs) => {
	const { L, comment, statement, sided, rendered } = helpers(rs);

	it.each(shapes)('%s', (_, side, before, after) => {
		const flat = withSide(statement('x'), side, [...before(L), comment(), ...after(L)]);
		expect(nestedOf(rs, side, before, after)).toBe(rendered(flat));
	});

	it('leaves nothing on the line a trailing comment breaks from when its own leading side is the break', () => {
		expect(rendered(withSide(statement('x'), 'trailing', [sided([L.newline], [])]))).toBe('fn f() {\n    a;\n    x;\n    /* c */\n    z;\n}');
	});

	it("takes a parsed comment's own sides as its neighbours too, where it stays its coordinate", () => {
		const source = 'fn f() {\n    x; /* c */\n    z;\n}\n';
		const trailingOf = () => {
			const root = rs.parse(source);
			const item = root.statements()[0];
			if (item === undefined || !rs.is.functionItem(item)) throw new Error('expected a function');
			const x = item.body().statements()[0] as unknown as Sided;
			const [held] = (x.$trivia as unknown as { trailing(): readonly Sided[] }).trailing();
			if (held === undefined) throw new Error('expected a trailing comment');
			return { root, x, held };
		};
		const nested = trailingOf();
		withSide(nested.held, 'leading', [L.newline]);
		const flat = trailingOf();
		withSide(flat.x, 'trailing', [L.newline, flat.held]);
		expect(nested.root.$render()).toBe(flat.root.$render());
		expect(nested.root.$render()).toBe('fn f() {\n    x;\n    /* c */\n    z;\n}\n');
	});
});

describe('a built record entry takes its own sides from the store that holds it', () => {
	it("renders a parsed holder's record with its tree's engine's sides when another engine renders the holder", async () => {
		const other = (await arena.createEngine()) as Engine;
		useRecordConstruction(other, await import('../src/factories/records.ts'));
		const { L, comment, sided } = helpers(records);
		const statementOf = () => {
			const item = records.parse('fn f() {\n    x;\n}\n').statements()[0];
			if (item === undefined || !records.is.functionItem(item)) throw new Error('expected a function');
			return item.body().statements()[0] as unknown as Sided;
		};
		const heldBy = (x: Sided) => other.build.functionItem({ name: other.build.identifier('g'), parameters: other.build.parameters(), body: other.build.block({ statements: [x as never] }) }).$render();
		const nested = withSide(statementOf(), 'trailing', [sided([L.newline], [])]);
		const flat = withSide(statementOf(), 'trailing', [L.newline, comment()]);
		expect(heldBy(nested)).toBe(heldBy(flat));
		expect(heldBy(nested)).toBe('fn g() {\n    x;\n    /* c */\n}');
	});

	it("refuses a write that would make a record reachable from its own sides", () => {
		const { comment } = helpers(records);
		const [a, b] = [comment(), comment()];
		expect(() => withSide(a, 'leading', [a])).toThrow(/a side that reaches its own record/);
		withSide(a, 'leading', [b]);
		expect(() => withSide(b, 'trailing', [a])).toThrow(/a side that reaches its own record/);
	});
});

describe('every construction renders each shape as objects do', () => {
	it.each(shapes)('%s', (_, side, before, after) => {
		const expected = nestedOf(objects, side, before, after);
		for (const [, rs] of constructions) expect(nestedOf(rs, side, before, after)).toBe(expected);
	});
});
