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
import { createEngine, Source, sourceOf } from '@sittir/common';

const py = await createEngine(python, { nodeStorage: 'object' });

const typeNode = (text: string) => py.build.type(py.build.identifier(text));
const keysOf = (n: unknown) => Object.keys(n as Record<string, unknown>);

describe('python type_alias_statement collision', () => {
	it('$type holds the kind discriminant and the `type` keyword has no storage key', () => {
		const node = py.build.typeAliasStatement({ name: py.build.identifier('Foo'), value: typeNode('u64') });

		expect(node.$type).toBe(py.kinds.TypeAliasStatement);
		expect(node.$type).not.toBe(py.kinds.Type);
		expect(keysOf(node)).not.toContain('_type');
		expect(keysOf(node)).toEqual(expect.arrayContaining(['_name', '_value']));
		expect(sourceOf(node)).toBe(Source.Factory);
	});

	it('renders the keyword from the template, not from storage', () => {
		const text = py.build.typeAliasStatement({ name: py.build.identifier('Foo'), value: typeNode('u64') }).$render!();
		// The seam writer must insert the lexically-required space between the
		// `type` keyword and the identifier, and the declared default spaces around `=`.
		expect(text).toBe('type Foo = u64');
	});

	it('instances carry distinct _name/_value and nothing shared but the kind', () => {
		const a = py.build.typeAliasStatement({ name: py.build.identifier('A'), value: typeNode('B') });
		const b = py.build.typeAliasStatement({ name: py.build.identifier('X'), value: typeNode('Y') });

		expect(a.$type).toBe(b.$type);
		expect(a.$render!()).not.toBe(b.$render!());
	});
});
