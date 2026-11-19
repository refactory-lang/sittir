import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

type Node = Iterable<unknown> & {
	readonly $type: number;
	$render(): string;
	$query(): { $descendants: { ofType(kind: number): { at(index: number): Node | undefined } } };
	readonly $with: Record<string, (...items: unknown[]) => Node>;
};

const LISTS = [
	['ordered_field_declaration_list', 'OrderedFieldDeclarationList', 'struct S(pub i32, i32);\n', '(pub i32, i32)'],
	['type_arguments', 'TypeArguments', 'fn f() { g::<usize, u8>(); }\n', '<usize, u8>'],
	['parameters', 'Parameters', 'type F = fn(i32, u8);\n', '(i32, u8)']
] as const;

const LIST_HOLDERS = LISTS.filter(([list]) => list !== 'parameters');

describe.each(['object', 'arena'] as const)('a list whose items read as bare units takes them back, %s storage', (nodeStorage) => {
	const open = async (source: string) => {
		const engine = (await createEngine(rust, { nodeStorage })) as unknown as { parse(source: string): Node; kinds: Record<string, number>; [Symbol.dispose](): void };
		return { engine, root: engine.parse(source) };
	};

	it.each(LISTS)('%s, set through its elements list', async (_, kind, source, rendered) => {
		const { engine, root } = await open(source);
		using _engine = engine;
		const elements = root.$query().$descendants.ofType(engine.kinds[`${kind}Elements`]!).at(0)!;
		expect(elements.$with.items!(...elements).$render()).toBe(rendered.slice(1, -1));
	});

	it.each(LIST_HOLDERS)('%s, set through its holder', async (_, kind, source, rendered) => {
		const { engine, root } = await open(source);
		using _engine = engine;
		const holder = root.$query().$descendants.ofType(engine.kinds[kind]!).at(0)!;
		const elements = root.$query().$descendants.ofType(engine.kinds[`${kind}Elements`]!).at(0)!;
		expect(holder.$with.elements!(...elements).$render()).toBe(rendered);
	});
});
