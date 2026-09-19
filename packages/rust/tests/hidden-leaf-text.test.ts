import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';

describe('a strict slot that admits a hidden text leaf takes its text', () => {
	it('builds the leaf from text and renders it', () => {
		const literal = ir.stringLiteral.strict({ stringOpen: '"', elements: [ir.stringContent('hi')] });
		expect(literal.$render()).toBe('"hi"');
		const built = ir.stringLiteral.strict({ stringOpen: ir.stringLiteralOpen('"'), elements: [ir.stringContent('hi')] });
		expect(built.$render()).toBe('"hi"');
	});

	it('runs the hidden leaf guard, by name, on unmatched text', () => {
		expect(() => ir.stringLiteral.strict({ stringOpen: 'x', elements: [] })).toThrow(/_string_literal_open: text does not match pattern/);
	});

	it('still rejects a value that is neither the leaf nor text', () => {
		// @ts-expect-error a number is neither a built leaf nor its text
		ir.stringLiteral.strict({ stringOpen: 1, elements: [] });
	});
});
