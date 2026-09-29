import { describe, it, expect } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('bare values on a multi-kind slot route to the one arm that admits them', () => {
	it('a bare pass statement becomes a simple-statements line of a module', () => {
		const module = py.build.module({ statements: [py.build.passStatement()] });
		expect(module.$render()).toBe('pass\n');
	});

	it('a bare expression statement routes the same way', () => {
		const module = py.build.module({ statements: [py.build.expressionStatement(py.build.identifier('main'))] });
		expect(module.$render()).toBe('main\n');
	});
});
