// A leaf has one builder, and it takes text. Reached through a parent's
// sub-builder it is the same builder as at the top of `ir`, with no
// strict/coerce pair, and it refuses a built node of its own kind. A kind
// with no content has one entry form too: the constant, wherever it appears.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.ts';

describe('a leaf reached through a parent', () => {
	it('carries no strict or coerce form', () => {
		for (const entry of [ir.identifier, ir.charLiteral.empty]) {
			expect(typeof entry).toBe('function');
			expect('strict' in entry).toBe(false);
			expect('coerce' in entry).toBe(false);
		}
	});

	it('builds from text and refuses a built node of its own kind', () => {
		const name = ir.identifier('x');
		expect(name.$text).toBe('x');
		expect(() => ir.identifier(name as never)).toThrow(/identifier/);
	});

	it('still fills a slot of a parent from a built leaf', () => {
		const name = ir.identifier('x');
		expect(ir.awaitExpression(name).expression()).toBe(name);
	});
});

describe('a kind with no content reached through a parent', () => {
	it('is the constant its top-level entry is', () => {
		expect(ir.declarationStatement.empty).toBe(ir.emptyStatement);
		expect(typeof ir.declarationStatement.empty).toBe('number');
	});
});
