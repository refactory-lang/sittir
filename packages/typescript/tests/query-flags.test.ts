import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';
import { hooks } from '../src/api.ts';
import { slotItems } from '../../common/src/query-holds.ts';

/** Every kind-id leaf the reader gives a slot of a node the walk reaches: the stamped id an enum kind's member is read as. */
const leavesRead = (nodes: Iterable<{ readonly $type: number }>): number[] =>
	[...nodes].flatMap((node) => (hooks.querySlots[node.$type] ?? []).flatMap(([accessor]) => slotItems(node, accessor).filter((item): item is number => typeof item === 'number')));
import { queryFlags } from '../src/portable.ts';
import { TSKindId } from '../src/types.ts';

const ts = await createEngine(typescript);

describe('a flag a boolean slot holds', () => {
	const SOURCE = 'class C {\n  static a() {}\n  b() {}\n  static async c() {}\n}\n';

	it('lowers to the plan the slot\'s own eq(true) sends', () => {
		const { root: data, tree: native } = ts.diagnostics.parseAndRead(SOURCE);
		const plans: unknown[] = [];
		const query = (native as { query?: { descendants(step: { plan?: unknown }): unknown } }).query!;
		const walk = query.descendants;
		query.descendants = (step) => {
			plans.push(step.plan);
			return walk(step);
		};
		const found = [
			...hooks
				.wrap(data, native)
				.$query()
				.$descendants.ofType(ts.kinds.MethodDefinitionPlain)
				.where((c) => c.static.eq(true))
		];
		expect(found).toHaveLength(2);
		expect(plans).toContainEqual(queryFlags[TSKindId.MethodDefinitionPlain]!['static']);
	});

	it('is marked on every keyword slot of a member that claims the flag', () => {
		expect(Object.keys(queryFlags[TSKindId.MethodDefinitionPlain]!)).toEqual(
			expect.arrayContaining(['static', 'override', 'readonly', 'async'])
		);
		const asyncSlot = hooks.querySlots[TSKindId.ArrowFunction]!.find(([name]) => name === 'async')![1];
		expect(queryFlags[TSKindId.ArrowFunction]!['async']).toEqual({ op: 'present', slots: { [TSKindId.ArrowFunction]: asyncSlot } });
	});

	it('keys the unique flag by the stamped kind the reader gives a parsed unique symbol, and no other predefined type', () => {
		const types = (source: string) => leavesRead((ts.parse(source) as unknown as { $query(): { $descendants: Iterable<{ readonly $type: number }> } }).$query().$descendants);
		expect(types('let a: unique symbol; let b: symbol;').filter((type) => queryFlags[type]?.['unique'] !== undefined)).toEqual([TSKindId.Unique]);
		expect(queryFlags[TSKindId.Unique]!['unique']).toEqual({ op: 'and', of: [] });
		expect(queryFlags[TSKindId.SymbolKeyword]?.['unique']).toBeUndefined();
	});
});

describe('c.is(flag) with slot comparisons', () => {
	const SOURCE = 'class C {\n  static m() {}\n  m() {}\n  static n() {}\n}\n';
	const methods = () => ts.parse(SOURCE).$query().$descendants.ofType(ts.kinds.MethodDefinitionPlain);
	const spanOf = (node: unknown) => (node as { $_layout: { at: { $span: { start: number; end: number } } } }).$_layout.at.$span;
	const text = (node: unknown) => SOURCE.slice(spanOf(node).start, spanOf(node).end);

	it('pushes the flag and the slot comparison down as one plan, selecting what the read holds', () => {
		const native = [...methods().where((c) => c.is('static').and(c.name.eq('m')))].map(text);
		const reference = [...methods()].filter((m) => m.static() && text(m.name()) === 'm').map(text);
		expect(native).toEqual(['static m() {}']);
		expect(native).toEqual(reference);
	});
});

