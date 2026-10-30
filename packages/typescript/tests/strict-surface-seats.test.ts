import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);
const tsStrict = await createEngine(typescript, { api: 'strict' });

describe('statement terminator', () => {
	it('takes either layout keyword as a kind id', () => {
		expect(
			tsStrict.build.expressionStatement(ts.build.identifier('x'), { terminator: ts.kinds.AutomaticSemicolon })
				.$render()
		).toBe('x\n');
		expect(tsStrict.build.expressionStatement(ts.build.identifier('x'), { terminator: ts.kinds.Semi }).$render()).toBe(
			'x;'
		);
	});
});

describe('an authored field over a registered group', () => {
	it('takes the registered header form as the field value', () => {
		const built = tsStrict.build.forInStatement({
			header: tsStrict.build.forHeader.letConstKind({
				kind: ts.kinds.ConstKeyword,
				left: ts.build.identifier('item'),
				operator: ts.kinds.OfKeyword,
				right: ts.build.identifier('items')
			}),
			body: tsStrict.build.statementBlock({ terminator: ts.kinds.AutomaticSemicolon })
		});
		expect(built.$render()).toBe('for (const item of items) {}\n');
	});
	it('refuses an unbuilt header config on the strict route', () => {
		const refused = () =>
			tsStrict.build.forInStatement({
				// @ts-expect-error a strict field takes a built header
				header: { kind: ts.kinds.ConstKeyword, left: ts.build.identifier('item') },
				body: tsStrict.build.statementBlock({ terminator: ts.kinds.AutomaticSemicolon })
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
			tsStrict.build.memberExpression({ object: word('x'), operator: ts.kinds.Dot, property: word(property) });
		expect(member('for').$render()).toBe('x.for');
		expect(member('class').$render()).toBe('x.class');
	});

	it('refuses it in a slot under the global wordset', () => {
		expect(() => tsStrict.build.nestedIdentifier({ qualifier: word('a'), name: word('for') })).toThrow(
			"NestedIdentifier.name: 'for' is a reserved word"
		);
		expect(() => tsStrict.build.variableDeclaratorPlain({ name: word('for') })).toThrow("'for' is a reserved word");
		expect(() => tsStrict.build.throwStatement(word('for'))).toThrow("ThrowStatement.expression: 'for' is a reserved word");
	});
});
