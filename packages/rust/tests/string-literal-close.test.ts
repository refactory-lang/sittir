import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const ir = (await createEngine(rust)).build;

describe("a built string literal's closing quote", () => {
	it('follows its opening quote or last element with no space', () => {
		expect(ir.stringLiteral({ stringOpen: ir.stringOpen('"'), elements: [] }).$render()).toBe('""');
		expect(ir.stringLiteral({ stringOpen: ir.stringOpen('b"'), elements: [ir.stringContent('y'), ir.escapeSequenceSimple('n')] }).$render()).toBe('b"y\\n"');
		expect(ir.stringLiteral({ stringOpen: ir.stringOpen('"'), elements: [ir.escapeSequenceSimple('"'), ir.stringContent('foo'), ir.escapeSequenceSimple('"')] }).$render()).toBe('"\\"foo\\""');
	});
});
