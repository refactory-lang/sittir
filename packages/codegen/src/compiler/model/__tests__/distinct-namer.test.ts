import { describe, expect, it } from 'vitest';
import { distinctNamer } from '../casing.ts';

describe('distinctNamer', () => {
	const named = (names: readonly string[]): string[] => names.map(distinctNamer());

	it('leaves names that do not repeat as they are', () => {
		expect(named(['Inline', 'Volatile'])).toEqual(['Inline', 'Volatile']);
	});

	it('numbers a repeat from 2, in order', () => {
		expect(named(['Inline', 'Inline', 'Auto', 'Inline'])).toEqual(['Inline', 'Inline2', 'Auto', 'Inline3']);
	});

	it('steps past a number another name already holds', () => {
		expect(named(['Inline2', 'Inline', 'Inline'])).toEqual(['Inline2', 'Inline', 'Inline3']);
	});
});
