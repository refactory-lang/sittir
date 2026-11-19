import { afterAll, describe, expect, it } from 'vitest';
import { loadKindNameFromId, loadSlotAccessorOf, storageEngineOf } from '../src/validate/common.ts';
import {
	ACCEPTED_DIFFERENCES,
	differencesOf,
	storageFactsOf,
	verdictOf,
	type Difference,
	type SourceFacts,
	type StorageCheck,
	type StorageParityReport
} from '../src/validate/storage-parity.ts';

const SOURCE = 'fn f(a: u8, /* c */ b: u8) {\n    let x = 1 + ;\n    g(a, b);\n}\n// tail\n';
const object = await storageEngineOf('rust', 'object');
const arena = await storageEngineOf('rust', 'arena');
afterAll(() => {
	object.dispose();
	arena.dispose();
});
const lookups = { slotsOf: await loadSlotAccessorOf('rust'), kindNameOf: await loadKindNameFromId('rust') };

const report = (
	differences: readonly Difference[],
	counts: Partial<Pick<StorageParityReport, 'measuredRuns'> & { sources: number }> = {}
): StorageParityReport => ({
	grammars: ['python', 'rust', 'typescript'],
	compared: { snapshots: counts.sources ?? 1, renders: 1, layoutRuns: 1, rebuilds: 1, writeBacks: 1 },
	measuredRuns: counts.measuredRuns ?? 1,
	differences
});
const rebuild = (grammar: string, objectText: string, arenaText: string): Difference => ({
	check: 'rebuilds',
	grammar,
	entry: 'e',
	node: 1,
	kind: 'arguments',
	object: objectText,
	arena: arenaText
});
const writeBack = (grammar: string, node: number, side: string, holdsError: boolean): Difference => ({
	check: 'writeBacks',
	grammar,
	entry: 'e',
	node,
	kind: 'k',
	side,
	holdsError,
	object: 'a',
	arena: 'b'
});

describe('storage parity', () => {
	it('finds no difference between the two storages on a source holding a list, a comment and an ERROR', () => {
		const [objectFacts, arenaFacts] = [storageFactsOf(object, lookups, SOURCE), storageFactsOf(arena, lookups, SOURCE)];
		expect(objectFacts.nodes.length).toBeGreaterThan(10);
		expect(objectFacts.nodes.some((node) => node.rebuild !== undefined)).toBe(true);
		expect(objectFacts.sides.some((side) => side.holdsError)).toBe(true);
		expect(differencesOf('rust', 'source', objectFacts, arenaFacts)).toEqual([]);
	});

	it('goes red on a difference injected into each fact of one storage', () => {
		const facts = storageFactsOf(object, lookups, SOURCE);
		const listed = facts.nodes.findIndex((node) => node.rebuild !== undefined);
		const held = facts.sides.findIndex((side) => side.node !== 0 && !side.holdsError);
		expect(listed).toBeGreaterThan(0);
		expect(held).toBeGreaterThanOrEqual(0);
		const injected: readonly (readonly [StorageCheck, SourceFacts])[] = [
			['snapshots', { ...facts, errors: `${facts.errors}0` }],
			['snapshots', { ...facts, snapshot: { injected: true } }],
			[
				'renders',
				{ ...facts, nodes: facts.nodes.map((node, at) => (at === 1 ? { ...node, render: `${node.render} ` } : node)) }
			],
			[
				'rebuilds',
				{
					...facts,
					nodes: facts.nodes.map((node, at) => (at === listed ? { ...node, rebuild: `${node.rebuild} ` } : node))
				}
			],
			[
				'writeBacks',
				{
					...facts,
					sides: facts.sides.map((side, at) => (at === held ? { ...side, written: `${side.written}\n` } : side))
				}
			]
		];
		for (const [check, arenaFacts] of injected) {
			const differences = differencesOf('rust', 'source', facts, arenaFacts);
			expect(differences.map((difference) => difference.check)).toEqual([check]);
			const verdict = verdictOf(report(differences));
			expect(verdict.passes, check).toBe(false);
			expect(verdict.unaccepted).toEqual(differences);
		}
		const runs: Difference = {
			check: 'layoutRuns',
			grammar: 'rust',
			entry: 'source',
			parity: { nodes: 3, differing: 0, runs: 2, measuredRuns: 1, differingRuns: 1, firstRun: 4 }
		};
		expect(verdictOf(report([runs])).passes).toBe(false);
	});

	const rootInner = ACCEPTED_DIFFERENCES.find((accepted) => accepted.ceilings.rust !== undefined)!;

	it('accepts an accepted shape up to its ceiling in each grammar, and fails one past it', () => {
		const inner = writeBack('rust', 0, 'inner', false);
		expect(verdictOf(report(Array.from({ length: 6 }, () => inner))).passes).toBe(true);
		const over = verdictOf(report(Array.from({ length: 7 }, () => inner)));
		expect(over.passes).toBe(false);
		expect(over.unaccepted).toEqual([]);
		expect(over.accepted).toContainEqual({ name: rootInner.name, grammar: 'rust', count: 7, ceiling: 6 });
		expect(verdictOf(report([writeBack('typescript', 0, 'inner', false)])).passes).toBe(false);
	});

	it('refuses a rebuild that throws in either storage alone', () => {
		expect(verdictOf(report([rebuild('rust', 'throws: Missing field `_content`', '(a)')])).unaccepted).toHaveLength(1);
		expect(verdictOf(report([rebuild('rust', '(a)', 'throws: Missing field')])).unaccepted).toHaveLength(1);
	});

	it('reports an accepted count under its ceiling and passes', () => {
		const verdict = verdictOf(report([]));
		expect(verdict.passes).toBe(true);
		expect(verdict.accepted).toContainEqual({ name: rootInner.name, grammar: 'rust', count: 0, ceiling: 6 });
	});

	it("accepts a written-back side holding an ERROR in python and typescript, and a root's inner side in rust", () => {
		expect(
			verdictOf(
				report([
					writeBack('python', 3, 'trailing', true),
					writeBack('typescript', 3, 'leading', true),
					writeBack('rust', 0, 'inner', false)
				])
			).passes
		).toBe(true);
		expect(verdictOf(report([writeBack('rust', 1, 'inner', false)])).unaccepted).toHaveLength(1);
		expect(verdictOf(report([writeBack('rust', 0, 'leading', false)])).unaccepted).toHaveLength(1);
		expect(verdictOf(report([writeBack('rust', 3, 'trailing', true)])).passes).toBe(false);
	});

	it('fails a report that read no source or measured no layout run, so parity cannot pass on nothing', () => {
		expect(verdictOf(report([], { sources: 0 })).passes).toBe(false);
		expect(verdictOf(report([], { measuredRuns: 0 })).passes).toBe(false);
	});
});
