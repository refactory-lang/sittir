// The strict surface at two places the generated rebuilds once tripped on: a
// statement's terminator is a kind id, and a hoisted group's keys ride on the
// parent's mount route rather than under the slot key.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('statement terminator', () => {
	it('takes either layout keyword as a kind id', () => {
		expect(
			ts.build.expressionStatement.strict(ts.build.identifier('x'), { terminator: ts.kinds.AutomaticSemicolon }).$render()
		).toBe('x\n');
		expect(ts.build.expressionStatement.strict(ts.build.identifier('x'), { terminator: ts.kinds.Semi }).$render()).toBe('x;');
	});
});

describe('a hoisted group seated on its parent', () => {
	it("merges the group's keys into the parent's mount route", () => {
		const built = ts.build.forInStatement.letConstKind.strict({
			kind: ts.kinds.ConstKeyword,
			left: ts.build.identifier('item'),
			operator: ts.kinds.OfKeyword,
			right: ts.build.identifier('items'),
			body: ts.build.statementBlock.strict({ automaticSemicolon: true })
		});
		expect(built.$render()).toBe('for (const item of items) {}\n');
	});
	it('refuses the group as a config under the slot key on the plain route', () => {
		const refused = () =>
			ts.build.forInStatement.strict({
				// @ts-expect-error the plain route takes the built group, the mount route takes its keys
				content: { kind: ts.kinds.ConstKeyword, left: ts.build.identifier('item') },
				operator: ts.kinds.OfKeyword,
				right: ts.build.identifier('items'),
				body: ts.build.statementBlock.strict({ automaticSemicolon: true })
			});
		expect(refused).toBeDefined();
	});
});
