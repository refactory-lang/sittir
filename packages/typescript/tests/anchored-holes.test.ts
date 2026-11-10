import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { classifierOf } from '@sittir/common/portable';
import { nodeAddressOf, treeOf } from '@sittir/common/utils';
import type { PortableCondition, PortableRows, QueryPlan, StepAnchor } from '@sittir/types';
import typescript from '../src/index.ts';
import { rows } from '../src/portable/index.ts';
import { TSKindId } from '../src/types.ts';
import { querySlots } from '../src/utils.ts';

const ts = await createEngine(typescript);

const slotOf = (kind: number, accessor: string) => ({ slots: { [kind]: querySlots[kind]!.find(([name]) => name === accessor)![1] } });
const elements = slotOf(TSKindId.Array, 'elements');
const PROPERTIES: QueryPlan = { op: 'present', ...slotOf(TSKindId.Object, 'properties') };

const arrayIn = (source: string) => [...ts.parse(source).$query().$descendants.ofType(ts.kinds.Array)][0]!;

const readsThrough = (anchor: StepAnchor, node: ReturnType<typeof arrayIn>): boolean => {
	const condition: PortableCondition = { up: 0, via: [{ ...elements, anchor }], plan: PROPERTIES };
	const probed: PortableRows = { ...rows, table: { ...rows.table, entries: { ...rows.table.entries, [TSKindId.Array]: [{ path: 'probe', within: [], test: [condition] }] } } };
	return classifierOf(probed)(node) === 'probe';
};

const holdsNatively = (anchor: StepAnchor, node: ReturnType<typeof arrayIn>): boolean | undefined =>
	treeOf(node)!.query!.planHolds([nodeAddressOf(node)!], { op: 'child', ...elements, anchor, of: PROPERTIES })[0];

describe('an anchored step over a list with holes', () => {
	it.each([
		['last', 'x = [{}, {a: 1}, ,];', true],
		['first', 'x = [, {a: 1}];', true],
		['only', 'x = [{a: 1}, ,];', true],
		['last', 'x = [{a: 1}, {}, ,];', false],
		['first', 'x = [, {}, {a: 1}];', false]
	] as const)('anchors on the %s value, skipping holes, in the read and natively: %s', (anchor, source, expected) => {
		const node = arrayIn(source);
		expect(node.elements()).toContain(null);
		expect(holdsNatively(anchor, node)).toBe(expected);
		expect(readsThrough(anchor, node)).toBe(expected);
	});
});
