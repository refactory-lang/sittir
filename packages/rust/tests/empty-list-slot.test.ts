import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('an empty array at a list slot', () => {
	it('is the slot absent when the slot is optional', () => {
		expect(ir.arguments().$render()).toBe('()');
		expect(ir.arguments([]).$render()).toBe('()');
		expect(ir.callExpression({ function: 'f', arguments: [] }).$render()).toBe('f()');
	});

	it('still fails the list factory guard, by name, when the slot is required', () => {
		expect(() => ir.enumVariantListElements.strict()).toThrow(/enum_variant_list_elements\.elements: requires at least one element/);
		expect(() => ir.traitBounds.strict()).toThrow(/trait_bounds\.children: requires at least one element/);
	});
});
