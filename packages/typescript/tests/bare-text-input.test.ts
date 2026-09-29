import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('a text leaf slot takes a built node strictly and its text loosely', () => {
	it('rejects bare text strictly, naming the leaf builders', () => {
		// @ts-expect-error a strict slot takes a built node, not text
		expect(() => ts.build.templateString.strict('a')).toThrow(/a strict factory takes a built node, not a string/);
	});

	it('builds the first text kind, in lexical rank order, whose pattern accepts the text', () => {
		expect(ts.build.templateString.coerce('a').$render()).toBe('`a`');
	});

	it('throws when no text kind accepts the text', () => {
		expect(() => ts.build.templateString.coerce('')).toThrow(/_resolveOne: "" matches none of \[_template_chars/);
	});
	it('rejects bare text strictly in a node slot', () => {
		// @ts-expect-error a strict node slot takes a built node, not text
		expect(() => ts.build.awaitExpression.strict('x')).toThrow(/AwaitExpression\.expression: a strict factory takes a built node, not a string; expected a built /);
	});
});
