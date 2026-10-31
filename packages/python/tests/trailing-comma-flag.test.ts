import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { portableRuntime } from '@sittir/common/engine';
import python from '../src/index.ts';

type Guard = (node: unknown) => boolean;

describe.each([
	['arena storage', {}],
	['object storage', { nodeStorage: 'object', nodeConstruction: 'object' }]
] as const)("a for clause's trailing comma is a flag, in %s", (_storage, storage) => {
	const runtimeOf = async () => portableRuntime(await createEngine(python, { api: 'strict', ...storage }));
	const trailingComma = (is: unknown): Guard => (is as { clause: { comprehension: { for: { trailing_comma: Guard } } } }).clause.comprehension.for.trailing_comma;

	it('holds on a parsed clause that writes the comma, and not on one that does not', async () => {
		const runtime = await runtimeOf();
		const clauses = (source: string): unknown[] => [...(runtime.engine.parse(source) as { $query(): { $descendants: { ofType(kind: number): Iterable<unknown> } } }).$query().$descendants.ofType(python.kinds.ForInClause)];
		expect(clauses('[x for x in a, b,]\n').map(trailingComma(runtime.is))).toEqual([true]);
		expect(clauses('[x for x in a, b]\n').map(trailingComma(runtime.is))).toEqual([false]);
	});

	it('holds on a built clause given the comma, and not on one given its blank arm or nothing', async () => {
		const runtime = await runtimeOf();
		const b = runtime.engine.build;
		const clause = (options?: { readonly trailingComma: typeof python.kinds.Comma | null }) =>
			b.forInClause({ left: b.identifier('x'), rights: [b.identifier('a'), b.identifier('b')] }, options);
		expect(trailingComma(runtime.is)(clause({ trailingComma: python.kinds.Comma }))).toBe(true);
		expect(trailingComma(runtime.is)(clause({ trailingComma: null }))).toBe(false);
		expect(trailingComma(runtime.is)(clause())).toBe(false);
	});

	it('reads and builds a clause back with its comma, and one without it without', async () => {
		const runtime = await runtimeOf();
		const roundTrip = (source: string): string => String(runtime.engine.render(runtime.build(runtime.read(runtime.engine.parse(source)) as never) as never));
		expect(roundTrip('[x for x in a, b,]\n')).toBe('[x for x in a, b,]\n');
		expect(roundTrip('[x for x in a, b]\n')).toBe('[x for x in a, b]\n');
	});
});
