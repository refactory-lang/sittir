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

	it('a hidden helper built outside any engine is never checked, and the native decode refuses a wrong-typed value in its optional leaf slot', () => {
		const rendered = (digits: unknown) => trusting.render(buildCountQuantifierGroup(digits as never)).toString();
		expect(() => rendered(1n)).toThrow(/DecimalDigitsTransport: expected a string, a kind id or an object, not a bigint/);
		expect(() => rendered(true)).toThrow(/DecimalDigitsTransport: expected a string, a kind id or an object, not a boolean/);
		expect(() => rendered({})).toThrow(/DecimalDigitsTransport: an object carries no `\$text`, and the kind has no fixed text/);
		expect(rendered('3')).toBe(',3');
	});
});
