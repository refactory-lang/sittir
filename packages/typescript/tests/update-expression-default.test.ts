// update_expression's postfix arm is its default, so the update expression
// builder is callable wherever it is mounted, and each arm stays reachable by
// name.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.js';

describe('the update expression default', () => {
	it('resolves an unnamed call through the postfix arm', () => {
		expect(ir.updateExpression({ argument: 'i', operator: '++' }).$render()).toBe('i++');
		expect(ir.expression.update({ argument: 'i', operator: '--' }).$render()).toBe('i--');
	});

	it('keeps each arm reachable by name', () => {
		expect(ir.updateExpression.postfix({ argument: 'i', operator: '++' }).$render()).toBe('i++');
		expect(ir.updateExpression.prefix({ argument: 'i', operator: '++' }).$render()).toBe('++i');
	});

	it('resolves through the default under a sub-factory mount', () => {
		expect(ir.parenthesizedExpression.typed.update({ type: 'T', expression: [{ argument: 'i', operator: '++' }] }).$render()).toBe('(i++: T)');
		expect(ir.parenthesizedExpression.typed.update.prefix({ type: 'T', expression: [{ argument: 'i', operator: '++' }] }).$render()).toBe('(++i: T)');
	});
});
