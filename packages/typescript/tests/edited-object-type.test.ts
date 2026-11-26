import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

interface Member {
	readonly $with: { name(value: string): Member };
}
interface List extends Iterable<Member> {
	readonly $with: { items(...items: unknown[]): List };
	$render(): string;
}

interface Ts {
	parse(source: string): unknown;
	render(node: never, options: never): unknown;
	readonly kinds: { readonly ObjectTypeContent: number; readonly Comma: number; readonly Semi: number };
}

const listOf = (engine: Ts, source: string): List => (engine.parse(source) as any).$query().$descendants.ofType(engine.kinds.ObjectTypeContent).at(0);
const edited = (list: List): List => {
	const [a, b, ...rest] = [...list];
	return list.$with.items(a, b!.$with.name('z'), ...rest);
};

describe.each(['object', 'arena'] as const)('an edited object type (%s storage)', (nodeStorage) => {
	it('a_mixed_object_type_writes_the_lists_separator', async () => {
		using ts = await createEngine(typescript, { nodeStorage });
		expect(edited(listOf(ts, 'type T = { a: string, b: number; c: boolean; d: string }\n')).$render()).toBe('a: string;\nz: number;\nc: boolean;\nd: string');
		expect(edited(listOf(ts, 'type T = { a: string; b: number, c: boolean }\n')).$render()).toBe('a: string;\nz: number;\nc: boolean');
		expect(edited(listOf(ts, 'type T = { a: string, b: number, c: boolean; d: string }\n')).$render()).toBe('a: string,\nz: number,\nc: boolean,\nd: string');
	});
});

describe('a list separator is resolved against the options its tree was read with', () => {
	it('the_separator_is_resolved_against_the_options_a_tree_was_read_with', async () => {
		using objects = await createEngine(typescript, { nodeStorage: 'object' });
		using arena = await createEngine(typescript, { nodeStorage: 'arena' });
		const sources = ['type T = { a: string; b: number; c: boolean }\n', 'type T = { a: string, b: number, c: boolean }\n'];
		for (const source of sources) {
			for (const kind of ['Comma', 'Semi'] as const) {
				const rendered = (engine: Ts) => {
					const list = listOf(engine, source);
					const render = { objectTypeContent: { item: { separator: { kind: engine.kinds[kind] } } } };
					return String(engine.render(list.$with.items(...list) as never, render as never));
				};
				expect(rendered(arena), `${source} under ${kind}`).toBe(rendered(objects));
			}
		}
	});
});
