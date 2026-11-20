import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isCoordinate } from '@sittir/common/utils';
import python from '../src/index.ts';

const SOURCE = 'match x:\n    case [a, b]:\n        pass\n';

function coordinatesOf(value: unknown, kind: number, seen = new Set<unknown>()): unknown[] {
	if (value === null || typeof value !== 'object' || seen.has(value)) return [];
	seen.add(value);
	if (isCoordinate(value)) return value.$type === kind ? [value] : [];
	const children = Array.isArray(value) ? value : Object.entries(value).flatMap(([key, child]) => (key.startsWith('_') ? [child] : []));
	return children.flatMap((child) => coordinatesOf(child, kind, seen));
}

function rootCause(error: unknown): string {
	let cause = error;
	while (cause instanceof Error && cause.cause !== undefined) cause = cause.cause;
	return String(cause);
}

describe.each(['arena', 'object'] as const)('a hoisted setter given an item of its wrapper`s kind, %s storage', (nodeStorage) => {
	async function listOf() {
		const engine = await createEngine(python, { nodeStorage, verifyStructure: 'runtime' });
		const kinds = engine.kinds as unknown as Record<string, number>;
		const root: any = engine.parse(SOURCE);
		const list: any = [...root.$query().$descendants].find((node: any) => node?.$type === kinds.CaseListPattern);
		const [first, second] = list.elements();
		return { engine, kinds, root, list, first, second };
	}

	it('passes a built node of that kind through', async () => {
		const { engine, list, first, second } = await listOf();
		using _ = engine;
		expect(String(list.$with.elements((engine.build as any).casePattern(first), second).$render())).toBe('[a, b]');
	});

	it('passes a parsed node of that kind through', async () => {
		const { engine, kinds, root, list, second } = await listOf();
		using _ = engine;
		const parsed = [...root.$query().$descendants].filter((node: any) => node?.$type === kinds.CasePattern)[1];
		expect(String(list.$with.elements(parsed, second).$render())).toBe('[a, b]');
	});

	it('builds a config carrying that kind`s $type instead of passing it through as a node', async () => {
		const { engine, kinds, list, first, second } = await listOf();
		using _ = engine;
		let refusal: unknown;
		try {
			list.$with.elements({ $type: kinds.CasePattern, _content: first }, second);
		} catch (error) {
			refusal = error;
		}
		expect(rootCause(refusal)).toMatch(/CasePattern\.content: a strict factory takes a built .*, not a node of kind/);
	});
});

describe('a hoisted setter given a coordinate of its wrapper`s kind, object storage', () => {
	it('passes it through', async () => {
		using engine = await createEngine(python, { nodeStorage: 'object', verifyStructure: 'runtime' });
		const kinds = engine.kinds as unknown as Record<string, number>;
		const root: any = engine.parse(SOURCE, { depth: 4 });
		const [coordinate] = coordinatesOf(root, kinds.CasePattern!);
		expect(isCoordinate(coordinate)).toBe(true);
		const list: any = [...root.$query().$descendants].find((node: any) => node?.$type === kinds.CaseListPattern);
		const [, second] = list.elements();
		expect(String(list.$with.elements(coordinate, second).$render())).toBe('[[a, b], b]');
	});
});
