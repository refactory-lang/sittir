import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import rust from '../src/index.ts';

type Rebuilt = { $render(): unknown };
type Held = Rebuilt & { readonly $with: Record<string, (value: unknown) => Rebuilt> } & Record<string, () => unknown>;
type Root = Rebuilt & { readonly $errors: readonly unknown[]; $query(): { readonly $descendants: { ofType(kind: number): Iterable<Held> } } };

const engines = {
	arena: await sharedEngine(() => createEngine(rust, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(rust, { nodeStorage: 'object' }))
};

const first = (root: Root, kind: number): Held => {
	const [held] = root.$query().$descendants.ofType(kind);
	if (held === undefined) throw new Error(`no node of kind ${kind}`);
	return held;
};

describe.each(Object.keys(engines) as (keyof typeof engines)[])('a unit has no inside (%s storage)', (storage) => {
	const rs = engines[storage];

	it('renders a comment between its tokens from the source, and loses it when its holder is rebuilt', () => {
		const source = 'let x = (/* c */);\n';
		const root = rs.parse(source) as unknown as Root;
		expect(String(root.$render())).toBe(source);
		const declaration = first(root, rs.kinds.LetDeclaration);
		expect(String(declaration.$with.value!(declaration.value!()).$render())).toBe('let x = ();');
	});

	it('keeps an ERROR in a parenthesized type through a rebuild of its holder', () => {
		const source = 'fn f(a: (self: Box<Self>)) {}\n';
		const root = rs.parse(source) as unknown as Root;
		expect(String(root.$render())).toBe(source);
		expect(root.$errors).toHaveLength(1);
		const parameter = first(root, rs.kinds.Parameter);
		expect(String(parameter.$with.type!(parameter.type!()).$render())).toBe('a: (self: Box<Self>)');
	});
});
