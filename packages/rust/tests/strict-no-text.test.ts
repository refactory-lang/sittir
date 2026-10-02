import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const b = rs.build;

describe('a strict builder takes kind ids and booleans, never the text of a keyword or kind', () => {
	it('builds from a boolean and from a kind id', () => {
		expect(b.selfParameter.strict({ reference: true, mutableSpecifier: true }).$render()).toBe('&mut self');
		expect(b.selfParameter.strict({ reference: false, mutableSpecifier: true }).$render()).toBe('mut self');
		const sum = b.binaryExpression.strict({ left: b.identifier('a'), operator: rs.kinds.Plus, right: b.identifier('b') });
		expect(sum.$render()).toBe('a + b');
	});

	it('refuses the text of a keyword-presence slot', () => {
		const text = { mutableSpecifier: 'mut' } as never;
		expect(() => b.selfParameter.strict(text)).toThrow(/a strict factory takes a built node, not a string; expected a boolean/);
	});

	it('refuses the text of a kind-enum slot', () => {
		const config = { left: b.identifier('a'), operator: '+', right: b.identifier('b') } as never;
		expect(() => b.binaryExpression.strict(config)).toThrow(/a strict factory takes a built node, not a string; expected a kind id/);
	});
});

describe('the loose surface still takes text', () => {
	it('resolves the text of a keyword-presence slot', () => {
		expect(b.selfParameter.coerce({ reference: '&', mutableSpecifier: 'mut' }).$render()).toBe('&mut self');
	});

	it('resolves the text of a kind-enum slot, and an unmapped one stays a refusal', () => {
		expect(b.binaryExpression.coerce({ left: 'a', operator: '+', right: 'b' }).$render()).toBe('a + b');
		expect(() => b.binaryExpression.coerce({ left: 'a', operator: 'plus' as never, right: 'b' })).toThrow();
	});
});
