/**
 * transform-hoist.test.ts — unit coverage for tryHoistSiblingVariants.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { variant } from '../primitives/variant.ts';
import { withWireContext, getCurrentWireContext } from '../wire/wire.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const ctx0 = () => getCurrentWireContext()!;

describe('tryHoistSiblingVariants (via transform)', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('hoists sibling variants through a parent prec wrapper and registers them as self-conflicts', () => {
		const { result: patched, ctx } = withWireContext('demo', () => {
			const g = globalThis as any;
			const original = g.prec.left(
				2,
				g.seq(
					{ type: 'STRING', value: '[' } as any,
					g.choice({ type: 'BLANK' } as any, g.repeat({ type: 'SYMBOL', name: 'X' } as any)),
					{ type: 'STRING', value: ']' } as any
				)
			);
			return transform(original, {
				'1/0': variant('empty'),
				'1/1': variant('list')
			}) as any;
		});

		expect(patched.type).toBe('CHOICE');
		expect(patched.members).toHaveLength(2);
		expect(patched.members[0].type).toBe('ALIAS');
		expect(patched.members[0].value).toBe('demo_empty');
		expect(patched.members[0].content.type).toBe('SYMBOL');
		expect(patched.members[0].content.name).toBe('_demo_empty');
		expect(patched.members[1].value).toBe('demo_list');
		expect(patched.members[1].content.name).toBe('_demo_list');

		expect(ctx.deposits.has('_demo_empty')).toBe(true);
		expect(ctx.deposits.has('_demo_list')).toBe(true);
		const emptyBody: any = ctx.deposits.get('_demo_empty');
		expect(emptyBody.type).toBe('PREC_LEFT');
		expect(emptyBody.value).toBe(2);

		expect(ctx.conflictGroups).toContainEqual(['_demo_empty', '_demo_list']);
		expect(ctx.conflictGroups).toContainEqual(['_demo_empty']);
		expect(ctx.conflictGroups).toContainEqual(['_demo_list']);

		// R12/decision-7 V2 Task 2: `ctx.polymorphVariants` (the wire pair
		// channel) is deleted — the surviving facts are the deposited hidden
		// rules + named ALIAS arms already asserted above (lines 34-42),
		// which is exactly what downstream `deriveStructuralVariantChildren`
		// keys on instead of a registered pair.
	});

	it('hoists non-empty sibling variants whole-arm too: each variant carries the scaffolding and the parent is a pure choice', () => {
		const { ctx, result } = withWireContext('nonempty', () => {
			const g = globalThis as any;
			const original = g.seq(
				{ type: 'STRING', value: '(' } as any,
				g.choice({ type: 'SYMBOL', name: 'X' } as any, { type: 'SYMBOL', name: 'Y' } as any),
				{ type: 'STRING', value: ')' } as any
			);
			return transform(original, {
				'1/0': variant('x'),
				'1/1': variant('y')
			});
		});
		expect([...ctx.deposits.keys()].sort()).toEqual(['_nonempty_x', '_nonempty_y']);
		const x = ctx.deposits.get('_nonempty_x') as unknown as { type: string; members: { type: string; value?: string; name?: string }[] };
		expect(x.type).toBe('SEQ');
		expect(x.members.map((m) => m.value ?? m.name)).toEqual(['(', 'X', ')']);
		expect((result as { type: string }).type).toBe('CHOICE');
		expect(ctx.conflictGroups).toEqual([['_nonempty_x', '_nonempty_y'], ['_nonempty_x'], ['_nonempty_y']]);
	});

	it('mints an implicit variant for an arm no variant() names, under the arm naming taxonomy', () => {
		const { ctx } = withWireContext('partial', () => {
			ctx0().preRegisteredHidden.add('_partial_arm');
			const g = globalThis as any;
			const original = g.seq(
				{ type: 'STRING', value: '[' } as any,
				g.choice({ type: 'SYMBOL', name: 'X' } as any, { type: 'BLANK' } as any),
				{ type: 'STRING', value: ']' } as any
			);
			return transform(original, { '1/0': variant('x') });
		});
		expect([...ctx.deposits.keys()].sort()).toEqual(['_partial_arm', '_partial_x']);
		const bare = ctx.deposits.get('_partial_arm') as unknown as { members: { type: string; value?: string }[] };
		expect(bare.members.map((m) => m.value ?? m.type)).toEqual(['[', ']']);
	});

	it('bails when an implicit arm was not pre-registered, so the parser never meets an undefined symbol', () => {
		const { ctx } = withWireContext('unregistered', () => {
			const g = globalThis as any;
			const original = g.seq(
				{ type: 'STRING', value: '[' } as any,
				g.choice({ type: 'SYMBOL', name: 'X' } as any, { type: 'BLANK' } as any),
				{ type: 'STRING', value: ']' } as any
			);
			return transform(original, { '1/0': variant('x') });
		});
		expect(ctx.deposits.has('_unregistered_arm')).toBe(false);
	});

	it('bails on mixed choice positions (variants at different choicePos)', () => {
		const { ctx } = withWireContext('mixed', () => {
			const g = globalThis as any;
			// Bare `SYMBOL` arms (no anonymous token) are unmaterializable
			// (`variantBranchIsUnmaterializable`) and deposit nothing; use a
			// SEQ-with-literal arm shape at each targeted position so the
			// mint actually fires.
			const original = g.seq(
				g.choice(
					{
						type: 'SEQ',
						members: [
							{ type: 'STRING', value: '=' },
							{ type: 'SYMBOL', name: 'A' }
						]
					} as any,
					{
						type: 'SEQ',
						members: [
							{ type: 'STRING', value: ':' },
							{ type: 'SYMBOL', name: 'B' }
						]
					} as any
				),
				{ type: 'STRING', value: '|' } as any,
				g.choice(
					{
						type: 'SEQ',
						members: [
							{ type: 'STRING', value: '+' },
							{ type: 'SYMBOL', name: 'C' }
						]
					} as any,
					{
						type: 'SEQ',
						members: [
							{ type: 'STRING', value: '-' },
							{ type: 'SYMBOL', name: 'D' }
						]
					} as any
				)
			);
			transform(original, {
				'0/0': variant('left_a'),
				'2/0': variant('right_c')
			});
		});
		expect(ctx.conflictGroups).toEqual([]);
		// R12/decision-7 V2 Task 2: assert the per-patch (non-hoist)
		// resolution's deposited hidden rules instead of the deleted
		// `ctx.polymorphVariants` pair channel.
		expect([...ctx.deposits.keys()].sort()).toEqual(['_mixed_left_a', '_mixed_right_c']);
	});
});
