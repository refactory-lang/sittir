import { describe, expect, it } from 'vitest';
import { ir } from '../src/index.ts';

describe('a text leaf slot takes a built node strictly and its text loosely', () => {
	it('rejects bare text strictly, naming the leaf builders', () => {
		// @ts-expect-error a strict slot takes a built node, not text
		expect(() => ir.stringContent.strict('hello')).toThrow(/a strict factory takes a built node, not a string/);
	});

	it('builds the first text kind, in lexical rank order, whose pattern accepts the text', () => {
		expect(ir.stringContent.coerce('hello').$render()).toBe('hello');
	});

	it('throws when no text kind accepts the text', () => {
		expect(() => ir.stringContent.coerce('a"b')).toThrow(/matches none of \[.*_string_content/);
	});
	it('rejects bare text strictly in a node slot', () => {
		// @ts-expect-error a strict node slot takes a built node, not text
		expect(() => ir.returnStatement.strict('x')).toThrow(/ReturnStatement\.\w+: a strict factory takes a built node, not a string; expected a built /);
	});
});
