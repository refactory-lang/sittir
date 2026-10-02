import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const re = await createEngine(regex);

describe('an identity escape takes its input', () => {
	it('builds from its content, or from the escape spelled in full when told the affix is in the text', () => {
		expect(re.build.identityEscape('.').$render()).toBe('\\.');
		expect(re.build.identityEscape('\\.', false).$render()).toBe('\\.');
	});

	it('takes text only: it has no strict or coercing side', () => {
		expect(Object.keys(re.build.identityEscape)).toEqual([]);
	});

	it('enforces the content guard, and shows what it rejected', () => {
		expect(() => re.build.identityEscape('k')).toThrow('identity_escape.content: text does not match pattern: k');
		expect(() => re.build.identityEscape('\\.')).toThrow('identity_escape.content: text does not match pattern: \\.');
		expect(() => re.build.identityEscape({ a: 1 } as never)).toThrow('text does not match pattern: {"a":1}');
	});

	it('refuses text given as spelled in full that lacks the affix', () => {
		const text: string = '.';
		expect(() => re.build.identityEscape(text as `\\${string}`, false)).toThrow(/identity_escape: text given with its affixes must be/);
	});
});
