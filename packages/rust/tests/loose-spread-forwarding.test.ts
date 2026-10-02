import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import { coerceToFunctionTypeFnForm } from '../src/factories/coerce.ts';

await createEngine(rust);

describe('a loose entry whose one slot holds a child built from spread elements', () => {
	it('takes the spread elements the strict builder takes', () => {
		const modifiers = coerceToFunctionTypeFnForm('async', 'unsafe').functionModifiers();
		expect(modifiers?._modifier).toHaveLength(2);
	});

	it('passes its own node through when given one argument', () => {
		const own = coerceToFunctionTypeFnForm('async', 'unsafe');
		expect(coerceToFunctionTypeFnForm(own)).toBe(own);
	});
});
