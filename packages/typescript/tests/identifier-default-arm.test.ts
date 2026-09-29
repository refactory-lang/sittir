import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('ir.identifier is the identifier leaf; the undeclared _identifier choice has no namespace', () => {
	it('builds the leaf from its text', () => {
		expect(ts.build.identifier('x').$render()).toBe('x');
	});

	it('carries no arms of the hidden choice', () => {
		expect('identifier' in ts.build.identifier).toBe(false);
		expect('undefined' in ts.build.identifier).toBe(false);
	});

	it('leaves the builder primaryExpression.identifier shares untouched', () => {
		expect(Object.keys(ts.build.primaryExpression.identifier)).toEqual([]);
		expect('undefined' in ts.build.primaryExpression.identifier).toBe(false);
	});
});
