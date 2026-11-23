import { describe, expect, it } from 'vitest';
import rust from '@sittir/rust';
import type { PortableBuildTable } from '@sittir/types';
import { createEngine } from '../src/create-engine.ts';
import { classifierOf, flagHolds, otherTested, portableTextOf, readSlots, slotsOf } from '../src/portable/classify.ts';
import { portableReader, type PortableCarry } from '../src/portable/read.ts';

const engine = await createEngine(rust, { api: 'strict' });
const rows = engine.portable!;
const table = await (await rust.load()).portableBuild!();

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

const withoutSlot = (path: string, name: string): PortableBuildTable => {
	const at = table.paths[path]!;
	return { ...table, paths: { ...table.paths, [path]: { ...at, arms: at.arms.map((arm) => ({ ...arm, slots: arm.slots.filter((slot) => slot.name !== name) })) } } };
};

const carriesOf = (built: PortableBuildTable, source: string) => {
	const carries: { readonly text: string; readonly carry: PortableCarry }[] = [];
	readerOf(built)(engine.parse(source), (node, carry) => carries.push({ text: String(engine.render(node as never)), carry }));
	return carries;
};

describe('the portable read of a node with a named child no slot reads', () => {
	it('keeps the node whole, naming the slot that holds the child', () => {
		const built = withoutSlot('declaration.function', 'name');
		expect(carriesOf(built, 'fn f() {}')).toEqual([{ text: 'fn f() {}', carry: { reason: 'unread', slot: 'name' } }]);
		const [kept] = (readerOf(built)(engine.parse('fn f() {}')) as { readonly statements: readonly unknown[] }).statements;
		expect(String(engine.render(kept as never))).toBe('fn f() {}');
	});

	it('carries nothing when every named child is read', () => {
		expect(carriesOf(table, 'fn f(a: u8) -> u8 { a }')).toEqual([]);
	});
});

describe('the portable read of a number no arm can read as a value', () => {
	const armsOf = (path: string, change: (arm: PortableBuildTable['paths'][string]['arms'][number]) => PortableBuildTable['paths'][string]['arms'][number]): PortableBuildTable => {
		const at = table.paths[path]!;
		return { ...table, paths: { ...table.paths, [path]: { ...at, arms: at.arms.map(change) } } };
	};

	it('keeps the node where the arm has no slots that spell its value', () => {
		const built = armsOf('literal.number.float', (arm) => ({ ...arm, numeric: [] }));
		expect(carriesOf(built, 'fn f() { 1.5; }')).toEqual([{ text: '1.5', carry: { reason: 'scalar' } }]);
	});

	it('keeps the node where its arm of a number path takes no number', () => {
		const at = table.paths['literal.number.float']!;
		const [arm] = at.arms;
		const { scalar, ...plain } = arm!;
		const built = { ...table, paths: { ...table.paths, 'literal.number.float': { ...at, arms: [plain, { ...plain, kind: -1, scalar }] } } };
		expect(carriesOf(built, 'fn f() { 1.5; }')).toEqual([{ text: '1.5', carry: { reason: 'scalar' } }]);
	});
});
