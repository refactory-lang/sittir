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

	it('reauthored takes two cause pairs and records each cause with its own witnesses', () => {
		const accepts = [{ text: 'get x(a)', form: ['get', { symbol: 'name' }, '(', ')'], kind: 'getter', production: 'p' }] as const;
		const narrowed = [{ text: 'get x()', form: ['get', { symbol: 'name' }, '(', ')'], kind: 'getter', ruling: 'the parameter is excluded' }] as const;
		const tagged = reauthored(
			[
				['accepts-invalid-syntax', accepts],
				['ruled-narrowing', narrowed]
			],
			() => 1
		);
		expect(ruleCauseOf(tagged)).toEqual({
			kind: 'reauthored',
			causes: [
				{ cause: 'accepts-invalid-syntax', witnesses: accepts },
				{ cause: 'ruled-narrowing', witnesses: narrowed }
			]
		});
	});

	it('a ruled-narrowing cause records the ruling its witnesses state', () => {
		const narrowed = [{ text: 'get x()', form: ['get', { symbol: 'name' }, '(', ')'], kind: 'getter', ruling: 'the parameter is excluded' }] as const;
		expect(ruleCauseOf(reauthored('ruled-narrowing', narrowed, () => 1))).toEqual({
			kind: 'reauthored',
			causes: [{ cause: 'ruled-narrowing', witnesses: narrowed }]
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
