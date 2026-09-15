import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { transform } from '../transform/transform.ts';
import { variant } from '../primitives/variant.ts';
import { withWireContext } from '../wire/wire.ts';
import type { Rule } from '../../types/rule.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const sym = (name: string): Rule => ({ type: 'SYMBOL', name }) as Rule;
const str = (value: string): Rule => ({ type: 'STRING', value }) as Rule;

beforeAll(() => {
	installFakeDsl();
});
afterAll(() => {
	restoreFakeDsl();
});

describe('polymorph metadata registration', () => {
	// R12/decision-7 V2 Task 2: `WireContext.polymorphVariants` (the
	// wire-registered `{parent, child}` pair channel) is deleted —
	// variant-adoption pairs are now discovered STRUCTURALLY downstream
	// (`deriveStructuralVariantChildren`, compiler/variant-structural.ts)
	// from the alias-mint shape `transform()` still resolves here. This
	// suite now asserts the SURVIVING resolution behavior directly:
	// each variant() placeholder deposits its variant-rule body and the
	// choice arm resolves to a symbol naming that rule, annotated with
	// the variant — the structural fact the downstream derivation keys on.
	it('resolves variant placeholders into deposited variant rules + annotated symbol arms', () => {
		const original = {
			type: 'SEQ',
			members: [
				sym('left'),
				{
					type: 'CHOICE',
					members: [
						{ type: 'SEQ', members: [str('='), sym('right')] },
						{ type: 'SEQ', members: [str(':'), sym('type')] }
					]
				}
			]
		} as Rule;

		const { ctx, result } = withWireContext('assignment', () => {
			return transform(original, {
				'1/0': variant('eq'),
				'1/1': variant('type')
			});
		});

		expect([...ctx.deposits.keys()].sort()).toEqual(['assignment_eq', 'assignment_type']);
		// Sibling variants hoist whole-arm: each deposited body carries the
		// parent's `left` before its own arm, and the parent collapses to the
		// pure choice of the two variant symbols.
		const eq = ctx.deposits.get('assignment_eq') as unknown as { type: string; members: { name?: string; type: string }[] };
		expect(eq.type).toBe('SEQ');
		expect(eq.members[0]).toMatchObject({ type: 'SYMBOL', name: 'left' });
		const choice = result as unknown as { type: string; members: unknown[] };
		expect(choice.type).toBe('CHOICE');
		expect(choice.members).toMatchObject([
			{ type: 'SYMBOL', name: 'assignment_eq', annotations: { variant: 'eq', variantOf: 'assignment' } },
			{ type: 'SYMBOL', name: 'assignment_type', annotations: { variant: 'type', variantOf: 'assignment' } }
		]);
	});

	it('throws when variant() is used without a current rule kind', () => {
		const original = {
			type: 'SEQ',
			members: [sym('a'), { type: 'CHOICE', members: [sym('b'), sym('c')] }]
		} as Rule;

		expect(() => {
			withWireContext(null, () => {
				transform(original, {
					'1/0': variant('b')
				});
			});
		}).toThrow(/no current rule kind/);
	});

	it('accumulates deposited variant rules independently across separate wire contexts', () => {
		// A bare `sym()` arm (no anonymous token) is unmaterializable
		// (`variantBranchIsUnmaterializable`) and deposits nothing; use a
		// SEQ-with-literal arm shape so the mint actually fires.
		const makeChoice = (aVal: string, bVal: string) =>
			({
				type: 'SEQ',
				members: [
					{
						type: 'CHOICE',
						members: [
							{ type: 'SEQ', members: [str(aVal), sym('x')] },
							{ type: 'SEQ', members: [str(bVal), sym('y')] }
						]
					}
				]
			}) as Rule;

		const { ctx: ctx1 } = withWireContext('rule_one', () => {
			transform(makeChoice('=', ':'), { '0/0': variant('a'), '0/1': variant('b') });
		});
		const { ctx: ctx2 } = withWireContext('rule_two', () => {
			transform(makeChoice('+', '-'), { '0/0': variant('x') });
		});

		expect([...ctx1.deposits.keys()].sort()).toEqual(['rule_one_a', 'rule_one_b']);
		expect([...ctx2.deposits.keys()].sort()).toEqual(['rule_two_x']);
	});
});
