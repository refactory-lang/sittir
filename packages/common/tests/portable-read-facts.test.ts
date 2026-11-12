import { describe, expect, it } from 'vitest';
import python from '@sittir/python';
import type { PortableBuildTable } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';
import { sharedEngine } from '../src/testing.ts';
import { classifierOf, factsOf, flagHolds, otherTested, portableTextOf, readSlots, slotsOf } from '../src/portable/classify.ts';
import { portableReader, type PortableCarry } from '../src/portable/read.ts';

const engine = await sharedEngine(() => createEngine(python, { api: 'strict' }));
const rows = engine.portable!;
const table = await (await python.load()).portableBuild!();

const readerOf = (built: PortableBuildTable) =>
	portableReader({
		table: built,
		classify: classifierOf(rows),
		factsOf: (node, container) => factsOf(rows, node, container),
		flagHolds: (value, flag) => flagHolds(rows, value, flag),
		flagsOf: (kind) => Object.keys(rows.flags[kind] ?? {}),
		textOf: (value) => portableTextOf(rows, value),
		slotsOf: (node) => slotsOf(rows, node),
		readSlots: (node, path, flags) => readSlots(rows, node, path, flags),
		otherTested: (node, path) => otherTested(rows, node, path)
	});

const withoutFact = (path: string, flag: string): PortableBuildTable => {
	const at = table.paths[path]!;
	return { ...table, paths: { ...table.paths, [path]: { ...at, arms: at.arms.map((arm) => ({ ...arm, facts: (arm.facts ?? []).filter((fact) => fact.flag !== flag) })) } } };
};

const carriesOf = (built: PortableBuildTable, source: string): readonly PortableCarry[] => {
	const carries: PortableCarry[] = [];
	readerOf(built)(engine.parse(source), (_, carry) => carries.push(carry));
	return carries;
};

describe('a fact a container spells on a path that does not declare it', () => {
	const source = 'class A:\n    @override\n    def f(self):\n        pass\n';

	it('keeps the node whole and names the flag, never dropping the fact', () => {
		expect(carriesOf(withoutFact('declaration.method', 'override'), source)).toEqual([{ reason: 'flags', flags: ['override'] }]);
	});

	it('carries nothing when the path declares it', () => {
		expect(carriesOf(table, source)).toEqual([]);
	});
});
