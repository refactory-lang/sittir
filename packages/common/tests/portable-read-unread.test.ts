import { describe, expect, it } from 'vitest';
import rust from '@sittir/rust';
import type { PortableBuildTable } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';
import { classifierOf, flagHolds, portableTextOf, readSlots, slotsOf } from '../src/portable/classify.ts';
import { portableReader, type PortableCarry } from '../src/portable/read.ts';

const engine = await createEngine(rust, { api: 'strict' });
const rows = engine.portable!;
const table = await (await rust.load()).portableBuild!();

const readerOf = (built: PortableBuildTable) =>
	portableReader({
		table: built,
		classify: classifierOf(rows),
		flagHolds: (value, flag) => flagHolds(rows, value, flag),
		flagsOf: (kind) => Object.keys(rows.flags[kind] ?? {}),
		textOf: (value) => portableTextOf(rows, value),
		slotsOf: (node) => slotsOf(rows, node),
		readSlots: (node, path, flags) => readSlots(rows, node, path, flags)
	});

const withoutMember = (path: string, name: string): PortableBuildTable => {
	const at = table.paths[path]!;
	return { ...table, paths: { ...table.paths, [path]: { ...at, arms: at.arms.map((arm) => ({ ...arm, members: arm.members.filter((member) => member.name !== name) })) } } };
};

const carriesOf = (built: PortableBuildTable, source: string) => {
	const carries: { readonly text: string; readonly carry: PortableCarry }[] = [];
	readerOf(built)(engine.parse(source), (node, carry) => carries.push({ text: String(engine.render(node as never)), carry }));
	return carries;
};

describe('the portable read of a node with a named child no member reads', () => {
	it('carries the child, naming the slot that holds it', () => {
		expect(carriesOf(withoutMember('declaration.function', 'name'), 'fn f() {}')).toEqual([{ text: 'f', carry: { reason: 'unread', slot: 'name' } }]);
	});

	it('carries nothing when every named child is read', () => {
		expect(carriesOf(table, 'fn f(a: u8) -> u8 { a }')).toEqual([]);
	});
});
