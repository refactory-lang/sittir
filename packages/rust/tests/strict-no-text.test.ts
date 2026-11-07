import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const verifyingStrict = await createEngine(rust, { verifyStructure: 'runtime', api: 'strict' });
const b = rs.build;
const strict = (await createEngine(rust, { api: 'strict' })).build;

describe('a strict builder takes kind ids and booleans, never the text of a keyword or kind', () => {
	it('builds from a boolean and from a kind id', () => {
		expect(strict.selfParameter({ reference: true, mutable: true }).$render()).toBe('&mut self');
		expect(strict.selfParameter({ reference: false, mutable: true }).$render()).toBe('mut self');
		const sum = strict.binaryExpression({ left: strict.identifier('a'), operator: rs.kinds.Plus, right: strict.identifier('b') });
		expect(sum.$render()).toBe('a + b');
	});

	it('refuses the text of a keyword-presence slot', () => {
		const text = { mutable: 'mut' } as never;
		expect(() => verifyingStrict.build.selfParameter(text)).toThrow(/a strict factory takes a built node, not a string; expected a boolean/);
	});

	it('refuses the text of a kind-enum slot', () => {
		const config = { left: verifyingStrict.build.identifier('a'), operator: '+', right: verifyingStrict.build.identifier('b') } as never;
		expect(() => verifyingStrict.build.binaryExpression(config)).toThrow(/a strict factory takes a built node, not a string; expected a kind id/);
	});
});

describe('the loose surface still takes text', () => {
	it('resolves the text of a keyword-presence slot', () => {
		expect(b.selfParameter({ reference: '&', mutable: 'mut' }).$render()).toBe('&mut self');
	});

	it('resolves the text of a kind-enum slot, and an unmapped one stays a refusal', () => {
		expect(b.binaryExpression({ left: 'a', operator: '+', right: 'b' }).$render()).toBe('a + b');
		expect(() => b.binaryExpression({ left: 'a', operator: 'plus' as never, right: 'b' })).toThrow();
	});
});
