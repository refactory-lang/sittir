// A leaf has one builder, and it takes text. Reached through a parent's
// sub-builder it is the same builder as at the top of `ir`, with no
// strict/coerce pair, and it refuses a built node of its own kind. A kind
// with no content has one entry form too: the constant, wherever it appears.
import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.ts';

describe('a leaf reached through a parent', () => {
	it('is the same builder as its top-level entry', () => {
		expect(ir.parameter.identifier).toBe(ir.identifier);
	});

	it('carries no strict or coerce form', () => {
		for (const entry of [ir.parameter.identifier, ir.integer.decimal.plain, ir.integer.decimal.long, ir.lineContinuation.newline]) {
			expect(typeof entry).toBe('function');
			expect('strict' in entry).toBe(false);
			expect('coerce' in entry).toBe(false);
		}
	});

	it('builds from text', () => {
		expect(ir.integer.decimal.plain('3').$text).toBe('3');
		expect(ir.integer.decimal.plain(255).$text).toBe('255');
		expect(ir.parameter.identifier('x').$text).toBe('x');
	});

	it('refuses a built node of its own kind', () => {
		const three = ir.integer.decimal.plain('3');
		const name = ir.identifier('x');
		expect(() => ir.integer.decimal.plain(three as never)).toThrow(/integer_decimal_plain/);
		expect(() => ir.parameter.identifier(name as never)).toThrow(/identifier/);
		expect(() => ir.identifier(name as never)).toThrow(/identifier/);
	});

	it('still fills a slot of a parent from a built leaf', () => {
		const name = ir.identifier('x');
		expect(ir.typedParameter({ name, type: ir.type('int') }).name()).toBe(name);
	});
});

describe('a kind with no content reached through a parent', () => {
	it('is the constant its top-level entry is', () => {
		expect(ir.simpleStatement.pass).toBe(ir.passStatement);
		expect(ir.simpleStatement.break).toBe(ir.breakStatement);
		expect(ir.parameter.keywordSeparator).toBe(ir.keywordSeparator);
		expect(typeof ir.lineContinuation.nul).toBe('number');
	});
});
