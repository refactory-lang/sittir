import { describe, it, expect } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('an empty array at a list slot', () => {
	it('is the slot absent when the slot is optional', () => {
		expect(rs.build.arguments().$render()).toBe('()');
		expect(rs.build.arguments([]).$render()).toBe('()');
		expect(rs.build.callExpression({ function: 'f', arguments: [] }).$render()).toBe('f()');
	});

	it('still fails the list factory guard, by name, when the slot is required', () => {
		// @ts-expect-error a non-empty list takes at least one element, so the type refuses the empty call the guard also refuses
		expect(() => rs.build.enumVariantListElements.strict()).toThrow(/enum_variant_list_elements\.elements: requires at least one element/);
		expect(() => rs.build.traitBounds.strict()).toThrow(/trait_bounds\.children: requires at least one element/);
	});
});
