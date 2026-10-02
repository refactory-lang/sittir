import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

const ts = await createEngine(typescript);
const x = ts.build.identifier('x');
const y = ts.build.identifier('y');

describe('a loose entry whose one slot holds a child built from spread elements', () => {
	it('takes the spread elements the strict builder takes', () => {
		expect(ts.build.parenthesizedExpression.sequence(x, y).$render()).toBe('(x, y)');
		expect(ts.build.parenthesizedExpression.sequence(x, y).$render()).toBe(ts.build.parenthesizedExpression.sequence.strict(x, y).$render());
	});

	it('wraps its own node when given one argument, as the strict builder does', () => {
		const own = ts.build.parenthesizedExpression.sequence(x, y);
		expect(ts.build.parenthesizedExpression.sequence(own).$render()).toBe('((x, y))');
	});
});
