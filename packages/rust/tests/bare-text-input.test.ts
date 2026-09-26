import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';

describe('a text leaf slot takes a built node strictly and its text loosely', () => {
	it('takes the built leaf strictly and renders it', () => {
		const built = ir.stringLiteral.strict({ stringOpen: ir.stringOpen('"'), elements: [ir.stringContent('hi')] });
		expect(built.$render()).toBe('"hi"');
	});

	it('rejects bare text strictly, naming the leaf builder', () => {
		// @ts-expect-error a strict slot takes a built node, not text
		expect(() => ir.stringLiteral.strict({ stringOpen: '"', elements: [] })).toThrow(/a strict factory takes a built node, not a string; expected buildStringOpen/);
	});

	it('builds the sole text leaf from bare text when coercing', () => {
		expect(ir.stringLiteral.coerce({ stringOpen: '"', elements: [ir.stringContent('hi')] }).$render()).toBe('"hi"');
	});

	it('runs the leaf guard on unmatched text when coercing', () => {
		expect(() => ir.stringLiteral.coerce({ stringOpen: 'x', elements: [] })).toThrow(/"x" is not a string_open/);
	});
	it('rejects bare text strictly in a node slot', () => {
		// @ts-expect-error a strict node slot takes a built node, not text
		expect(() => ir.returnExpression.strict('x')).toThrow(/ReturnExpression\.expression: a strict factory takes a built node, not a string; expected a built /);
	});
});
