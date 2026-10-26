// A built node read through its holder is the object its builder was given,
// and a built node a side holds by address reads back as its builder's node.
import { describe, expect, it } from 'vitest';
import { constructions } from './constructions.mts';

describe.each(constructions)('a built node read through its holder (%s)', (_, rs) => {
	const b = rs.build;

	it('is the child its builder was given, slot by slot and item by item', () => {
		const name = b.identifier('f');
		const statement = b.expressionStatement(b.callExpression({ function: b.identifier('g'), arguments: [] }));
		const body = b.block({ statements: [statement] });
		const fn = b.functionItem({ name, parameters: b.parameters(), body });
		expect(fn.name()).toBe(name);
		expect(fn.body()).toBe(body);
		expect(fn.body().statements()[0]).toBe(statement);
		expect(fn.body().statements()).toBe(fn.body().statements());
	});

	it('keeps a node a side holds, and reads it back as that node', () => {
		const comment = b.blockComment(b.blockCommentRegular(' c '));
		const statement = b.expressionStatement(b.identifier('x')).$trivia.leading(comment);
		expect(statement.$trivia.leading()[0]).toBe(comment);
		expect(rs.render(statement).toString()).toBe('/* c */ x;');
	});
});
