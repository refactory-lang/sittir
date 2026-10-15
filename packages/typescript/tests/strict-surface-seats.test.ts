import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('statement terminator', () => {
	it('takes either layout keyword as a kind id', () => {
		expect(
			ts.build.expressionStatement
				.strict(ts.build.identifier('x'), { terminator: ts.kinds.AutomaticSemicolon })
				.$render()
		).toBe('x\n');
		expect(ts.build.expressionStatement.strict(ts.build.identifier('x'), { terminator: ts.kinds.Semi }).$render()).toBe(
			'x;'
		);
	});
});

describe('an authored field over a registered group', () => {
	it('takes the registered header form as the field value', () => {
		const built = ts.build.forInStatement.strict({
			header: ts.build.forHeader.letConstKind.strict({
				kind: ts.kinds.ConstKeyword,
				left: ts.build.identifier('item'),
				operator: ts.kinds.OfKeyword,
				right: ts.build.identifier('items')
			}),
			body: ts.build.statementBlock.strict({ terminator: ts.kinds.AutomaticSemicolon })
		});
		expect(built.$render()).toBe('for (const item of items) {}\n');
	});
	it('refuses an unbuilt header config on the strict route', () => {
		const refused = () =>
			ts.build.forInStatement.strict({
				// @ts-expect-error a strict field takes a built header
				header: { kind: ts.kinds.ConstKeyword, left: ts.build.identifier('item') },
				body: ts.build.statementBlock.strict({ terminator: ts.kinds.AutomaticSemicolon })
			});
		expect(refused).toBeDefined();
	});
});
