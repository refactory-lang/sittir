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

describe('a reserved word is checked at the slot it is placed in', () => {
	const word = (text: string) => ts.build.identifier(text);

	it('builds the leaf, which checks the loosest wordset its kind appears under', () => {
		expect(word('for').$render()).toBe('for');
	});

	it('places it after a dot, where the property wordset admits it', () => {
		const member = (property: string) =>
			ts.build.memberExpression.strict({ object: word('x'), optionalChain: ts.kinds.Dot, property: word(property) });
		expect(member('for').$render()).toBe('x.for');
		expect(member('class').$render()).toBe('x.class');
	});

	it('refuses it in a slot under the global wordset', () => {
		expect(() => ts.build.nestedIdentifier.strict({ object: word('a'), property: word('for') })).toThrow(
			"NestedIdentifier.property: 'for' is a reserved word"
		);
		expect(() => ts.build.variableDeclaratorPlain.strict({ name: word('for') })).toThrow("'for' is a reserved word");
		expect(() => ts.build.throwStatement.strict(word('for'))).toThrow("ThrowStatement.expression: 'for' is a reserved word");
	});
});
