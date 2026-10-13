import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('a bare string at a single-leaf slot is checked once, by the leaf builder', () => {
	it('refuses text its leaf pattern rejects with the builder guard', () => {
		expect(() => ts.build.regex.coerce({ pattern: 'a', flags: 'A1' })).toThrow(/^regex_flags: text does not match pattern/);
	});

	it('builds text its leaf pattern accepts', () => {
		expect(() => ts.build.regex.coerce({ pattern: 'a', flags: 'g' }).$render()).not.toThrow();
	});
});
