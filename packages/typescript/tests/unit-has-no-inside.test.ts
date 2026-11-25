import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

type Rebuilt = { $render(): unknown };
type Conditional = Rebuilt & { left(): unknown; readonly $with: { left(value: unknown): Rebuilt } };
type Root = Rebuilt & { readonly $errors: readonly unknown[]; $query(): { readonly $descendants: { ofType(kind: number): Iterable<Conditional> } } };

const engines = {
	arena: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'object' }))
};

const rebuilt = (storage: keyof typeof engines, source: string): string => {
	const root = engines[storage].parse(source) as unknown as Root;
	const [held] = root.$query().$descendants.ofType(engines[storage].kinds.ConditionalType);
	if (held === undefined) throw new Error('no conditional type');
	return String(held.$with.left(held.left()).$render());
};

describe('a unique symbol has no inside', () => {
	const source = 'type T = A extends unique /* c */ symbol ? B : C;\n';

	it.each(Object.keys(engines) as (keyof typeof engines)[])('renders a comment between its tokens from the source (%s storage)', (storage) => {
		expect(String((engines[storage].parse(source) as unknown as Root).$render())).toBe(source);
	});

	it('loses that comment when its holder is rebuilt in arena storage, and keeps it in object storage', () => {
		expect(rebuilt('arena', source)).toBe('A extends unique symbol ? B : C');
		expect(rebuilt('object', source)).toBe('A extends unique /* c */ symbol ? B : C');
	});

	it.each(Object.keys(engines) as (keyof typeof engines)[])('renders one missing its second token as its source (%s storage)', (storage) => {
		const missing = 'let x: unique;\n';
		const root = engines[storage].parse(missing) as unknown as Root;
		expect(String(root.$render())).toBe(missing);
		expect(root.$errors).toHaveLength(1);
	});
});
