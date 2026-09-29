import { describe, expect, it } from 'vitest';
import scm from '../src/index.ts';
import { createEngine } from '@sittir/common';

const sc = await createEngine(scm);

describe('builders accept their kind spelled in full', () => {
	it('strips the literal delimiters around a pattern content', () => {
		expect(sc.build.escapeSequence('\\n').$render()).toBe('\\n');
	});

	it('strips the literal delimiters around a pattern leaf', () => {
		expect(sc.build.capture('@x').$render()).toBe('@x');
		expect(sc.build.capture('x').$render()).toBe('@x');
	});
});
