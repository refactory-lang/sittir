import { describe, expect, it } from 'vitest';
import { reauthored, vocabulary, ruleCauseOf } from '../primitives/rule-cause.ts';

describe('rule-cause declarations', () => {
	it('reauthored tags the function with its cause and returns the same function', () => {
		const body = ($: unknown) => $;
		const tagged = reauthored('ambiguity', body);
		expect(tagged).toBe(body);
		expect(ruleCauseOf(tagged)).toEqual({ kind: 'reauthored', cause: 'ambiguity' });
	});

	it('vocabulary tags without a cause', () => {
		expect(ruleCauseOf(vocabulary(() => 1))).toEqual({ kind: 'vocabulary' });
	});

	it('an untagged function has no declaration', () => {
		expect(ruleCauseOf(() => 1)).toBeUndefined();
		expect(ruleCauseOf(undefined)).toBeUndefined();
	});

	it('the tag is not enumerable, so spreading the rules map keeps functions plain', () => {
		const tagged = reauthored('lexical-interior', () => 1);
		expect(Object.keys(tagged)).toEqual([]);
	});
});
