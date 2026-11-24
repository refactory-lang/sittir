import { describe, expect, it } from 'vitest';
import python from '@sittir/python';
import type { PortableBuildTable, PortableSlotRoute } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';
import { classifierOf, flagHolds, otherTested, portableTextOf, readSlots, slotsOf } from '../src/portable/classify.ts';
import { portableReader } from '../src/portable/read.ts';
import { sharedEngine } from '../src/testing.ts';

const engine = await sharedEngine(() => createEngine(python, { api: 'strict' }));
const rows = engine.portable!;
const table = await (await python.load()).portableBuild!();

const readerOf = (built: PortableBuildTable) =>
	portableReader({
		table: built,
		classify: classifierOf(rows),
		factsOf: () => [],
		flagHolds: (value, flag) => flagHolds(rows, value, flag),
		flagsOf: (kind) => Object.keys(rows.flags[kind] ?? {}),
		textOf: (value) => portableTextOf(rows, value),
		slotsOf: (node) => slotsOf(rows, node),
		readSlots: (node, path, flags) => readSlots(rows, node, path, flags),
		otherTested: (node, path) => otherTested(rows, node, path)
	});

const ITEM = 'clause.resource.item';
const throughAsPattern = (slot: PortableSlotRoute): boolean => slot.steps.length > 1 && slot.steps[0]!.builder === 'asPattern';
const ungated = (slot: PortableSlotRoute): PortableSlotRoute => {
	if (!throughAsPattern(slot)) return slot;
	const { requires: _, ...rest } = slot;
	return rest;
};
const withoutRequires: PortableBuildTable = {
	...table,
	paths: { ...table.paths, [ITEM]: { ...table.paths[ITEM]!, arms: table.paths[ITEM]!.arms.map((arm) => ({ ...arm, slots: arm.slots.map(ungated) })) } }
};
const itemOf = (built: PortableBuildTable, source: string): unknown =>
	(((readerOf(built)(engine.parse(source)) as { statements: readonly { withClause: { items: readonly unknown[] } }[] }).statements[0]!.withClause.items[0]));

describe('a step that enters one form of the kinds its grammar slot holds tests the kind of the node it enters', () => {
	it("stamps the as_pattern step of a with item's value with the as_pattern kind, and the bare route with no kinds", () => {
		const slots = table.paths[ITEM]!.arms.flatMap((arm) => arm.slots.filter((slot) => slot.name === 'value'));
		expect(slots.filter(throughAsPattern).map((slot) => slot.steps[0]!.kinds)).toEqual([[python.kinds.AsPattern]]);
		expect(slots.filter((slot) => !throughAsPattern(slot)).map((slot) => slot.steps[0]!.kinds)).toEqual([undefined]);
	});

	it('reads `with (a):` through the bare route even with no other slot gating the as_pattern route: the parenthesized expression is no as_pattern', () => {
		expect(itemOf(withoutRequires, 'with (a):\n    pass\n')).toEqual({ $path: ITEM, value: { $path: 'expression.parenthesized', expression: 'a' } });
		expect(itemOf(withoutRequires, 'with a as b:\n    pass\n')).toEqual({ $path: ITEM, value: 'a', name: 'b' });
	});
});
