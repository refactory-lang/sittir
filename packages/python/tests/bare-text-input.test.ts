import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('a text leaf slot takes a built node strictly and its text loosely', () => {
	it('rejects bare text strictly, naming the leaf builders', () => {
		// @ts-expect-error a strict slot takes a built node, not text
		expect(() => py.build.stringContent.strict('hello')).toThrow(/a strict factory takes a built node, not a string/);
	});

	it('builds the first text kind, in lexical rank order, whose pattern accepts the text', () => {
		expect(py.build.stringContent.coerce('hello').$render()).toBe('hello');
	});

	it('throws when no text kind accepts the text', () => {
		expect(() => py.build.stringContent.coerce('a"b')).toThrow(/matches none of \[.*string_fragment/);
	});
	it('rejects bare text strictly in a node slot', () => {
		// @ts-expect-error a strict node slot takes a built node, not text
		expect(() => py.build.returnStatement.strict('x')).toThrow(/ReturnStatement\.\w+: a strict factory takes a built node, not a string; expected a built /);
	});
});
