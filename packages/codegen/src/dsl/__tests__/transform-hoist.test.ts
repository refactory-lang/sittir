/**
 * transform-hoist.test.ts — unit coverage for tryHoistSiblingVariants.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { variant } from '../primitives/variant.ts';
import { withWireContext } from '../wire/wire.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

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

		expect(ctx.polymorphVariants).toContainEqual({
			parent: 'demo',
			child: 'empty'
		});
		expect(ctx.polymorphVariants).toContainEqual({
			parent: 'demo',
			child: 'list'
		});
	});

	it('skips hoist when no variant alternative matches empty (non-empty alts go per-patch)', () => {
		const { ctx } = withWireContext('nonempty', () => {
			const g = globalThis as any;
			const original = g.seq(
				{ type: 'STRING', value: '(' } as any,
				g.choice({ type: 'SYMBOL', name: 'X' } as any, { type: 'SYMBOL', name: 'Y' } as any),
				{ type: 'STRING', value: ')' } as any
			);
			transform(original, {
				'1/0': variant('x'),
				'1/1': variant('y')
			});
		});
		expect(ctx.conflictGroups).toEqual([]);
	});

	it('bails on mixed choice positions (variants at different choicePos)', () => {
		const { ctx } = withWireContext('mixed', () => {
			const g = globalThis as any;
			const original = g.seq(
				g.choice({ type: 'SYMBOL', name: 'A' } as any, { type: 'SYMBOL', name: 'B' } as any),
				{ type: 'STRING', value: '|' } as any,
				g.choice({ type: 'SYMBOL', name: 'C' } as any, { type: 'SYMBOL', name: 'D' } as any)
			);
			transform(original, {
				'0/0': variant('left_a'),
				'2/0': variant('right_c')
			});
		});
		expect(ctx.conflictGroups).toEqual([]);
		expect(ctx.polymorphVariants.map((v) => v.child).sort()).toEqual(['left_a', 'right_c']);
	});
});
