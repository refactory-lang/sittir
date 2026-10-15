import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';
import { hooks } from '../src/api.ts';
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
				.$descendants.ofType(ts.kinds.MethodDefinition)
				.where((c) => c.static.eq(true))
		];
		expect(found).toHaveLength(2);
		expect(plans).toContainEqual(queryFlags[TSKindId.MethodDefinition]!['static']);
	});

	it('is marked on every keyword slot of a member that claims the flag', () => {
		expect(Object.keys(queryFlags[TSKindId.MethodDefinition]!)).toEqual(
			expect.arrayContaining(['static', 'override', 'readonly', 'async'])
		);
		expect(queryFlags[TSKindId.ArrowFunction]!['async']).toEqual({ op: 'present', fields: ['async'], kinds: [] });
	});
});
