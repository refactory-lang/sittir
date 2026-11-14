import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe('a sign before an operand that starts with the same sign', () => {
	it.each(['-', '+'] as const)('keeps a built `%s` apart from the one after it', async (sign) => {
		using ts = await createEngine(typescript);
		const twice = ts.build.unaryExpression({
			operator: sign,
			argument: ts.build.unaryExpression({ operator: sign, argument: ts.build.identifier('x') })
		});
		const declaration = ts.build.lexicalDeclaration({
			kind: ts.kinds.LetKeyword,
			declarators: [ts.build.variableDeclaratorPlain({ name: ts.build.identifier('a'), value: twice })]
		});
		expect(declaration.$render()).toBe(`let a = ${sign} ${sign}x;`);
		expect(ts.build.expressionStatement(twice).$render()).toBe(`${sign} ${sign}x;`);
	});
});
