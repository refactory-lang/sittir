import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import { TSKindId } from '../src/kinds.ts';

const enginesOf = async () => {
	const rs = await createEngine(rust, { nodeStorage: 'arena' });
	const other = await createEngine(rust, { nodeStorage: 'arena' });
	return { rs, other, live: (): number => rs.diagnostics.builtMemory!()!.live };
};

describe('a build refused after its record is written, in arena storage', () => {
	it('releases that record, so refused builds hold no built memory', async () => {
		const rs = await createEngine(rust, { nodeStorage: 'arena' });
		const live = (): number => rs.diagnostics.builtMemory!()!.live;
		const before = live();
		for (let round = 0; round < 3; round++) expect(() => rs.build.blockComment(' a */ b ')).toThrow(/cannot sit between/);
		expect(live()).toBe(before);
		const kept = rs.build.blockComment(' a b ');
		expect(rs.render(kept).toString()).toBe('/* a b */');
		expect(live()).toBeGreaterThan(before);
	});
});

describe('a build refused while its record is drafted, in arena storage', () => {
	it('drops the holds its cells took, and leaves a node it was handed held by its handle', async () => {
		const { rs, other, live } = await enginesOf();
		const start = live();
		const own = rs.build.expressionStatement.withSemi(rs.build.identifier('a'));
		const held = live();
		const foreign = other.build.expressionStatement.withSemi(other.build.identifier('b'));
		expect(() => rs.build.sourceFile({ statements: [own, foreign] })).toThrow(/its own engine built/);
		expect(live()).toBe(held);
		expect(rs.render(own).toString()).toBe('a;');
		rs.release(own);
		expect(live()).toBe(start);
	});

	it('releases the children its loose input built before it was refused', async () => {
		const { rs, other, live } = await enginesOf();
		const statement = { $type: TSKindId.ExpressionStatement, content: { $type: TSKindId.ExpressionStatementWithSemi, expression: 'a' } } as const;
		const start = live();
		const control = rs.build.sourceFile({ statements: [statement] });
		expect(live()).toBeGreaterThan(start + 1);
		rs.release(control);
		expect(live()).toBe(start);
		const shebang = other.build.shebang('#!/bin/sh');
		expect(() => rs.build.sourceFile({ shebang, statements: [statement] })).toThrow(/its own engine built/);
		expect(live()).toBe(start);
	});

	it('drops only its own hold of a leaf another record holds, which still renders', async () => {
		const { rs, other, live } = await enginesOf();
		const shared = rs.build.identifier('shared');
		const kept = rs.build.expressionStatement.withSemi(shared);
		const before = live();
		expect(() => rs.build.binaryExpression({ left: shared, operator: '+', right: other.build.identifier('b') })).toThrow(/its own engine built/);
		expect(live()).toBe(before);
		expect(rs.render(kept).toString()).toBe('shared;');
		expect(rs.render(rs.build.binaryExpression({ left: shared, operator: '+', right: rs.build.identifier('b') })).toString()).toBe('shared + b');
	});
});
