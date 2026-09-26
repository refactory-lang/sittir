// The strict surface at two places the generated rebuilds once tripped on: a
// statement's terminator is a kind id, and a hoisted group's keys ride on the
// parent's mount route rather than under the slot key.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

describe('statement terminator', () => {
	it('takes either layout keyword as a kind id', () => {
		expect(
			ir.expressionStatement.strict(ir.identifier('x'), { terminator: TSKindId.AutomaticSemicolon }).$render()
		).toBe('x\n');
		expect(ir.expressionStatement.strict(ir.identifier('x'), { terminator: TSKindId.Semi }).$render()).toBe('x;');
	});
});

describe('a hoisted group seated on its parent', () => {
	it("merges the group's keys into the parent's mount route", () => {
		const built = ir.forInStatement.letConstKind.strict({
			kind: TSKindId.ConstKeyword,
			left: ir.identifier('item'),
			operator: TSKindId.OfKeyword,
			right: ir.identifier('items'),
			body: ir.statementBlock.strict({ automaticSemicolon: true })
		});
		expect(built.$render()).toBe('for (const item of items) {}\n');
	});
	it('refuses the group as a config under the slot key on the plain route', () => {
		const refused = () =>
			ir.forInStatement.strict({
				// @ts-expect-error the plain route takes the built group, the mount route takes its keys
				content: { kind: TSKindId.ConstKeyword, left: ir.identifier('item') },
				operator: TSKindId.OfKeyword,
				right: ir.identifier('items'),
				body: ir.statementBlock.strict({ automaticSemicolon: true })
			});
		expect(refused).toBeDefined();
	});
});
