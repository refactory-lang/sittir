/**
 * transform-hoist.test.ts — unit coverage for tryHoistSiblingVariants.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { variant } from '../primitives/variant.ts';
import { withWireContext } from '../wire/wire.ts';
import { setGroupLiftRuleMap } from '../transform/transform-path.ts';
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
		expect(patched.members[0].type).toBe('SYMBOL');
		expect(patched.members[0].name).toBe('demo_empty');
		expect(patched.members[1].type).toBe('SYMBOL');
		expect(patched.members[1].name).toBe('demo_list');

		expect(ctx.deposits.has('demo_empty')).toBe(true);
		expect(ctx.deposits.has('demo_list')).toBe(true);
		const emptyBody: any = ctx.deposits.get('demo_empty');
		expect(emptyBody.type).toBe('PREC_LEFT');
		expect(emptyBody.value).toBe(2);

		expect(ctx.conflictGroups).toContainEqual(['demo_empty', 'demo_list']);
		expect(ctx.conflictGroups).toContainEqual(['demo_empty']);
		expect(ctx.conflictGroups).toContainEqual(['demo_list']);
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
		expect([...ctx.deposits.keys()].sort()).toEqual(['nonempty_x', 'nonempty_y']);
		const x = ctx.deposits.get('nonempty_x') as unknown as { type: string; members: { type: string; value?: string; name?: string }[] };
		expect(x.type).toBe('SEQ');
		expect(x.members.map((m) => m.value ?? m.name)).toEqual(['(', 'X', ')']);
		expect((result as { type: string }).type).toBe('CHOICE');
		expect(ctx.conflictGroups).toEqual([['nonempty_x', 'nonempty_y'], ['nonempty_x'], ['nonempty_y']]);
	});

	it('carries an unnamed arm that enrich already lifted: the lift keeps its name and takes the scaffolding', () => {
		const lifts = new Map<string, unknown>([['_lifted_arm', { type: 'SEQ', members: [{ type: 'STRING', value: '=' }, { type: 'SYMBOL', name: 'Y' }] }]]);
		setGroupLiftRuleMap({
			get: (n) => lifts.get(n) as never,
			set: (n, b) => void lifts.set(n, b)
		});
		try {
			const { ctx, result } = withWireContext('lifted', () => {
				const g = globalThis as any;
				const liftArm = {
					type: 'ALIAS',
					content: { type: 'SYMBOL', name: '_lifted_arm', metadata: { author: 'enrich' } },
					named: true,
					value: 'lifted_arm'
				};
				const original = g.seq(
					{ type: 'STRING', value: '[' } as any,
					g.choice({ type: 'SEQ', members: [{ type: 'STRING', value: ':' }, { type: 'SYMBOL', name: 'X' }] } as any, liftArm as any),
					{ type: 'STRING', value: ']' } as any
				);
				return transform(original, { '1/0': variant('x') });
			});
			expect([...ctx.deposits.keys()]).toEqual(['lifted_x']);
			const lift = lifts.get('_lifted_arm') as { members: { type: string; value?: string; name?: string }[] };
			expect(lift.members.map((m) => m.value ?? m.name ?? m.type)).toEqual(['[', 'SEQ', ']']);
			expect((result as unknown as { type: string; members: { name?: string; value?: string }[] }).members.map((m) => m.name ?? m.value)).toEqual([
				'lifted_x',
				'lifted_arm'
			]);
		} finally {
			setGroupLiftRuleMap(undefined);
		}
	});

	it('keeps the per-arm form when an unnamed arm has no enrich lift to carry it', () => {
		const { ctx } = withWireContext('bare', () => {
			const g = globalThis as any;
			const original = g.seq(
				{ type: 'STRING', value: '[' } as any,
				g.choice({ type: 'SEQ', members: [{ type: 'STRING', value: ':' }, { type: 'SYMBOL', name: 'X' }] } as any, { type: 'BLANK' } as any),
				{ type: 'STRING', value: ']' } as any
			);
			return transform(original, { '1/0': variant('x') });
		});
		expect(ctx.conflictGroups).toEqual([]);
	});

	describe('variants of a choice under optional()', () => {
		const refRule = (g: any, optionalOf: (content: unknown) => unknown) =>
			g.seq(
				{ type: 'STRING', value: '&' },
				optionalOf(
					g.choice(
						g.seq({ type: 'STRING', value: 'raw' }, { type: 'STRING', value: 'const' }),
						g.seq({ type: 'STRING', value: 'raw' }, { type: 'SYMBOL', name: 'mutable_specifier' })
					)
				),
				g.field('value', { type: 'SYMBOL', name: 'expression' })
			);
		const armPatches = { '1/0/0': variant('raw_const'), '1/0/1': variant('raw_mut') };
		const bodyTokens = (body: any): string[] =>
			body.members.map((m: any) => m.value ?? m.name ?? (m.type === 'SEQ' ? m.members.map((x: any) => x.value ?? x.name).join(' ') : m.type));

		it('mints the parent without the optional as the default bare variant', () => {
			const { result, ctx } = withWireContext('ref', () => {
				const g = globalThis as any;
				return transform(refRule(g, g.optional), armPatches) as any;
			});
			expect(result.type).toBe('CHOICE');
			expect(result.members.map((m: any) => [m.name, m.annotations?.variant])).toEqual([
				['ref_raw_const', 'raw_const'],
				['ref_raw_mut', 'raw_mut'],
				['ref_bare', 'bare']
			]);
			expect(bodyTokens(ctx.deposits.get('ref_bare'))).toEqual(['&', 'value']);
			expect(bodyTokens(ctx.deposits.get('ref_raw_const'))).toEqual(['&', 'raw const', 'value']);
		});

		it('names the absent variant from variant(name, { absent: true }) on the optional', () => {
			const { ctx } = withWireContext('ref', () => {
				const g = globalThis as any;
				return transform(refRule(g, g.optional), { ...armPatches, '1': variant('plain', { absent: true }) });
			});
			expect([...ctx.deposits.keys()].sort()).toEqual(['ref_plain', 'ref_raw_const', 'ref_raw_mut']);
		});

		it('treats tree-sitter\'s choice(x, blank) spelling of optional the same way', () => {
			const { ctx } = withWireContext('ref', () => {
				const g = globalThis as any;
				return transform(refRule(g, (content) => g.choice(content, { type: 'BLANK' })), armPatches);
			});
			expect([...ctx.deposits.keys()].sort()).toEqual(['ref_bare', 'ref_raw_const', 'ref_raw_mut']);
		});

		it('throws when an absent variant is declared but the siblings cannot hoist', () => {
			expect(() =>
				withWireContext('ref', () => {
					const g = globalThis as any;
					return transform(refRule(g, g.optional), { '1/0/0': variant('raw_const'), '1': variant('plain', { absent: true }) });
				})
			).toThrow(/absent case only exists when the sibling variants hoist/);
		});
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
		expect([...ctx.deposits.keys()].sort()).toEqual(['mixed_left_a', 'mixed_right_c']);
	});
});
