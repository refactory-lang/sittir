/**
 * Regression: python's `type_alias_statement` begins with the keyword
 * `type`, the same spelling as the `type` kind and the `$type` discriminant.
 * The keyword is a grammar-fixed value (exactly one possible token), so it
 * is template text — it has no slot, no storage key, and no parameter — and
 * the only `type`-spelled fact on a node is the kind discriminant `$type`.
 * This pins that shape so a future regression can't reintroduce a stored
 * `_type` key that shadows the kind or the `type` rule's id.
 */

import { describe, it, expect } from 'vitest';
import { ir, TSKindId, render } from '../src/index.ts';

const typeNode = (text: string) => ({ $type: TSKindId.Type, $text: text, $source: 2 }) as any;
const keysOf = (n: unknown) => Object.keys(n as Record<string, unknown>);

describe('python type_alias_statement collision', () => {
	it('$type holds the kind discriminant and the `type` keyword has no storage key', () => {
		const node = ir.typeAlias({ left: typeNode('Foo'), right: typeNode('u64') });

		expect(node.$type).toBe(TSKindId.TypeAliasStatement);
		expect(node.$type).not.toBe(TSKindId.Type);
		expect(keysOf(node)).not.toContain('_type');
		expect(keysOf(node)).toEqual(expect.arrayContaining(['_left', '_right']));
		expect(node.$source).toBe(2);
	});

	it('renders the keyword from the template, not from storage', () => {
		const real = (text: string) => (ir as any).type((ir as any).identifier(text));
		const out = render(ir.typeAlias({ left: real('Foo'), right: real('u64') }) as any);
		const text = typeof out === 'string' ? out : (out as { text?: string }).text;
		// The seam writer must insert the lexically-required space between the
		// `type` keyword and the identifier (and none around `=`).
		expect(text).toBe('type Foo=u64');
	});

	it('instances carry distinct _left/_right and nothing shared but the kind', () => {
		const a = ir.typeAlias({ left: typeNode('A'), right: typeNode('B') });
		const b = ir.typeAlias({ left: typeNode('X'), right: typeNode('Y') });

		expect(a.$type).toBe(b.$type);
		const leftText = (n: unknown) => ((n as Record<string, unknown>)['_left'] as { $text?: string })?.$text;
		expect(leftText(a)).not.toBe(leftText(b));
	});
});
