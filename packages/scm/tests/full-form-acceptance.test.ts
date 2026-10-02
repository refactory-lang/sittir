import { describe, expect, it } from 'vitest';
import scm from '../src/index.ts';
import { createEngine } from '@sittir/common';

const sc = await createEngine(scm);

describe('builders and their kind spelled in full', () => {
	it('takes the delimiters in the text only when told they are there', () => {
		expect(sc.build.escapeSequence('\\n', false).$render()).toBe('\\n');
	});

	it('strips the literal delimiters around a pattern leaf', () => {
		expect(sc.build.capture('@x').$render()).toBe('@x');
		expect(sc.build.capture('x').$render()).toBe('@x');
	});
});
