import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const re = await createEngine(regex);

describe('an identity escape takes its input', () => {
	it('passes a read leaf of another kind through: `\\-` in a class reads as the anonymous token', () => {
		const leaf = { $type: re.kinds.BslashDash, $source: 0, $named: true, $text: '\\-', $span: { start: 1, end: 3 } };
		expect(re.build.identityEscape.coerce(leaf as never)).toBe(leaf);
	});

	it('still builds from a config object and from text', () => {
		expect(re.build.identityEscape.coerce({ content: '.' }).$render()).toBe('\\.');
		expect(re.build.identityEscape.coerce('\\.').$render()).toBe('\\.');
	});

	it('still enforces the content guard, and shows what it rejected', () => {
		expect(() => re.build.identityEscape.coerce({ content: 'k' })).toThrow('identity_escape.content: text does not match pattern: k');
		expect(() => re.build.identityEscape.strict({ a: 1 } as never)).toThrow('text does not match pattern: {"a":1}');
	});
});
