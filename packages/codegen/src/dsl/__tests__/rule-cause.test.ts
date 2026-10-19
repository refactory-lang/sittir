import { describe, expect, it } from 'vitest';
import { reauthored, vocabulary, ruleCauseOf } from '../primitives/rule-cause.ts';

describe('rule-cause declarations', () => {
	it('reauthored tags the function with its cause and returns the same function', () => {
		const body = ($: unknown) => $;
		const tagged = reauthored('ambiguity', body);
		expect(tagged).toBe(body);
		expect(ruleCauseOf(tagged)).toEqual({ kind: 'reauthored', causes: [{ cause: 'ambiguity' }] });
	});

	it('reauthored records every witness it is given', () => {
		const witnesses = [
			{ text: 'get x(a)', form: ['get', { symbol: 'name' }, '(', { symbol: 'parameter' }, ')'], kind: 'getter', production: 'p' },
			{ text: 'set x()', form: ['set', { symbol: 'name' }, '(', ')'], kind: 'getter', production: 'q' }
		] as const;
		const tagged = reauthored('accepts-invalid-syntax', witnesses, () => 1);
		expect(ruleCauseOf(tagged)).toEqual({ kind: 'reauthored', causes: [{ cause: 'accepts-invalid-syntax', witnesses }] });
	});

	it('reauthored stamps every cause pair it is given, in order', () => {
		const witness = { text: 'get x(a)', form: ['get', { symbol: 'name' }], kind: 'getter', production: 'p' } as const;
		const tagged = reauthored([['ambiguity'], ['accepts-invalid-syntax', [witness]]], () => 1);
		expect(ruleCauseOf(tagged)).toEqual({
			kind: 'reauthored',
			causes: [{ cause: 'ambiguity' }, { cause: 'accepts-invalid-syntax', witnesses: [witness] }]
		});
	});

	it('vocabulary tags without a cause', () => {
		expect(ruleCauseOf(vocabulary(() => 1))).toEqual({ kind: 'vocabulary' });
	});

	it('an untagged function has no declaration', () => {
		expect(ruleCauseOf(() => 1)).toBeUndefined();
		expect(ruleCauseOf(undefined)).toBeUndefined();
	});

	it('the tag is not enumerable, so spreading the rules map keeps functions plain', () => {
		const tagged = reauthored('alias-shape', () => 1);
		expect(Object.keys(tagged)).toEqual([]);
	});
});
