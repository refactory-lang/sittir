import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import regex from '../src/index.ts';
import { buildCountQuantifierGroup } from '../src/factories/raw.ts';

const trusting = await createEngine(regex);
const verifying = await createEngine(regex, { verifyStructure: 'runtime' });

const quantifier = (engine: typeof trusting, content: unknown) =>
	(engine.build.countQuantifier.strict as unknown as (config: { content: unknown }) => { $render(): string })({ content });

describe('a value the strict types refuse, given anyway: the default mode trusts the types', () => {
	it('bare text in a node slot renders as verbatim by default, and is refused in runtime mode', () => {
		expect(quantifier(trusting, '3').$render()).toBe('{3}');
		expect(() => quantifier(verifying, '3')).toThrow('CountQuantifier.content: a strict factory takes a built node, not a string');
	});

	it('a value of another type is refused by the native decode by default, and bare text before it in runtime mode', () => {
		expect(() => quantifier(trusting, 1n).$render()).toThrow(/expected u16 kind_id, string, or object with \$type/);
		expect(() => quantifier(trusting, true).$render()).toThrow(/expected u16 kind_id, string, or object with \$type/);
		expect(() => quantifier(verifying, 1n)).toThrow('CountQuantifier.content: a strict factory takes a built node, not a bigint');
	});

	it('a hidden helper built outside any engine is never checked, and its optional leaf slot drops a wrong-typed value without a word', () => {
		const rendered = (digits: unknown) => trusting.render(buildCountQuantifierGroup(digits as never)).toString();
		expect(rendered(1n)).toBe(',');
		expect(rendered(true)).toBe(',');
		expect(rendered({})).toBe(',');
		expect(rendered('3')).toBe(',3');
	});
});
