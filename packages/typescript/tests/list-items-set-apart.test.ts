import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { sharedEngine } from '@sittir/common/testing';
import typescript from '../src/index.ts';

type Rebuilt = { $render(): unknown };
type List = Rebuilt & { elements(): readonly unknown[]; readonly $with: { elements(...items: readonly unknown[]): Rebuilt } };
type Root = Rebuilt & { readonly $errors: readonly unknown[]; $query(): { readonly $descendants: { ofType(kind: number): Iterable<List> } } };

const engines = {
	arena: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'arena' })),
	object: await sharedEngine(() => createEngine(typescript, { nodeStorage: 'object' }))
};

describe.each(Object.keys(engines) as (keyof typeof engines)[])('a blank line between list items (%s storage)', (storage) => {
	const ts = engines[storage];

	it.each([
		['e(0,\n\n6)', 'Arguments', '(0,\n\n6)'],
		['e(0,\n\n6,\n7)', 'Arguments', '(0,\n\n6, 7)'],
		['e(0,\n1,\n\n2)', 'Arguments', '(0, 1,\n\n2)'],
		['x = [0,\n\n1,\n2]', 'Array', '[0,\n\n1, 2]'],
		['e(0,\n\nf(1),\n2,\n\ng(3))', 'Arguments', '(0,\n\nf(1), 2,\n\ng(3))'],
		['e(f(0),\n\n1,\n\ng(2))', 'Arguments', '(f(0),\n\n1,\n\ng(2))']
	] as const)('%j stays on its item when the list is rebuilt', (source, kind, rebuilt) => {
		const root = ts.parse(source) as unknown as Root;
		expect(String(root.$render())).toBe(source);
		const [list] = root.$query().$descendants.ofType(ts.kinds[kind]);
		expect(String(list!.$with.elements(...list!.elements()).$render())).toBe(rebuilt);
	});

	it('reads a list whose blank line comes before an ERROR', () => {
		const source = 'e(0,\n\nreturn 6)';
		const root = ts.parse(source) as unknown as Root;
		expect(String(root.$render())).toBe(source);
		expect(root.$errors).toHaveLength(1);
	});
});
