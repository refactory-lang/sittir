import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import scm from '../src/index.ts';

const sc = await createEngine(scm);

describe('a loose entry whose one slot holds a child built from spread elements', () => {
	it('takes the spread elements the strict builder takes', () => {
		expect(sc.build.string('a', 'b').$render()).toBe('"ab"');
		expect(sc.build.immediateString('a', 'b').$render()).toBe('"ab"');
	});

	it('passes its own node through when given one argument', () => {
		const own = sc.build.string('a', 'b');
		expect(sc.build.string(own).$render()).toBe(own.$render());
	});
});
