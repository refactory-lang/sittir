// A built node read through its holder is the node its builder was given,
// and a built node a side holds by address reads back as its builder's node.
import { describe, expect, it } from 'vitest';
import { constructions, expectGiven, heldCoordinate } from './constructions.mts';

const SOURCE = 'fn a() {}\nfn b(x: u8) { let x = 1; }\n';

describe.each(constructions)('a built node read through its holder (%s)', (_, rs) => {
	const b = rs.build;

	it('is the child its builder was given, slot by slot and item by item', () => {
		const name = b.identifier('f');
		const statement = b.expressionStatement(b.callExpression({ function: b.identifier('g'), arguments: [] }));
		const body = b.block({ statements: [statement] });
		const fn = b.functionItem({ name, parameters: b.parameters(), body });
		expectGiven(fn.name(), name);
		expectGiven(fn.body(), body);
		expectGiven(fn.body().statements()[0], statement);
		expect(fn.body()).toBe(fn.body());
		expect(fn.body().statements()).toBe(fn.body().statements());
	});

	it("is the parsed holder's node for a coordinate its builder was given, in a slot and in a list", () => {
		const parsed = rs.parse(SOURCE, { depth: 1 });
		const fn = parsed.statements()[1];
		if (fn === undefined || !rs.is.functionItem(fn)) throw new Error('expected a function');
		const built = b.functionItem({
			name: b.identifier('c'),
			parameters: heldCoordinate(fn.parameters()) as never,
			body: heldCoordinate(fn.body()) as never
		});
		expect(built.parameters()).toBe(fn.parameters());
		expect(built.parameters().elements()).toHaveLength(1);
		expect(built.body()).toBe(fn.body());
		const file = b.sourceFile({ statements: parsed.statements().map((statement) => heldCoordinate(statement as object)) as never });
		expect(file.statements()[1]).toBe(fn);
		expect(file.statements()).toBe(file.statements());
		expect(rs.render(file).toString()).toBe(SOURCE);
	});

	it('keeps a node a side holds, and reads it back as that node', () => {
		const comment = b.blockComment(b.blockCommentRegular(' c '));
		const statement = b.expressionStatement(b.identifier('x')).$trivia.leading(comment);
		expectGiven(statement.$trivia.leading()[0], comment);
		expect(rs.render(statement).toString()).toBe('/* c */ x;');
	});
});
