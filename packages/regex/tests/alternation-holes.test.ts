import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

describe('the strict alternation builder', () => {
	it('takes null at an empty alternative in its type', async () => {
		using engine = await createEngine(regex, { api: 'strict' });
		const b = engine.build;
		const a = b.term(b.term.group({ content: b.patternCharacter('a') }));
		expect(String(b.alternation(a, null, a))).toBe('a||a');
	});
});
