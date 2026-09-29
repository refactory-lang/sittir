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
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

const typeNode = (text: string) => py.build.type(py.build.identifier(text));
const keysOf = (n: unknown) => Object.keys(n as Record<string, unknown>);

describe('python type_alias_statement collision', () => {
	it('$type holds the kind discriminant and the `type` keyword has no storage key', () => {
		const node = py.build.typeAliasStatement({ left: typeNode('Foo'), right: typeNode('u64') });

		expect(node.$type).toBe(py.kinds.TypeAliasStatement);
		expect(node.$type).not.toBe(py.kinds.Type);
		expect(keysOf(node)).not.toContain('_type');
		expect(keysOf(node)).toEqual(expect.arrayContaining(['_left', '_right']));
		expect(node.$source).toBe(2);
	});

	it('renders the keyword from the template, not from storage', () => {
		const text = py.build.typeAliasStatement({ left: typeNode('Foo'), right: typeNode('u64') }).$render!();
		// The seam writer must insert the lexically-required space between the
		// `type` keyword and the identifier, and the declared default spaces around `=`.
		expect(text).toBe('type Foo = u64');
	});

	it('instances carry distinct _left/_right and nothing shared but the kind', () => {
		const a = py.build.typeAliasStatement({ left: typeNode('A'), right: typeNode('B') });
		const b = py.build.typeAliasStatement({ left: typeNode('X'), right: typeNode('Y') });

		expect(a.$type).toBe(b.$type);
		expect(a.$render!()).not.toBe(b.$render!());
	});
});
