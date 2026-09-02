import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.js';

describe('bare values on a multi-kind slot route to the one arm that admits them', () => {
	it('a bare pass statement becomes a simple-statements line of a module', () => {
		const module = ir.module({ statements: [ir.passStatement()] });
		expect(module.$render()).toBe('pass\n');
	});

	it('a bare expression statement routes the same way', () => {
		const module = ir.module({ statements: [ir.expressionStatement(ir.identifier('main'))] });
		expect(module.$render()).toBe('main\n');
	});
});
