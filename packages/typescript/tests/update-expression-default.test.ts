// update_expression's postfix arm is its default, so the update expression
// builder is callable wherever it is mounted, and each arm stays reachable by
// name.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('the update expression default', () => {
	it('resolves an unnamed call through the postfix arm', () => {
		expect(ts.build.updateExpression({ argument: 'i', operator: '++' }).$render()).toBe('i++');
		expect(ts.build.expression.update({ argument: 'i', operator: '--' }).$render()).toBe('i--');
	});

	it('keeps each arm reachable by name', () => {
		expect(ts.build.updateExpression.postfix({ argument: 'i', operator: '++' }).$render()).toBe('i++');
		expect(ts.build.updateExpression.prefix({ argument: 'i', operator: '++' }).$render()).toBe('++i');
	});

	it('resolves the default and named arm in the explicitly named expression field', () => {
		expect(ts.build.parenthesizedExpression.typed({ type: 'T', expression: ts.build.updateExpression({ argument: 'i', operator: '++' }) }).$render()).toBe('(i++: T)');
		expect(ts.build.parenthesizedExpression.typed({ type: 'T', expression: ts.build.updateExpression.prefix({ argument: 'i', operator: '++' }) }).$render()).toBe('(++i: T)');
	});
});
